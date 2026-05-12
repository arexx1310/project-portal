import mongoose from "mongoose";
import Student from "../../models/Student.js";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Publication from "../../models/Publication.js";

/**
 * GET /faculty/department/ug-students?sessionId=...&semester=7|8&page=1&limit=20
 *
 * Returns a paginated list of UG students in the faculty's department
 * for a given session (and optionally a semester filter).
 *
 * Access: PROJECT_COMMITTEE_HEAD | PROJECT_COMMITTEE_MEMBER | HOD
 *
 * Each row:
 *   sNo, studentName, rollNumber, groupName,
 *   supervisorNames[], projectTitle, publicationStatuses[],
 *   projectDocuments[{ label, url }]
 */
export const getUGStudentOverview = async (req, res) => {
  try {
    const facultyDepartmentId = req.faculty.department;

    const { sessionId, semester } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 40));
    const skip  = (page - 1) * limit;

    /* ── validate required params ── */
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Valid sessionId is required." });
    }

    /* ── build student filter ── */
    const studentFilter = {
      department: facultyDepartmentId,
      session: new mongoose.Types.ObjectId(sessionId),
      programType: "UG",
    };

    // semester is optional — if provided validate it's 7 or 8
    if (semester !== undefined) {
      const sem = parseInt(semester);
      if (![7, 8].includes(sem)) {
        return res.status(400).json({
          success: false,
          message: "For UG, semester must be 7 or 8.",
        });
      }
      studentFilter.semester = sem;
    }

    /* ── total count for pagination ── */
    const total = await Student.countDocuments(studentFilter);

    /* ── fetch students (lean, paginated) ── */
    const students = await Student.find(studentFilter)
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "name" })
      .lean();

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    /* ── collect groupIds that are actually set ── */
    const groupIds = [
      ...new Set(
        students
          .filter((s) => s.groupId)
          .map((s) => s.groupId.toString())
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    /* ── fetch groups with their supervisors ── */
    const groups = await Group.find({ _id: { $in: groupIds } })
      .populate({ path: "supervisors", populate: { path: "user", select: "name" } })
      .lean();

    const groupMap = Object.fromEntries(groups.map((g) => [g._id.toString(), g]));

    /* ── fetch one approved/in-progress project per group ── */
    const projects = await Project.find({
      group: { $in: groupIds },
      session: new mongoose.Types.ObjectId(sessionId),
    })
      .select("group title documents semester")
      .lean();

    // group → project (take the latest semester if multiple exist, e.g. sem 7 + sem 8)
    const projectMap = {};
    for (const p of projects) {
      const key = p.group.toString();
      if (!projectMap[key] || p.semester > projectMap[key].semester) {
        projectMap[key] = p;
      }
    }

    /* ── fetch publications per group ── */
    const publications = await Publication.find({
      group: { $in: groupIds },
      session: new mongoose.Types.ObjectId(sessionId),
    })
      .select("group status title published")
      .lean();

    // group → [publications]
    const publicationMap = {};
    for (const pub of publications) {
      const key = pub.group.toString();
      if (!publicationMap[key]) publicationMap[key] = [];
      publicationMap[key].push({ title: pub.title, status: pub.status, doi: pub.published?.doi, publishLink: pub.published?.link });
    }

    /* ── assemble response rows ── */
    const data = students.map((student, idx) => {
      const groupKey  = student.groupId?.toString();
      const group     = groupKey ? groupMap[groupKey]   : null;
      const project   = groupKey ? projectMap[groupKey] : null;
      const pubs      = groupKey ? (publicationMap[groupKey] ?? []) : [];

      const supervisorNames = group?.supervisors?.map(
        (f) => f.user?.name ?? "Unknown"
      ) ?? [];

      const projectDocuments = project?.documents?.map((d) => ({
        label: d.label,
        url:   d.url,
      })) ?? [];

      return {
        sNo:                skip + idx + 1,
        studentName:        student.user?.name ?? "—",
        rollNumber:         student.rollNumber,
        semester:           student.semester,
        specialization:     student.specialization ?? "—",
        groupName:          group?.name ?? "—",
        supervisorNames,
        projectTitle:       project?.title ?? "—",
        publicationStatuses: pubs,
        projectDocuments,
      };
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getUGStudentOverview]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


/**
 * GET /faculty/department/pg-students?sessionId=...&semester=1|2|3|4&page=1&limit=20
 *
 * Returns a paginated list of PG (MTech) students in the faculty's department
 * for a given session (and optionally a semester filter).
 *
 * Access: HOD only (PG programme — see route definition)
 *
 * Each row:
 *   sNo, studentName, rollNumber, specialization,
 *   groupName, supervisorNames[], projectTitle,
 *   publicationStatuses[], projectDocuments[{ label, url }]
 */
export const getPGStudentOverview = async (req, res) => {
  try {
    const facultyDepartmentId = req.faculty.department;

    const { sessionId, semester } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 40));
    const skip  = (page - 1) * limit;

    /* ── validate required params ── */
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Valid sessionId is required." });
    }

    /* ── build student filter ── */
    const studentFilter = {
      department: facultyDepartmentId,
      session: new mongoose.Types.ObjectId(sessionId),
      programType: "PG",
    };

    if (semester !== undefined) {
      const sem = parseInt(semester);
      if (![1, 2, 3, 4].includes(sem)) {
        return res.status(400).json({
          success: false,
          message: "For PG, semester must be 1, 2, 3, or 4.",
        });
      }
      studentFilter.semester = sem;
    }

    /* ── total count for pagination ── */
    const total = await Student.countDocuments(studentFilter);

    /* ── fetch students ── */
    const students = await Student.find(studentFilter)
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "name" })
      .lean();

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    /* ── collect groupIds ── */
    const groupIds = [
      ...new Set(
        students
          .filter((s) => s.groupId)
          .map((s) => s.groupId.toString())
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    /* ── fetch groups ── */
    const groups = await Group.find({ _id: { $in: groupIds } })
      .populate({ path: "supervisors", populate: { path: "user", select: "name" } })
      .lean();

    const groupMap = Object.fromEntries(groups.map((g) => [g._id.toString(), g]));

    /* ── fetch projects per group ── */
    const projects = await Project.find({
      group: { $in: groupIds },
      session: new mongoose.Types.ObjectId(sessionId),
    })
      .select("group title documents semester")
      .lean();

    const projectMap = {};
    for (const p of projects) {
      const key = p.group.toString();
      if (!projectMap[key] || p.semester > projectMap[key].semester) {
        projectMap[key] = p;
      }
    }

    /* ── fetch publications per group ── */
    const publications = await Publication.find({
      group: { $in: groupIds },
      session: new mongoose.Types.ObjectId(sessionId),
    })
      .select("group status title published")
      .lean();

    const publicationMap = {};
    for (const pub of publications) {
      const key = pub.group.toString();
      if (!publicationMap[key]) publicationMap[key] = [];
      publicationMap[key].push({ title: pub.title, status: pub.status, doi:pub.published?.doi, publishLink: pub.published?.link });
    }

    /* ── assemble response rows ── */
    const data = students.map((student, idx) => {
      const groupKey  = student.groupId?.toString();
      const group     = groupKey ? groupMap[groupKey]   : null;
      const project   = groupKey ? projectMap[groupKey] : null;
      const pubs      = groupKey ? (publicationMap[groupKey] ?? []) : [];

      const supervisorNames = group?.supervisors?.map(
        (f) => f.user?.name ?? "Unknown"
      ) ?? [];

      const projectDocuments = project?.documents?.map((d) => ({
        label: d.label,
        url:   d.url,
      })) ?? [];

      return {
        sNo:                skip + idx + 1,
        studentName:        student.user?.name ?? "—",
        rollNumber:         student.rollNumber,
        semester:           student.semester,
        groupName:          group?.name ?? "—",
        supervisorNames,
        projectTitle:       project?.title ?? "—",
        publicationStatuses: pubs,
        projectDocuments,
      };
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getPGStudentOverview]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

