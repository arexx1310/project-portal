import mongoose from "mongoose";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Group from "../../models/Group.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Faculty from "../../models/Faculty.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import { sendNotification } from "../notificationController.js";

/**
 * @desc    Get available professors from all departments in the student's group
 * @route   GET /api/student/available-professors
 * @access  Private (attachStudentProfile middleware required)
 */
export const getAvailableProfessors = async (req, res, next) => {
  try {
    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    // 1. Fetch student to get groupId
    const student = await Student.findById(req.student.id)
      .select("groupId")
      .lean();

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student profile not found." });
    }

    if (!student.groupId) {
      return res.status(400).json({
        success: false,
        message: "You must be part of a group to view available professors.",
      });
    }

    // 2. Fetch the student's group to get all departmentConfigs
    const group = await Group.findById(student.groupId)
      .select("departmentConfigs")
      .lean();

    if (!group || !group.departmentConfigs?.length) {
      return res.status(404).json({
        success: false,
        message: "Group or department configuration not found.",
      });
    }

    // 3. Fetch dept configs + all faculty across those departments in parallel
    const [deptConfigs, facultyList] = await Promise.all([
      DepartmentConfig.find({ _id: { $in: group.departmentConfigs } })
        .select("_id department btpConfig")
        .lean(),

      Faculty.find({ departmentConfig: { $in: group.departmentConfigs } })
        .select("_id user departmentConfig")
        .populate("user", "name -_id")
        .lean(),
    ]);

    if (!facultyList.length) {
      return res.status(200).json({ success: true, data: {} });
    }

    // 4. Count active groups per supervisor via aggregation on Group collection.
    //    "Active" means status is NOT "Closed" — adjust the $match if your
    //    business logic differs (e.g. only count "Active" status).
    const facultyIds = facultyList.map((f) => f._id);

    const supervisorGroupCounts = await Group.aggregate([
      {
        $match: {
          supervisors: { $in: facultyIds },
          status: { $nin: ["Closed"] }, // exclude closed groups from load count
        },
      },
      { $unwind: "$supervisors" },
      {
        $match: {
          supervisors: { $in: facultyIds },
        },
      },
      {
        $group: {
          _id: "$supervisors",
          activeGroupCount: { $sum: 1 },
        },
      },
    ]);

    // 5. Build a Map: facultyId (string) → activeGroupCount
    const groupCountMap = new Map(
      supervisorGroupCounts.map((entry) => [
        String(entry._id),
        entry.activeGroupCount,
      ])
    );

    // 6. Map deptId → { name, maxGroupsAllowed }
    const deptMap = {};
    for (const dc of deptConfigs) {
      deptMap[String(dc._id)] = {
        name: dc.department,
        maxGroupsAllowed: dc.btpConfig?.maxGroupsPerSupervisor ?? Infinity,
      };
    }

    // 7. Build response keyed by department name
    const byDepartment = {};
    for (const dc of group.departmentConfigs) {
      const dept = deptMap[String(dc)];
      if (dept) byDepartment[dept.name] = [];
    }

    for (const f of facultyList) {
      const dept = deptMap[String(f.departmentConfig)];
      if (!dept) continue;

      const activeGroups = groupCountMap.get(String(f._id)) ?? 0;

      // Filter out faculty who have reached their department's cap
      if (activeGroups >= dept.maxGroupsAllowed) continue;

      byDepartment[dept.name].push({
        professorId: f._id,
        name: f.user?.name ?? null,
        activeGroups,
        availableSlots: dept.maxGroupsAllowed - activeGroups,
      });
    }

    return res.status(200).json({
      success: true,
      data: byDepartment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Submit a project approval request
 *       - Semester 7: requires supervisorsIds, picks new supervisors
 *       - Semester 8: supervisors inherited from group, no selection needed
 * @route POST /api/student/project-approval/
 * @access Private (attachStudentProfile middleware required)
 */

export const createProjectApprovalRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  let committed = false;

  try {
    if (!req.student || !req.student.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({ success: false, message: "Unauthorized: Student profile not attached" });
    }
 
    const { title, description, domain, supervisorsIds = [] } = req.body;
 
    if (!title || typeof title !== "string" || !title.trim()) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project title is required." });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project description is required." });
    }
    if (!domain || typeof domain !== "string" || !domain.trim()) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project domain is required." });
    }
 
    const student = await Student.findById(req.student.id)
      .select("_id groupId departmentConfig semester")
      .session(dbSession);
 
    if (!student) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }
    if (!student.groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You must be part of a group before submitting a project approval request." });
    }
 
    const semester = student.semester;
    if (![7, 8].includes(semester)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project approval requests are only allowed in semester 7 or 8." });
    }
 
    const [deptConfig, group] = await Promise.all([
      DepartmentConfig.findById(student.departmentConfig).select("btpConfig").session(dbSession),
      Group.findById(student.groupId).session(dbSession),
    ]);
 
    if (!deptConfig?.btpConfig) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Department configuration not found." });
    }
    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }
 
    const config = deptConfig.btpConfig;
 
    if (new Date() > config.projectProposalDeadline) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project proposal deadline has passed." });
    }
 
    if (semester === 7 && group.status !== "Formed") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "A project approval request has already been submitted for this group." });
    }
    if (semester === 8 && group.status !== "Active") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Your group must have completed semester 7 supervisor approval before submitting a semester 8 request." });
    }
 
    const existingRequest = await ProjectApprovalRequest.findOne({
      group: group._id,
      status: "PendingSupervisorApproval",
    }).session(dbSession);
 
    if (existingRequest) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "A pending project approval request already exists for this group." });
    }
 
    let resolvedSupervisorIds;
    let supervisors = [];
 
    if (semester === 7) {
      if (!Array.isArray(supervisorsIds) || supervisorsIds.length === 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "At least one supervisor is required for semester 7." });
      }
      if (supervisorsIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid supervisor ID provided." });
      }
 
      const uniqueSupervisors = [...new Set(supervisorsIds.map(String))];
 
      supervisors = await Faculty.find({ _id: { $in: uniqueSupervisors } })
        .select("_id departmentConfig groupIds")
        .populate("user", "_id role")
        .session(dbSession);
 
      if (supervisors.length !== uniqueSupervisors.length) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "Some supervisors not found." });
      }
 
      for (const s of supervisors) {
        if (!group.departmentConfigs.some((dc) => dc.equals(s.departmentConfig))) {
          await dbSession.abortTransaction();
          return res.status(400).json({ success: false, message: "All supervisors must belong to one of the group's departments." });
        }
      }
 
      const coveredDepts = new Set(supervisors.map((s) => String(s.departmentConfig)));
      const missingDept = group.departmentConfigs.find((dc) => !coveredDepts.has(String(dc)));
      if (missingDept) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "At least one supervisor must be selected from each department in your group.",
        });
      }
 
      resolvedSupervisorIds = supervisors.map((s) => s._id);
    } else {
      if (!group.supervisors || group.supervisors.length === 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "No supervisors found on the group. Cannot create a semester 8 request." });
      }
 
      resolvedSupervisorIds = group.supervisors;
 
      supervisors = await Faculty.find({ _id: { $in: resolvedSupervisorIds } })
        .populate("user", "_id role")
        .session(dbSession)
        .lean();
    }
 
    const [approvalRequest] = await ProjectApprovalRequest.create(
      [{
        group: group._id,
        project: { title: title.trim(), description: description.trim(), domain: domain.trim(), semester },
        supervisorInvites: resolvedSupervisorIds.map((id) => ({ faculty: id })),
      }],
      { session: dbSession }
    );
 
    if (semester === 7) {
      group.status = "SupervisorRequested";
      await group.save({ session: dbSession });
    }

    await dbSession.commitTransaction();
    committed = true;

    // FIX 1: moved AFTER commit
    // FIX 2: was referencing undefined `supervisorUsers` — use `supervisors` directly
    const notifyRecipients = supervisors
      .map((s) => s.user)
      .filter(Boolean)
      .map((u) => ({ _id: u._id, role: u.role }));

    if (notifyRecipients.length > 0) {
      await sendNotification(
        {
          type: "PROJECT_PROPOSAL_SENT",
          message: `A group has requested your supervision for project "${title.trim()}".`,
          refId: approvalRequest._id,
          refModel: "ProjectApprovalRequest",
          triggeredBy: req.user.id,
        },
        notifyRecipients
      );
    }
 
    return res.status(201).json({
      success: true,
      message: semester === 7
        ? "Project approval request submitted. Awaiting supervisor responses."
        : "Semester 8 project submitted. Your existing supervisors have been notified.",
    });
 
  } catch (error) {
    if (!committed) await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};
 
/**
 * @desc Get details of a project approval request
 * @route GET /api/student/project-approval/:requestId
 * @access Private (attachStudentProfile middleware required)
 */
export const getProjectApprovalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }
 
    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }
 
    const student = await Student.findById(req.student.id).select("groupId").lean();
 
    if (!student?.groupId) {
      return res.status(403).json({
        success: false,
        message: "You are not part of any group.",
      });
    }
 
    const request = await ProjectApprovalRequest.findOne({
      _id: requestId,
      group: student.groupId,
    })
      .select(
        "group project supervisorInvites finalProject status rejectedBy createdAt updatedAt"
      )
      .populate({
        path: "supervisorInvites.faculty",
        populate: [
          { path: "user", select: "name email -_id" },
          { path: "departmentConfig", select: "department -_id" },
        ],
      })
      .lean();
 
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Project approval request not found or access denied.",
      });
    }
 
    const supervisors = (request.supervisorInvites || []).map((s) => ({
      name: s.faculty?.user?.name || null,
      email: s.faculty?.user?.email || null,
      department: s.faculty?.departmentConfig?.department || null,
      status: s.status,
      rejectionReason: s.rejectionReason || null,
      respondedAt: s.respondedAt || null,
    }));
 
    return res.status(200).json({
      success: true,
      data: {
        _id: request._id,
        group: request.group,
        project: request.project,
        supervisors,
        finalProject: request.finalProject || null,
        status: request.status,
        rejectedBy: request.rejectedBy || null,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
 
/**
 * @desc List all project approval requests for the student's group
 * @route GET /api/student/project-approval/mine
 * @access Private (attachStudentProfile middleware required)
 */
export const listMyProjectApprovalRequests = async (req, res, next) => {
  try {
    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }
 
    const student = await Student.findById(req.student.id).select("groupId").lean();
 
    if (!student?.groupId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
 
    const requests = await ProjectApprovalRequest.find({ group: student.groupId })
      .select("project.title project.domain project.semester status createdAt")
      .sort({ createdAt: -1 })
      .lean();
 
    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};
 
/**
 * @desc Cancel a pending project approval request (any group member can cancel)
 * @route DELETE /api/student/project-approval/:requestId
 * @access Private (attachStudentProfile middleware required)
 */
export const cancelProjectApprovalRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const { requestId } = req.params;
 
    if (!req.student || !req.student.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }
 
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }
 
    const student = await Student.findById(req.student.id)
      .select("semester groupId")
      .session(dbSession);
 
    if (!student?.groupId) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You are not part of any group.",
      });
    }
 
    const request = await ProjectApprovalRequest.findOne({
      _id: requestId,
      group: student.groupId,
    }).session(dbSession);
 
    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Request not found or access denied.",
      });
    }
 
    if (request.status !== "PendingSupervisorApproval") {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "This request can no longer be cancelled.",
      });
    }
 
    await ProjectApprovalRequest.findByIdAndDelete(requestId, {
      session: dbSession,
    });
 
    // Semester 7 cancellation: revert group back to "Formed" so they can resubmit
    // Semester 8 cancellation: group stays "Active" — supervisors are unchanged
    if (student.semester === 7) {
      await Group.findByIdAndUpdate(
        student.groupId,
        { $set: { status: "Formed" } },
        { session: dbSession }
      );
    }
 
    await dbSession.commitTransaction();
 
    return res.status(200).json({
      success: true,
      message: "Project approval request cancelled. You may submit a new one.",
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};