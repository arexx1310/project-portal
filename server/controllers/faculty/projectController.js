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
  
    // ── Basic validation ──────────────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    if (!["accept", "reject"].includes(action.toLowerCase())){
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    // ── Faculty identity from token — no DB hit ───────────────────────────────
    const { id: facultyId, department: facultyDeptId } = req.faculty;

    // ── Fetch request ─────────────────────────────────────────────────────────
    const request = await ProjectApprovalRequest.findOne({
      _id:                         requestId,
      status:                      "PendingSupervisorApproval",
      "supervisorInvites.faculty": facultyId,
    }).session(dbSession);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Request not found, already resolved, or you are not assigned to it." });
    }

    if (!request.group || !request.project || ![7, 8].includes(request.project.semester)) {
      await dbSession.abortTransaction();
      return res.status(422).json({ success: false, message: "Malformed approval request data." });
    }

    // ── This faculty's slot must still be Pending ─────────────────────────────
    const slot = request.supervisorInvites.find((s) => s.faculty.equals(facultyId));
    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already responded to this request." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REJECTION
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "reject") {
      slot.status        = "Rejected";
      slot.respondedAt   = new Date();
      request.status     = "Rejected";
      request.rejectedBy = facultyId;

      await request.save({ session: dbSession });
      await dbSession.commitTransaction();

      await notifyGroup(request.group,req.user.id,"Supervisor has rejected the project proposal request for your group.")

      return res.status(200).json({ success: true, message: "Project approval request rejected." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACCEPTANCE
    // ══════════════════════════════════════════════════════════════════════════
    const { semester } = request.project;

    if (semester === 7 ) {

      // ── Guard 1: group must not already have supervisors ──────────────────
      const group = await Group.findById(request.group)
        .select("supervisors")
        .lean()
        .session(dbSession);

      if (group?.supervisors?.length > 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "This group already has supervisors assigned. Request is no longer valid." });
      }

      // ── Guards 2 & 3: deadline + slot cap — dept from token, one fetch ────
      const deptConfig = await Department.findById(facultyDeptId)
        .select("btpConfig.lockRecordDeadline btpConfig.maxGroupsPerSupervisor")
        .lean();

      if (!deptConfig?.btpConfig) {
        await dbSession.abortTransaction();
        return res.status(409).json({ success: false, message: "BTP configuration not found for your department." });
      }

      const { lockRecordDeadline, maxGroupsPerSupervisor } = deptConfig.btpConfig;

      if (new Date() > new Date(lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "The supervisor selection deadline has passed." });
      }

      const activeSession = await Session.getActiveSession();
      if (!activeSession) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "No active session found." });
      }

      const currentGroupCount = await Group.countDocuments({
        supervisors: facultyId,
        programType: "UG",
        session:     activeSession._id,
        status:      { $ne: "Closed" },
      });

      if (currentGroupCount >= maxGroupsPerSupervisor) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "You have reached your maximum group supervision limit." });
      }
    }

    // ── Mark slot accepted ────────────────────────────────────────────────────
    slot.status       = "Accepted";
    slot.respondedAt  = new Date();
    request.expiresAt = null;
    await request.save({ session: dbSession });

    const allAccepted = request.supervisorInvites.every((s) => s.status === "Accepted");

    // ── Partial acceptance ────────────────────────────────────────────────────
    if (!allAccepted) {
      const remaining = request.supervisorInvites.filter((s) => s.status === "Pending").length;

      await dbSession.commitTransaction();

      await notifyGroup(request.group,req.user.id,`Supervisor accepted the project proposal for Semester ${semester}. Waiting for ${remaining} more supervisor(s).`);
      return res.status(200).json({ success: true, message: `You accepted. Waiting for ${remaining} more supervisor(s) to respond.` });
    }

    // ── All accepted → create project ─────────────────────────────────────────
    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "No active session found." });
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
     

    

    await dbSession.commitTransaction();
    await notifyGroup(request.group,req.user.id,`All supervisors accepted the project proposal "${request.project.title}" for Semester ${semester}. The project is now active!`);
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

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    if (!["accept", "reject"].includes(action.toLowerCase())) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    // ── Faculty identity from token — no DB hit ───────────────────────────────
    const { id: facultyId, department: facultyDeptId } = req.faculty;

    // ── Fetch request ─────────────────────────────────────────────────────────
    const request = await ProjectApprovalRequest.findOne({
      _id:                         requestId,
      status:                      "PendingSupervisorApproval",
      "supervisorInvites.faculty": facultyId,
    }).session(dbSession);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Request not found, already resolved, or you are not assigned to it." });
    }

    // ── PG semester guard ─────────────────────────────────────────────────────
    if (!request.group || !request.project || ![1, 2, 3, 4].includes(request.project.semester)) {
      await dbSession.abortTransaction();
      return res.status(422).json({ success: false, message: "Malformed approval request data." });
    }

    // ── This faculty's slot must still be Pending ─────────────────────────────
    const slot = request.supervisorInvites.find((s) => s.faculty.equals(facultyId));
    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already responded to this request." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REJECTION
    // ══════════════════════════════════════════════════════════════════════════
    if (action.toLowerCase() === "reject") {
      slot.status        = "Rejected";
      slot.respondedAt   = new Date();
      request.status     = "Rejected";
      request.rejectedBy = facultyId;

      await request.save({ session: dbSession });
      await dbSession.commitTransaction();

      await notifyGroup(request.group,req.user.id,"Supervisor has rejected the project proposal.");
      return res.status(200).json({ success: true, message: "MTP project approval request rejected." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACCEPTANCE
    // ══════════════════════════════════════════════════════════════════════════
    const { semester } = request.project;
    const isOddSemester = semester === 1 || semester === 3;

    if (isOddSemester) {

      // ── Guard 1: group must not already have supervisors ──────────────────
      // Prevents a race condition where two requests resolve simultaneously.
      const group = await Group.findById(request.group)
        .select("supervisors")
        .lean()
        .session(dbSession);

      if (group?.supervisors?.length > 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "This student already has supervisors assigned. Request is no longer valid." });
      }

      // ── Guards 2 & 3: deadline + student cap — dept from token, one fetch ─
      // mtpConfig.maxStudentsPerSupervisor caps how many active PG students
      // a faculty member may supervise concurrently (unlike BTP's maxGroupsPerSupervisor).
      const deptConfig = await Department.findById(facultyDeptId)
        .select("mtpConfig.lockRecordDeadline mtpConfig.maxStudentsPerSupervisor")
        .lean();

      if (!deptConfig?.mtpConfig) {
        await dbSession.abortTransaction();
        return res.status(409).json({ success: false, message: "MTP configuration not found for your department." });
      }

      const { lockRecordDeadline, maxStudentsPerSupervisor } = deptConfig.mtpConfig;

      // ── Deadline check ────────────────────────────────────────────────────
      if (new Date() > new Date(lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "The supervisor selection deadline has passed." });
      }

      // ── Student cap check ─────────────────────────────────────────────────
      const activeSession = await Session.getActiveSession();
      if (!activeSession) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "No active session found." });
      }

      // Count PG groups this faculty is already supervising in the active session.
      // Mirrors BTP's currentGroupCount but scoped to programType "PG".
      const currentStudentCount = await Group.countDocuments({
        supervisors: facultyId,
        programType: "PG",
        session:     activeSession._id,
        status:      { $ne: "Closed" },
      });

      if (currentStudentCount >= maxStudentsPerSupervisor) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "You have reached your maximum M.Tech student supervision limit." });
      }
    }

    // ── Mark slot accepted ────────────────────────────────────────────────────
    slot.status       = "Accepted";
    slot.respondedAt  = new Date();
    request.expiresAt = null;
    await request.save({ session: dbSession });

    const allAccepted = request.supervisorInvites.every((s) => s.status === "Accepted");

    // ── Partial acceptance ────────────────────────────────────────────────────
    if (!allAccepted) {
      const remaining = request.supervisorInvites.filter((s) => s.status === "Pending").length;

      await dbSession.commitTransaction();

      await notifyGroup(request.group,req.user.id,`A supervisor accepted your M.Tech project proposal for Semester ${semester}. Waiting for ${remaining} more supervisor(s).`);
      return res.status(200).json({ success: true, message: `You accepted. Waiting for ${remaining} more supervisor(s) to respond.` });
    }

    // ── All accepted → create project ─────────────────────────────────────────
    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "No active session found." });
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

    // ── Odd semesters: assign supervisors + activate group ────────────────────
    // Even semesters already have supervisors on the group from the prior odd
    // semester — no need to write them again.
    
    const supervisorIds = request.supervisorInvites.map((s) => s.faculty);
      await Group.findByIdAndUpdate(
        request.group,
        { $set: { status: "Active" }, $addToSet: { supervisors: { $each: supervisorIds } } },
        { session: dbSession }
      );
  

    await dbSession.commitTransaction();

    await notifyGroup(request.group,req.user.id,`All supervisors accepted your M.Tech project proposal "${request.project.title}" for Semester ${semester}. The project is now active!`);
    return res.status(200).json({
      success: true,
      message: isOddSemester
        ? `All supervisors accepted. Group is now active and semester ${semester} MTP project has been created.`
        : `All supervisors accepted. Semester ${semester} MTP project has been created.`,
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};