import mongoose from "mongoose";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Group from "../../models/Group.js";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import Department from "../../models/DepartmentConfig.js";
import { notifyGroup, sendNotification } from "../notificationController.js";


// THIS RESPONSE IS FOR UG (BTECH) STUDENTS ONLY
/**
 * @desc Respond to a project approval request (accept or reject)
 * @route PATCH /api/faculty/project-proposal/:requestId/respond
 * @access Private (attachFacultyProfile middleware required)
 */
export const respondToRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { requestId } = req.params;
    const { action }    = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    if (!["accept", "reject"].includes(action.toLowerCase())) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    const { id: facultyId, department: facultyDeptId } = req.faculty;

    const request = await ProjectApprovalRequest.findOne({
      _id:                         requestId,
      status:                      "PendingSupervisorApproval",
      "supervisorInvites.faculty": facultyId,
    }).session(dbSession);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Request not found, already resolved, or you are not assigned to it." });
    }

    const slot = request.supervisorInvites.find((s) => s.faculty.equals(facultyId));
    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already responded to this request." });
    }

    const { semester } = request.project;

    // ══════════════════════════════════════════════════════════════════════════
    // REJECTION — no extra checks needed for either semester
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "reject") {
      slot.status        = "Rejected";
      slot.respondedAt   = new Date();
      request.status     = "Rejected";
      request.rejectedBy = facultyId;

      await request.save({ session: dbSession });
      await notifyGroup(request.group, req.user.id, "A supervisor rejected the project proposal request for your group.", dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: "Project approval request rejected." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACCEPTANCE GUARDS
    // ══════════════════════════════════════════════════════════════════════════
    const group = await Group.findById(request.group)
      .select("supervisors")
      .lean()
      .session(dbSession);

    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const groupHasSupervisors = group.supervisors?.length > 0;
    const facultyIsExistingSupervisor = group.supervisors?.some((s) => s.equals(facultyId));
    const deptConfig = await Department.findById(facultyDeptId)
        .select("btpConfig.lockRecordDeadline btpConfig.maxGroupsPerSupervisor")
        .lean();

    if (!deptConfig?.btpConfig) {
        await dbSession.abortTransaction();
        return res.status(409).json({ success: false, message: "BTP configuration not found for your department." });
    }

    const activeSession = await Session.getActiveSession();
      if (!activeSession) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "No active session found." });
    }

    const groupLoadQuery = {
      supervisors: facultyId,
      programType: "UG",
      session:     activeSession._id,
      status:      { $ne: "Closed" },
    };

    const { lockRecordDeadline, maxGroupsPerSupervisor } = deptConfig.btpConfig;
    if (semester === 7) {
      // ── Deadline + group load check ───────────────────────────────────────
      if (new Date() > new Date(lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "The supervisor selection deadline has passed." });
      }
    }

    if (semester === 8) {
      // ── Faculty can accept only if group has no supervisors yet,
      //    or if they are already one of the group's supervisors ─────────────
      if (groupHasSupervisors && !facultyIsExistingSupervisor) {
        await dbSession.abortTransaction();
        return res.status(403).json({ success: false, message: "This group already has supervisors assigned and you are not among them." });
      }
      groupLoadQuery._id = { $ne:  group._id};
    }

    const currentGroupCount = await Group.countDocuments(groupLoadQuery);
    if (currentGroupCount >= maxGroupsPerSupervisor) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have reached your maximum group supervision limit." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MARK SLOT ACCEPTED
    // ══════════════════════════════════════════════════════════════════════════
    slot.status       = "Accepted";
    slot.respondedAt  = new Date();
    request.expiresAt = null;
    await request.save({ session: dbSession });

    const allAccepted = request.supervisorInvites.every((s) => s.status === "Accepted");

    if (!allAccepted) {
      const remaining = request.supervisorInvites.filter((s) => s.status === "Pending").length;
      await notifyGroup(request.group, req.user.id, `A supervisor accepted the project proposal for Semester ${semester}. Waiting for ${remaining} more supervisor(s).`, dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: `You accepted. Waiting for ${remaining} more supervisor(s) to respond.` });
    }

    const [newProject] = await Project.create(
      [{
        title:       request.project.title,
        description: request.project.description,
        domain:      request.project.domain,
        semester,
        session:     activeSession._id,
        group:       request.group,
        status:      "Approved",
      }],
      { session: dbSession }
    );

    request.status       = "Approved";
    request.finalProject = newProject._id;
    await request.save({ session: dbSession });

    const supervisorIds = request.supervisorInvites.map((s) => s.faculty);
    await Group.findByIdAndUpdate(
      request.group,
      { $set: { status: "Active" }, $addToSet: { supervisors: { $each: supervisorIds } } },
      { session: dbSession }
    );

    await notifyGroup(request.group, req.user.id, `All supervisors accepted the project proposal "${request.project.title}" for Semester ${semester}. The project is now active!`, dbSession);
    await dbSession.commitTransaction();

    return res.status(200).json({
      success: true,
      message: semester === 7
        ? "All supervisors accepted. Group is now active and project has been created."
        : "All supervisors accepted. Semester 8 project has been created.",
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

// THIS RESPONSE IS FOR PG (MTECH) STUDENTS ONLY
/**
 * @desc Respond to an MTP project approval request (accept or reject)
 * @route PATCH /api/faculty/project-proposal/:requestId/respond-pg
 * @access Private (attachFacultyProfile middleware required)
 */
export const respondToMtpRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { requestId } = req.params;
    const { action }    = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    if (!["accept", "reject"].includes(action.toLowerCase())) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    const { id: facultyId, department: facultyDeptId } = req.faculty;

    const request = await ProjectApprovalRequest.findOne({
      _id:                         requestId,
      status:                      "PendingSupervisorApproval",
      "supervisorInvites.faculty": facultyId,
    }).session(dbSession);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Request not found, already resolved, or you are not assigned to it." });
    }

    const slot = request.supervisorInvites.find((s) => s.faculty.equals(facultyId));
    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already responded to this request." });
    }

    const { semester } = request.project;
    const isOddSemester = [1, 3].includes(semester);

    // ══════════════════════════════════════════════════════════════════════════
    // REJECTION — no extra checks needed
    // ══════════════════════════════════════════════════════════════════════════
    if (action.toLowerCase() === "reject") {
      slot.status        = "Rejected";
      slot.respondedAt   = new Date();
      request.status     = "Rejected";
      request.rejectedBy = facultyId;

      await request.save({ session: dbSession });
      await notifyGroup(request.group, req.user.id, "A supervisor rejected the MTP project proposal request for your group.", dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: "MTP project approval request rejected." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACCEPTANCE GUARDS
    // ══════════════════════════════════════════════════════════════════════════
    const group = await Group.findById(request.group)
      .select("supervisors")
      .lean()
      .session(dbSession);

    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const groupHasSupervisors      = group.supervisors?.length > 0;
    const facultyIsExistingSupervisor = group.supervisors?.some((s) => s.equals(facultyId));

    const deptConfig = await Department.findById(facultyDeptId)
      .select("mtpConfig.lockRecordDeadline mtpConfig.maxStudentsPerSupervisor")
      .lean();

    if (!deptConfig?.mtpConfig) {
      await dbSession.abortTransaction();
      return res.status(409).json({ success: false, message: "MTP configuration not found for your department." });
    }

    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "No active session found." });
    }

    const { lockRecordDeadline, maxStudentsPerSupervisor } = deptConfig.mtpConfig;

    const groupLoadQuery = {
      supervisors: facultyId,
      programType: "PG",
      session:     activeSession._id,
      status:      { $ne: "Closed" },
    };

    // ── Odd semester (1 & 3): deadline check + full load check ───────────────
    if (isOddSemester) {
      if (new Date() > new Date(lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "The supervisor selection deadline has passed." });
      }
    }

    // ── Even semester (2 & 4): must be no supervisors yet, or already one ────
    if (!isOddSemester) {
      if (groupHasSupervisors && !facultyIsExistingSupervisor) {
        await dbSession.abortTransaction();
        return res.status(403).json({ success: false, message: "This group already has supervisors assigned and you are not among them." });
      }
      // Exclude current group from load count — faculty likely already supervises it from prior odd semester
      groupLoadQuery._id = { $ne: group._id };
    }

    const currentStudentCount = await Group.countDocuments(groupLoadQuery);
    if (currentStudentCount >= maxStudentsPerSupervisor) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have reached your maximum M.Tech student supervision limit." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MARK SLOT ACCEPTED
    // ══════════════════════════════════════════════════════════════════════════
    slot.status       = "Accepted";
    slot.respondedAt  = new Date();
    request.expiresAt = null;
    await request.save({ session: dbSession });

    const allAccepted = request.supervisorInvites.every((s) => s.status === "Accepted");

    if (!allAccepted) {
      const remaining = request.supervisorInvites.filter((s) => s.status === "Pending").length;
      await notifyGroup(request.group, req.user.id, `A supervisor accepted the MTP project proposal for Semester ${semester}. Waiting for ${remaining} more supervisor(s).`, dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: `You accepted. Waiting for ${remaining} more supervisor(s) to respond.` });
    }

    // ── All accepted → create project ─────────────────────────────────────────
    const [newProject] = await Project.create(
      [{
        title:       request.project.title,
        description: request.project.description,
        domain:      request.project.domain,
        semester,
        session:     activeSession._id,
        group:       request.group,
        status:      "Approved",
      }],
      { session: dbSession }
    );

    request.status       = "Approved";
    request.finalProject = newProject._id;
    await request.save({ session: dbSession });

    const supervisorIds = request.supervisorInvites.map((s) => s.faculty);
    await Group.findByIdAndUpdate(
      request.group,
      {
        $set:      { status: "Active" },
        
        $addToSet: { supervisors: { $each: supervisorIds } } 
      },
      { session: dbSession }
    );

    await notifyGroup(request.group, req.user.id, `All supervisors accepted the MTP project proposal "${request.project.title}" for Semester ${semester}. The project is now active!`, dbSession);
    await dbSession.commitTransaction();

    return res.status(200).json({
      success: true,
      message: isOddSemester
        ? `All supervisors accepted. Group is now active and Semester ${semester} MTP project has been created.`
        : `All supervisors accepted. Semester ${semester} MTP project has been created.`,
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};