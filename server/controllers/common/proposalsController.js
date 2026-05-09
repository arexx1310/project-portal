import mongoose from "mongoose";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Group from "../../models/Group.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Faculty from "../../models/Faculty.js";
import Department from "../../models/DepartmentConfig.js";

/**
 * @desc List project approval requests
 * @route GET /api/{role}/project-proposals/my-requests
 * @access Private (student or faculty)
 *
 * Student → requests where group = student's groupId
 * Faculty → requests where supervisorInvites.faculty = faculty's _id
 */
export const listProjectRequests = async (req, res, next) => {
  try {

    // ── 1. Build the filter based on who is calling ───────────────────────────
    let filter;

    if (req.student) {
      const { groupId } = req.student;

      if (!groupId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      filter = { group: groupId };

    } else if (req.faculty) {

      filter = { "supervisorInvites.faculty": req.faculty.id };

    } else {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // ── 2. Single query — shape is identical for both roles ───────────────────
    const requests = await ProjectApprovalRequest.find(filter)
      .select("group project.title project.domain project.semester supervisorInvites status")
      .populate("group", "name programType")
      .populate({
        path: "supervisorInvites.faculty",
        select: "user",
        populate: { path: "user", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const { type } = req.query;

    const filtered = (type === "UG" || type === "PG")
      ? requests.filter((r) => r.group?.programType === type)
      : requests;
    
    // ── 3. Shape ──────────────────────────────────────────────────────────────
    const data = filtered.map((r) => ({
      _id: r._id,
      groupName:     r.group?.name    ?? null,
      projectTitle:  r.project?.title || "",
      projectDomain: r.project?.domain || "",
      semester:      r.project?.semester || "",
      supervisors:   r.supervisorInvites.map((invite) => ({
        name:   invite.faculty?.user?.name ?? null,
        status: invite.status,
      })),
      status: r.status,
    }));

    return res.status(200).json({ success: true, count: data.length, data });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get full details of a single project approval request
 * @route GET /api/{role}/project-proposals/my-requests/:inviteId
 * @access Private (student or faculty)
 */
export const getProjectRequestDetails = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    if (!mongoose.isValidObjectId(inviteId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    // ── 1. Fetch the approval request + populate group and supervisors ─────────
    // Group members live in Student collection (not embedded), handled in step 3.
    const request = await ProjectApprovalRequest.findById(inviteId)
      .select("group project supervisorInvites status")
      .populate({
        path: "group",
        select: "name departments",
        populate: {
          path: "departments",        // ObjectId[] → Department.department (String)
          select: "department",
        },
      })
      .populate({
        path: "supervisorInvites.faculty",
        select: "user",
        populate: { path: "user", select: "name email" },
      })
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: "Project approval request not found." });
    }

    // ── 2. Access check ───────────────────────────────────────────────────────
    if (req.student) {
      const student = await Student.findById(req.student.id)
        .select("groupId")
        .lean();

      if (!student?.groupId || student.groupId.toString() !== request.group._id.toString()) {
        return res.status(403).json({ success: false, message: "You do not have access to this request." });
      }

    } else if (req.faculty) {
      const isSupervisor = request.supervisorInvites.some(
        (inv) => inv.faculty?._id?.toString() === req.faculty.id.toString()
      );
      if (!isSupervisor) {
        return res.status(403).json({ success: false, message: "You do not have access to this request." });
      }

    } else {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // ── 3. Fetch group members ────────────────────────────────────────────────
    // Students are not embedded in Group — one targeted query on the groupId index.
    const members = await Student.find({ groupId: request.group._id })
      .select("specialization user")
      .populate("user", "name email")
      .lean();

    // ── 4. Shape and respond ──────────────────────────────────────────────────
    const { group, project, supervisorInvites, status } = request;

    return res.status(200).json({
      success: true,
      data: {
        _id: request._id,
        groupName:   group.name,
        departments: group.departments.map((d) => d.department),
        members: members.map((m) => ({
          name:           m.user?.name    ?? null,
          email:          m.user?.email   ?? null,
          specialization: m.specialization ?? null,
        })),
        semester: project.semester,
        project: {
          title:       project.title,
          domain:      project.domain,
          description: project.description,
        },
        supervisors: supervisorInvites.map((inv) => ({
          name:   inv.faculty?.user?.name  ?? null,
          email:  inv.faculty?.user?.email ?? null,
          status: inv.status,
        })),
        status,
      },
    });

  } catch (error) {
    next(error);
  }
};