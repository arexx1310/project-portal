import mongoose from "mongoose";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import Session from "../../models/Session.js";


/**
 * @desc Get all sessions
 * @route GET /api/admin/sessions 
 * @access Admin and Faculty
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .select("_id name")
      .sort({ isActive: -1, academicYear: -1 }) // Active first, then latest year first
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all BTP groups supervised by the faculty, filtered by session
 * @route GET /api/faculty/groups/my-groups?sessionId=<id>
 * @access Private (attachFacultyProfile middleware required)
 */
export const getMyGroups = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    

    // ── 1. Resolve session ────────────────────────────────────────────────────
    let resolvedSession;

    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: "Invalid sessionId." });
      }
      resolvedSession = await Session.findById(sessionId)
        .select("_id name academicYear")
        .lean();

      if (!resolvedSession) {
        return res.status(404).json({ success: false, message: "Session not found." });
      }
    } else {
      resolvedSession = await Session.getActiveSession();
      if (!resolvedSession) {
        return res.status(404).json({ success: false, message: "No active session found. Please provide a sessionId." });
      }
    }
    
   
    // ── 2. Fetch faculty's groups for this session ────────────────────────────
    const groups = await Group.find({
      supervisors: req.faculty.id,
      session:     resolvedSession._id, 
      programType: "UG"
    })
      .select("name status departments supervisors programType")
      .populate({
        path:     "supervisors",
        select:   "user",
        populate: { path: "user", select: "name email -_id" },
      })
      .lean();

    if (groups.length === 0) {
      return res.status(200).json({
        success: true,
        session: { _id: resolvedSession._id, name: resolvedSession.name, academicYear: resolvedSession.academicYear },
        count: 0,
        data: [],
      });
    }

    // ── 3. Batch fetch all students across all groups in one query ─────────────
    const groupIds   = groups.map((g) => g._id);
    const allStudents = await Student.find({ groupId: { $in: groupIds } })
      .select("groupId specialization user")
      .populate("user", "name email -_id")
      .lean();

    // Build groupId → students[] map
    const studentsByGroup = allStudents.reduce((acc, s) => {
      const key = s.groupId.toString();
      (acc[key] ??= []).push({
        name:           s.user?.name           ?? null,
        email:          s.user?.email          ?? null,
        specialization: s.specialization       ?? null,
      });
      return acc;
    }, {});

    
    // ── 4. Shape response ─────────────────────────────────────────────────────
    const data = groups.map((g) => ({
      _id:    g._id,
      name:   g.name,
      status: g.status,
      supervisors: g.supervisors.map((s) => ({
        name:  s.user?.name  ?? null,
        email: s.user?.email ?? null,
      })),
      students: studentsByGroup[g._id.toString()] ?? [],
    }));

    return res.status(200).json({
      success: true,
      session: { _id: resolvedSession._id, name: resolvedSession.name, academicYear: resolvedSession.academicYear },
      count: data.length,
      data,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all MTECH STUDENTS supervised by the faculty, filtered by session
 * @route GET /api/faculty/mtech-students?sessionId=<id>
 * @access Private (attachFacultyProfile middleware required)
 */
export const getMTechStudents = async (req, res, next) => {
  try {

    const { sessionId } = req.query;
    

    // ── 1. Resolve session ────────────────────────────────────────────────────
    let resolvedSession;

    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: "Invalid sessionId." });
      }
      resolvedSession = await Session.findById(sessionId)
        .select("_id name academicYear")
        .lean();

      if (!resolvedSession) {
        return res.status(404).json({ success: false, message: "Session not found." });
      }
    } else {
      resolvedSession = await Session.getActiveSession();
      if (!resolvedSession) {
        return res.status(404).json({ success: false, message: "No active session found. Please provide a sessionId." });
      }
    }
    
   
    // ── 2. Fetch faculty's groups for this session ────────────────────────────
    const groups = await Group.find({
      supervisors: req.faculty.id,
      session:     resolvedSession._id, 
      programType: "PG"
    })
      .select("name status departments supervisors programType")
      .populate({
        path:     "supervisors",
        select:   "user",
        populate: { path: "user", select: "name email -_id" },
      })
      .lean();

    if (groups.length === 0) {
      return res.status(200).json({
        success: true,
        session: { _id: resolvedSession._id, name: resolvedSession.name, academicYear: resolvedSession.academicYear },
        count: 0,
        data: [],
      });
    }

    // ── 4. Shape response ─────────────────────────────────────────────────────
    const data = groups.map((g) => ({
      _id:    g._id,
      name: g.name,
      status: g.status,
      isPG: g.programType === "PG",
      supervisors: g.supervisors.map((s) => ({
        name:  s.user?.name  ?? null,
        email: s.user?.email ?? null,
      })),
    
    }));

    return res.status(200).json({
      success: true,
      session: { _id: resolvedSession._id, name: resolvedSession.name, academicYear: resolvedSession.academicYear },
      count: data.length,
      data,
    });

  } catch (error) {
    next(error);
  }
};




