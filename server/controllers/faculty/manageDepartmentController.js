import mongoose from "mongoose";
import Group from "../../models/Group.js";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import XLSX from "xlsx";


export const exportUngroupedStudentsExcel = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const departmentId = req.faculty.department;
    const activeSession = await Session.getActiveSession();

    const students = await Student.find({
      department: departmentId,
      session: activeSession._id,
      groupId: null,
      isAvailableForInvite: true
    })
      .populate("user", "name email")
      .sort({rollNumber: 1})
      .lean();

    // Format data for Excel
    const data = students.map((s) => ({
      Name: s.user?.name || "",
      RollNumber: s.rollNumber,
      Email: s.user?.email || "",
      Semester: s.semester,
      Specialization: s.specialization || "",
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ungrouped Students");

    // Convert to buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Send file
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Ungrouped_Students.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (error) {
    next(error);
  }
};

export const exportUnsupervisedGroupsExcel = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const { sessionId, semester } = req.body;

    if (!sessionId || !semester) {
      return res.status(400).json({
        success: false,
        message: "sessionId and semester are required",
      });
    }

    if (![7, 8].includes(Number(semester))) {
      return res.status(400).json({
        success: false,
        message: "semester must be 7 or 8",
      });
    }

    const departmentId = new mongoose.Types.ObjectId(req.faculty.department);
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    const semesterNum = Number(semester);

    const groups = await Group.aggregate([
      {
        $match: {
          department: departmentId,
          session: sessionObjId,
          status: { $ne: "Draft" },
          supervisors: { $size: 0 },
        },
      },
      {
        $lookup: {
          from: "students",
          let: { gId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$groupId", "$$gId"] },
                semester: semesterNum,
                session: sessionObjId,
              },
            },
          ],
          as: "students",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "students.user",
          foreignField: "_id",
          as: "studentUsers",
        },
      },
      {
        $lookup: {
          from: "department",
          localField: "students.department",
          foreignField: "_id",
          as: "studentDepts",
        },
      },
    ]);

    /* ─── Flatten into rows ─── */

    const rows = [];
    let sNo = 1;

    groups
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .forEach((group) => {
        group.students.forEach((student) => {
          const user = group.studentUsers.find(
            (u) => u._id.toString() === student.user.toString()
          );
          const dept = group.studentDepts.find(
            (d) => d._id.toString() === student.department.toString()
          );

          rows.push({
            "S.No": sNo++,
            "Student Name": user?.name || "N/A",
            "Group Name": group.name,
            "Student Department": dept?.department || "N/A",
            "Roll Number": student.rollNumber || "N/A",
          });
        });
      });

    /* ─── Build Excel ─── */

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Student Name
      { wch: 20 }, // Group Name
      { wch: 25 }, // Student Department
      { wch: 15 }, // Roll Number
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unsupervised Groups");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Unsupervised_Groups.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportFullGroupsDataExcel = async (req, res, next) => {
  try {

    if (!req.faculty || !req.faculty.department) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { sessionId, semester } = req.body;

    if (!sessionId || !semester) {
      return res.status(400).json({
        success: false,
        message: "sessionId and semester are required",
      });
    }

    if (![7, 8].includes(Number(semester))) {
      return res.status(400).json({
        success: false,
        message: "semester must be 7 or 8",
      });
    }

    const departmentId = new mongoose.Types.ObjectId(req.faculty.department);
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    const semesterNum = Number(semester);

    // Fetch groups in the faculty's department, for the given session,
    // that are not in Draft, and have at least one supervisor.
    const groups = await Group.aggregate([
      {
        $match: {
          department: departmentId,
          session: sessionObjId,
          status: { $ne: "Draft" },
          supervisors: { $exists: true, $not: { $size: 0 } },
        },
      },

      // Join supervisors (Faculty)
      {
        $lookup: {
          from: "faculties",
          localField: "supervisors",
          foreignField: "_id",
          as: "supervisorDocs",
        },
      },

      // Join supervisor User records
      {
        $lookup: {
          from: "users",
          localField: "supervisorDocs.user",
          foreignField: "_id",
          as: "supervisorUsers",
        },
      },

      // Join supervisor DepartmentConfig records
      {
        $lookup: {
          from: "departments",
          localField: "supervisorDocs.department",
          foreignField: "_id",
          as: "supervisorDept",
        },
      },

      // Join students (only for the given semester)
      {
        $lookup: {
          from: "students",
          let: { gId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$groupId", "$$gId"] },
                semester: semesterNum,
                session: sessionObjId,
              },
            },
          ],
          as: "students",
        },
      },

      // Join student User records
      {
        $lookup: {
          from: "users",
          localField: "students.user",
          foreignField: "_id",
          as: "studentUsers",
        },
      },

      // Join student DepartmentConfig records
      {
        $lookup: {
          from: "department",
          localField: "students.department",
          foreignField: "_id",
          as: "studentDept",
        },
      },

      // Join project for this group + semester + session
      {
        $lookup: {
          from: "projects",
          let: { gId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$group", "$$gId"] },
                semester: semesterNum,
                session: sessionObjId,
              },
            },
          ],
          as: "project",
        },
      },

      // Only include groups that have a project
      { $match: { "project.0": { $exists: true } } },
    ]);

    /* ─── Format ─── */

    const rows = [];
    let sNo = 1;

    // Build flat supervisor strings per group
    const buildSupervisorInfo = (g) => {
      const names = g.supervisorDocs.map((sup) => {
        const u = g.supervisorUsers.find(
          (u) => u._id.toString() === sup.user.toString()
        );
        return u?.name || "N/A";
      });

      const depts = g.supervisorDocs.map((sup) => {
        const d = g.supervisorDept.find(
          (d) => d._id.toString() === sup.department.toString()
        );
        return d?.department || "N/A";
      });

      return {
        supervisorNames: names.join(", "),
        supervisorDepts: depts.join(", "),
      };
    };

    const proj = (g) => g.project[0]; // guaranteed to exist due to $match above

    groups
      .sort((a, b) => {
        // Sort by group name for a stable order
        return (a.name || "").localeCompare(b.name || "");
      })
      .forEach((g) => {
        const { supervisorNames, supervisorDepts } = buildSupervisorInfo(g);
        const project = proj(g);

        if (!g.students.length) {
          // Group with no students – still emit one row
          rows.push({
            "S.No": sNo++,
            "Student Name": "N/A",
            "Group Name": g.name,
            "Supervisor Name": supervisorNames,
            "Supervisor Department": supervisorDepts,
            "Student Department": "N/A",
            "Project Title": project.title,
            "Project Semester": project.semester,
          });
          return;
        }

        g.students.forEach((student) => {
          const studentUser = g.studentUsers.find(
            (u) => u._id.toString() === student.user.toString()
          );
          const studentDept = g.studentDeptConfigs.find(
            (d) => d._id.toString() === student.department.toString()
          );

          rows.push({
            "S.No": sNo++,
            "Student Name": studentUser?.name || "N/A",
            "Roll No.": student.rollNumber,
            "Group Name": g.name,
            "Supervisor Name": supervisorNames,
            "Supervisor Department": supervisorDepts,
            "Student Department": studentDept?.department || "N/A",
            "Project Title": project.title,
            "Project Semester": project.semester,
          });
        });
      });

    /* ─── Build Excel ─── */

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Column widths
    const colWidths = [
      { wch: 6 },   // S.No
      { wch: 25 },  // Student Name
      { wch: 20 },  // Group Name
      { wch: 30 },  // Supervisor Name
      { wch: 25 },  // Supervisor Department
      { wch: 25 },  // Student Department
      { wch: 40 },  // Project Title
      { wch: 16 },  // Project Semester
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Groups");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Groups_Semester${semesterNum}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};