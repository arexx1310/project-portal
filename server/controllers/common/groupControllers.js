import mongoose from "mongoose";

import Student from "../../models/Student.js";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";


/* ─────────────────────────────────────────────────────────────
   HELPER — resolve which group to look up based on caller role.

   • Student  → reads their own groupId from the DB (no input needed)
   • Faculty  → reads ?groupId=... from query params

   Returns the resolved groupId (ObjectId string) on success.
   Sends the error response itself and returns null on failure,
   so the caller just needs to do: if (!groupId) return;
───────────────────────────────────────────────────────────── */
const resolveGroupId = (req, res) => {

  if (req.user.role === "student") {
    const { groupId } = req.student;     // from token — no DB
    if (!groupId) {
      res.status(200).json({ success: true, data: null, message: "No group available." });
      return null;
    }
    return groupId;
  }

  // Faculty / Admin — groupId comes from route param
  const { groupId } = req.params;

  if (!groupId) {
    res.status(400).json({ success: false, message: "groupId parameter is required." });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ success: false, message: "Invalid group ID." });
    return null;
  }

  return groupId;
};


/**
 * @desc    Get full BTP group details (members, supervisors, departments, projects)
 * @route   GET /api/student/group
 * @route   GET /api/faculty/groups/group-details/:groupId
 * @access  Student (own group only) | Faculty (groups in their department only)
 */
export const getGroupDetails = async (req, res, next) => {
  try {

    // ── 1. Resolve groupId ────────────────────────────────────────────────────
    const groupId = resolveGroupId(req, res);  // sync — no await needed
    if (!groupId) return;

    // ── 2. Fetch group ────────────────────────────────────────────────────────
    const group = await Group.findById(groupId)
      .select("name departments session supervisors status programType")
      .populate({ path: "session",     select: "name -_id" })
      .populate({ path: "departments", select: "department" })
      .populate({
        path:     "supervisors",
        select:   "department phoneNumber user",
        populate: [
          { path: "user",       select: "name email -_id" },
          { path: "department", select: "department -_id" },
        ],
      })
      .lean();

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    // ── 3. Faculty department guard ───────────────────────────────────────────
    if (req.user.role === "faculty") {
      const groupDeptIds  = group.departments.map((d) => d._id.toString());
      const facultyDeptId = req.faculty.department.toString();

      if (!groupDeptIds.includes(facultyDeptId)) {
        return res.status(403).json({ success: false, message: "This group does not belong to your department." });
      }
    }

    // ── 4. fetch: members + projects ─────────────────────────────────
    const memberRecords  = await Student.find({ groupId: group._id })
        .select("rollNumber phoneNumber specialization semester user")
        .populate({ path: "user", select: "name email -_id" })
        .lean();

    const projects = await Project.find({ group: group._id })
        .select("_id title domain semester status")
        .lean();

    // ── 5. Shape and respond ──────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        _id:    group._id,
        name:   group.name,
        status: group.status,
        session:     group.session?.name ?? null,
        departments: group.departments.map((d) => d.department),
        members: memberRecords.map((m) => ({
          name:           m.user?.name    ?? null,
          email:          m.user?.email   ?? null,
          rollNumber:     m.rollNumber,
          specialization: m.specialization ?? null,
          phoneNumber:    m.phoneNumber,
          semester:       m.semester,
        })),
        supervisors: group.supervisors.map((s) => ({
          name:        s.user?.name              ?? null,
          email:       s.user?.email             ?? null,
          phoneNumber: s.phoneNumber,
          department:  s.department?.department  ?? null,
        })),
        projects,
        isPG: group.programType === "PG"
      },
    });

  } catch (error) {
    next(error);
  }
};




