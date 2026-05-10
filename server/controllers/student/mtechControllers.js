import mongoose from "mongoose";
import Department from "../../models/DepartmentConfig.js";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Faculty from "../../models/Faculty.js";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";

import {notifyUser} from "../notificationController.js";

/**
 * @desc Submit a project approval request
 *       - Semester 1/3: requires supervisorsIds, picks new supervisors
 *       - Semester 2/4: supervisors inherited from group, no selection needed
 * @route POST /api/student/project-proposal/create-request/pg
 * @access Private (attachStudentProfile middleware required)
 */

export const createMtpProjectRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { title, description, domain, supervisorIds = [] } = req.body;

    // ── 1. Field validation ───────────────────────────────────────────────────
    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof domain !== "string" || !domain.trim()
    ) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Title, description, and domain are required." });
    }

    // ── 2. Student — from middleware ──────────────────────────────────────────
    // req.student = { id, session, department, groupId, semester, programType }
    const { id: studentId, session: sessionId, groupId, semester } = req.student;

    // ── 3. Semester guard ─────────────────────────────────────────────────────
    if (![1, 2, 3, 4].includes(semester)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "MTP project requests are only allowed in semesters 1, 2, 3, or 4." });
    }

    // ── 5. Group check ────────────────────────────────────────────────────────
    if (!groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You must be part of a group before submitting a project request." });
    }

    // ── 6. Load group ─────────────────────────────────────────────────────────
    const group = await Group.findById(groupId)
      .select("_id name status departments supervisors")
      .lean()
      .session(dbSession);

    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    // ── 7. Branch by semester ─────────────────────────────────────────────────

    let resolvedSupervisorIds;
    let expiresAt;

    /* ════════════════════════════════════════════════════════════════
       SEMESTERS 1 & 3  — student selects supervisors
       • group.status must be "Formed" (not still in Draft)
       • group.supervisors must be empty (no prior assignment)
       • mtpConfig.lockRecordDeadline must not have passed
       • supervisorIds count must not exceed mtpConfig.maxSupervisors
       • cross-dept supervisors only allowed if mtpConfig.crossDeptisAllowed
    ════════════════════════════════════════════════════════════════ */
    if (semester === 1 || semester === 3) {

      if (group.status === "Active") {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "Project request can only be submitted when group status is Draft" });
      }

      if (group.supervisors?.length > 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "This group already has supervisors assigned." });
      }

      // ── Validate supervisorIds from body ──────────────────────────────────
      if (!Array.isArray(supervisorIds) || supervisorIds.length === 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "At least one supervisor is required." });
      }

      if (supervisorIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "One or more supervisor IDs are invalid." });
      }

      // ── Duplicate pending request check ───────────────────────────────────
      // Block re-submission of the exact same supervisor set to prevent spam.
      const pendingExists = await ProjectApprovalRequest.exists({
        group: group._id,
        "project.semester": semester,
        status: "PendingSupervisorApproval",
        "supervisorInvites.faculty": { $all: supervisorIds },
      }).session(dbSession);

      if (pendingExists) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "A pending project approval request already exists for this group with the same supervisor(s)." });
      }

      // Deduplicate
      const uniqueSupervisorIds = [...new Set(supervisorIds.map(String))];

      const primaryDeptId = group.departments?.[0];

      if (!primaryDeptId) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "Group has no department assigned." });
      }

      // ── Parallel fetch: dept config + all faculty records ─────────────────
      const primaryDeptConfig = await Department.findById(primaryDeptId)
          .select("department mtpConfig.lockRecordDeadline mtpConfig.maxSupervisors mtpConfig.crossDeptisAllowed")
          .lean()
          .session(dbSession);

      const facultyRecords = await Faculty.find({ _id: { $in: uniqueSupervisorIds } })
          .select("_id department user")
          .populate("user", "_id role")
          .lean()
          .session(dbSession);

      if (!primaryDeptConfig?.mtpConfig) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "MTP configuration not found for this group's department." });
      }

      const { mtpConfig, department: deptName } = primaryDeptConfig;

      // ── Deadline check ────────────────────────────────────────────────────
      if (new Date() > new Date(mtpConfig.lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: `The supervisor selection deadline has passed for department ${deptName}.` });
      }

      // ── Max supervisors check ─────────────────────────────────────────────
      if (uniqueSupervisorIds.length > mtpConfig.maxSupervisors) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: `Department ${deptName} allows a maximum of ${mtpConfig.maxSupervisors} supervisor(s).` });
      }

      // ── All faculty found? ────────────────────────────────────────────────
      if (facultyRecords.length !== uniqueSupervisorIds.length) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "One or more supervisors were not found." });
      }

      // ── Cross-department check ────────────────────────────────────────────
      // Note: MTP uses mtpConfig.crossDeptisAllowed (different field name from BTP).
      const primaryDeptIdStr = primaryDeptId.toString();

      const crossDeptSupervisors = facultyRecords.filter(
        (f) => f.department.toString() !== primaryDeptIdStr
      );

      if (crossDeptSupervisors.length > 0 && !mtpConfig.crossDeptisAllowed) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Department ${deptName} does not allow supervisors from other departments.`,
        });
      }

      resolvedSupervisorIds = facultyRecords.map((f) => f._id);
      expiresAt = new Date(mtpConfig.lockRecordDeadline);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

    /* ════════════════════════════════════════════════════════════════
       SEMESTERS 2 & 4  — supervisors inherited from group
       • group.status must be "Active" (prior odd semester completed)
       • group.supervisors must already be populated
       • no mtpConfig checks needed
    ════════════════════════════════════════════════════════════════ */
    } else {
      // semester === 2 || semester === 4

      if (group.status !== "Active") {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Your group must be in 'Active' status (semester ${semester - 1} completed) before submitting a semester ${semester} request.`,
        });
      }

      // ── Resolve supervisors: inherit from group, or fall back to body ────────
      if (group.supervisors?.length > 0) {
        resolvedSupervisorIds = group.supervisors;
      } else {
        if (!Array.isArray(supervisorIds) || supervisorIds.length === 0) {
          await dbSession.abortTransaction();
          return res.status(400).json({ success: false, message: "No supervisors found on this group. Please provide supervisor IDs." });
        }

        if (supervisorIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
          await dbSession.abortTransaction();
          return res.status(400).json({ success: false, message: "One or more supervisor IDs are invalid." });
        }

        const uniqueSupervisorIds = [...new Set(supervisorIds.map(String))];
        const facultyRecords = await Faculty.find({ _id: { $in: uniqueSupervisorIds } })
          .select("_id")
          .lean()
          .session(dbSession);

        if (facultyRecords.length !== uniqueSupervisorIds.length) {
          await dbSession.abortTransaction();
          return res.status(404).json({ success: false, message: "One or more supervisors were not found." });
        }

        resolvedSupervisorIds = facultyRecords.map((f) => f._id);
      }

      // ── Duplicate pending request check ───────────────────────────────────
      const pendingExists = await ProjectApprovalRequest.exists({
        group: group._id,
        "project.semester": semester,
        status: "PendingSupervisorApproval",
      }).session(dbSession);

      if (pendingExists) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: `A pending project approval request already exists for this group for semester ${semester}.` });
      }

      // 3-month rolling window
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    }

    // ── 8. Create the approval request ───────────────────────────────────────
    const [approvalRequest] = await ProjectApprovalRequest.create(
      [
        {
          group: group._id,
          project: {
            title: title.trim(),
            description: description.trim(),
            domain: domain.trim(),
            semester,
          },
          supervisorInvites: resolvedSupervisorIds.map((id) => ({ faculty: id })),
          expiresAt,
        },
      ],
      { session: dbSession }
    );

    // ── 9. Advance group status (odd semesters only) ──────────────────────────
    // Mirror the BTP pattern: mark the group as "SupervisorRequested" so
    // it cannot submit a second request until the current one resolves.
    if (semester === 1 || semester === 3) {
      await Group.updateOne(
        { _id: group._id },
        { $set: { status: "SupervisorRequested" } },
        { session: dbSession }
      );
    }

    await dbSession.commitTransaction();

    const isOddSemester = semester === 1 || semester === 3;

    if (semester === 1 || semester === 3) {
      const supervisorUserIds = facultyRecords.map((f) => f.user._id);
      await supervisorUserIds.map((userId) =>
          notifyUser(userId, "faculty", req.user.id, `Supervision request received from "${group.name}" for M.Tech Thesis Project.`)
        );
    } else {
      await notifyGroup(group._id, req.user.id, `Project proposal added for Phase 2 of M.Tech Thesis Project.`);
    }

    return res.status(201).json({
      success: true,
      message: isOddSemester
        ? "MTP project approval request submitted. Awaiting supervisor responses."
        : `Semester ${semester} MTP project submitted. Your existing supervisors have been notified.`,
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};
