import mongoose from "mongoose";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import Session from "../../models/Session.js";


/**
 * @desc Get all groups supervised by the faculty, filtered by session
 * @route GET /api/faculty/groups?sessionId=<id>
 * @access Private (attachFacultyProfile middleware required)
 */
export const getMyGroups = async (req, res, next) => {
  try {
    if (!req.faculty?.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    const { sessionId } = req.query;

    // Resolve which session to use
    let resolvedSession;

    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sessionId.",
        });
      }

      resolvedSession = await Session.findById(sessionId).select("_id name academicYear").lean();
      if (!resolvedSession) {
        return res.status(404).json({
          success: false,
          message: "Session not found.",
        });
      }
    } else {
      resolvedSession = await Session.getActiveSession();
      if (!resolvedSession) {
        return res.status(404).json({
          success: false,
          message: "No active session found. Please provide a sessionId.",
        });
      }
    }

    const facultyId = new mongoose.Types.ObjectId(req.faculty.id);

    const groups = await Group.find({
      supervisors: facultyId,
      session: resolvedSession._id,
    })
      .select("name status supervisors")
      .populate({
        path: "supervisors",
        select: "staffId",
        populate: { path: "user", select: "name -_id" },
      })
      .lean();

    if (groups.length === 0) {
      return res.status(200).json({
        success: true,
        session: {
          _id: resolvedSession._id,
          name: resolvedSession.name,
          academicYear: resolvedSession.academicYear,
        },
        count: 0,
        data: [],
      });
    }

    // Attach students to each group
    const groupIds = groups.map((g) => g._id);
    const allStudents = await Student.find({ groupId: { $in: groupIds } })
      .select("groupId rollNumber specialization semester")
      .populate("user", "name email -_id")
      .lean();

    const studentsByGroup = allStudents.reduce((acc, s) => {
      const key = String(s.groupId);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        name: s.user?.name || null,
        email: s.user?.email || null,
        rollNumber: s.rollNumber,
        specialization: s.specialization || null,
        semester: s.semester,
      });
      return acc;
    }, {});

    const data = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      status: g.status,
      supervisors: (g.supervisors || []).map((s) => ({
        name: s.user?.name || null,
        staffId: s.staffId,
      })),
      students: studentsByGroup[String(g._id)] || [],
    }));

    return res.status(200).json({
      success: true,
      session: {
        _id: resolvedSession._id,
        name: resolvedSession.name,
        academicYear: resolvedSession.academicYear,
      },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// /**
//  * @desc Get all projects for groups supervised by the faculty
//  * @route GET /api/faculty/projects?semester=7|8
//  * @access Private (attachFacultyProfile middleware required)
//  */
// export const getMyProjects = async (req, res, next) => {
//   try {
//     if (!req.faculty || !req.faculty.id) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized: Faculty profile not attached",
//       });
//     }

//     const facultyId = new mongoose.Types.ObjectId(req.faculty.id);

//     // Resolve the active session so we scope to current groups only
//     const activeSession = await Session.getActiveSession();
//     if (!activeSession) {
//       return res.status(200).json({ success: true, count: 0, data: [] });
//     }

//     // Find groups this faculty supervises in the active session
//     const supervisedGroups = await Group.find({
//       supervisors: facultyId,
//       session: activeSession._id,
//     })
//       .select("_id")
//       .lean();

//     if (supervisedGroups.length === 0) {
//       return res.status(200).json({ success: true, count: 0, data: [] });
//     }

//     const groupIds = supervisedGroups.map((g) => g._id);

//     const { semester } = req.query; // optional filter: 7 or 8
//     const query = { group: { $in: groupIds } };

//     if (semester && [7, 8].includes(Number(semester))) {
//       query.semester = Number(semester);
//     }

//     const projects = await Project.find(query)
//       .select("title domain semester status group session createdAt")
//       .populate("group", "name")
//       .populate("session", "name year -_id")
//       .sort({ createdAt: -1 })
//       .lean();

//     return res.status(200).json({
//       success: true,
//       count: projects.length,
//       data: projects,
//     });
//   } catch (error) {
//     next(error);
//   }
// };


/**
 * @desc    Get full group details with students and projects
 * @route   GET /api/faculty/managegroup/groups/:groupId
 * @access  Private (Faculty only)
 */
export const getFullGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID.",
      });
    }

    if (!req.faculty || !req.faculty.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    const facultyId = new mongoose.Types.ObjectId(req.faculty.id);

    // Authorization: faculty must be a supervisor of this group
    const group = await Group.findOne({
      _id: groupId,
      supervisors: facultyId,
    })
      .select("_id name departmentConfigs status supervisors session")
      .populate({ path: "departmentConfigs", select: "department -_id" })
      .populate({ path: "session", select: "name academicYear -_id" })
      .populate({
        path: "supervisors",
        select: "phoneNumber user",
        populate: {
          path: "user",
          select: "name email -_id",
        },
      })
      .lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or not authorized.",
      });
    }

    const supervisors = group.supervisors.map((s) => ({
      name: s.user?.name || null,
      email: s.user?.email || null,
      phoneNumber: s.phoneNumber,
    }));

    const [students, projects] = await Promise.all([
      Student.find({ groupId: group._id })
        .select("rollNumber phoneNumber specialization semester departmentConfig user")
        .populate({ path: "user", select: "name email -_id" })
        .populate({ path: "departmentConfig", select: "department -_id" })
        .lean(),

      Project.find({ group: group._id })
        .populate({ path: "session", select: "name academicYear -_id" })
        .lean(),
    ]);

    const departmentStrings = (group.departmentConfigs || []).map((d) => d.department);

    return res.status(200).json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          departments: departmentStrings,
          session: group.session,
          status: group.status,
        },
        students: students.map((student) => ({
          username: student.user?.name,
          email: student.user?.email,
          rollNumber: student.rollNumber,
          department: student.departmentConfig?.department,
          specialization: student.specialization,
          semester: student.semester,
          phoneNumber: student.phoneNumber,
        })),
        project: projects.map((project) => ({
          _id: project._id,
          title: project.title,
          description: project.description,
          domain: project.domain,
          semester: project.semester,
          status: project.status,
          session: project.session,
        })),
        supervisors,
      },
    });
  } catch (error) {
    next(error);
  }
};


