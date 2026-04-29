import mongoose from "mongoose";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Group from "../../models/Group.js";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import { sendNotification } from "../notificationController.js";

/**
 * @desc Get all project approval requests assigned to the faculty (all statuses)
 * @route GET /api/faculty/project-approvals
 * @access Private (attachFacultyProfile middleware required)
 */
export const getAllMyRequest = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    const { status } = req.query; // optional filter

    const query = {
      "supervisorInvites.faculty": req.faculty.id,
    };

    const allowedStatuses = ["PendingSupervisorApproval", "Approved", "Rejected"];
    if (status && allowedStatuses.includes(status)) {
      query.status = status;
    }

    const requests = await ProjectApprovalRequest.find(query)
      .select("group project supervisorInvites status createdAt")
      .populate({
        path: "group",
        select: "name session",
        populate: { path: "session", select: "name year -_id" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = requests.map((r) => {
      const myInvite = r.supervisorInvites.find((s) =>
        s.faculty.equals(req.faculty.id)
      );
      return {
        _id: r._id,
        group: r.group,
        project: r.project,
        myStatus: myInvite?.status || null,
        myRespondedAt: myInvite?.respondedAt || null,
        overallStatus: r.status,
        createdAt: r.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get full details of a single project approval request
 * @route GET /api/faculty/project-approvals/:requestId
 * @access Private (attachFacultyProfile middleware required)
 */
export const getRequestDetails = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!req.faculty || !req.faculty.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    const request = await ProjectApprovalRequest.findOne({
      _id: requestId,
      "supervisorInvites.faculty": req.faculty.id,
    })
      .populate({
        path: "group",
        select: "name status session supervisors",
        populate: [
          { path: "session", select: "name year -_id" },
          {
            path: "supervisors",
            select: "staffId",
            populate: { path: "user", select: "name email -_id" },
          },
        ],
      })
      .populate({
        path: "supervisorInvites.faculty",
        select: "staffId",
        populate: { path: "user", select: "name email -_id" },
      })
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or you are not assigned to it.",
      });
    }

    // Fetch students in the group
    const students = await Student.find({ groupId: request.group._id })
      .select("rollNumber specialization semester")
      .populate("user", "name email -_id")
      .lean();

    const supervisors = request.supervisorInvites.map((s) => ({
      name: s.faculty?.user?.name || null,
      email: s.faculty?.user?.email || null,
      staffId: s.faculty?.staffId || null,
      status: s.status,
      rejectionReason: s.rejectionReason || null,
      respondedAt: s.respondedAt || null,
    }));

    const myInvite = request.supervisorInvites.find((s) =>
      s.faculty._id
        ? s.faculty._id.equals(req.faculty.id)
        : s.faculty.equals(req.faculty.id)
    );

    return res.status(200).json({
      success: true,
      data: {
        _id: request._id,
        group: {
          _id: request.group._id,
          name: request.group.name,
          status: request.group.status,
          session: request.group.session,
        },
        project: request.project,
        students: students.map((s) => ({
          name: s.user?.name || null,
          email: s.user?.email || null,
          rollNumber: s.rollNumber,
          specialization: s.specialization || null,
          semester: s.semester,
        })),
        supervisors,
        myStatus: myInvite?.status || null,
        myRejectionReason: myInvite?.rejectionReason || null,
        overallStatus: request.status,
        finalProject: request.finalProject || null,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Respond to a project approval request (accept or reject)
 * @route PATCH /api/faculty/project-approvals/:requestId/respond
 * @access Private (attachFacultyProfile middleware required)
 */
export const respondToRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  let committed = false;
  try {
    const { requestId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!req.faculty || !req.faculty.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({ success: false, message: "Unauthorized: Faculty profile not attached" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }

    if (!["accept", "reject"].includes(action)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'." });
    }

    if (action === "reject" && (!rejectionReason || typeof rejectionReason !== "string" || !rejectionReason.trim())) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "A rejection reason is required." });
    }

    const [request, faculty] = await Promise.all([
      ProjectApprovalRequest.findOne({
        _id: requestId,
        status: "PendingSupervisorApproval",
        "supervisorInvites.faculty": req.faculty.id,
      }).session(dbSession),
      Faculty.findById(req.faculty.id)
        .select("_id departmentConfig groupIds")
        .populate("user", "_id role")
        .session(dbSession),
    ]);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Request not found, already resolved, or you are not assigned to it." });
    }
    if (!faculty) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Faculty profile not found." });
    }

    const slot = request.supervisorInvites.find((s) => s.faculty.equals(req.faculty.id));
    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already responded to this request." });
    }

    const [deptConfig, groupStudents] = await Promise.all([
      DepartmentConfig.findById(faculty.departmentConfig).select("btpConfig").session(dbSession),
      Student.find({ groupId: request.group })
        .populate("user", "_id role")
        .session(dbSession)
        .lean(),
    ]);

    const groupMemberRecipients = groupStudents
      .map((s) => s.user)
      .filter(Boolean)
      .map((s) => ({ _id: s._id, role: s.role }));

    // ── Rejection ─────────────────────────────────────────────────────────────
    if (action === "reject") {
      slot.status = "Rejected";
      slot.rejectionReason = rejectionReason.trim();
      slot.respondedAt = new Date();
      request.status = "Rejected";
      request.rejectedBy = faculty._id;

      const revertStatus = request.project.semester === 7 ? "Formed" : "Active";

      await Promise.all([
        request.save({ session: dbSession }),
        Group.findByIdAndUpdate(request.group, { $set: { status: revertStatus } }, { session: dbSession }),
      ]);

      await dbSession.commitTransaction();
      committed = true;

      await sendNotification({
        type: "PROJECT_PROPOSAL_REJECTED",
        message: `Your project proposal for Semester ${request.project.semester} was rejected by a supervisor. You may resubmit.`,
        refId: request._id,
        refModel: "ProjectApprovalRequest",
        triggeredBy: req.user._id,
      }, groupMemberRecipients);

      return res.status(200).json({ success: true, message: "Project approval request rejected." });
    }

    // ── Acceptance ────────────────────────────────────────────────────────────
    if (
      deptConfig?.btpConfig?.maxGroupsPerSupervisor &&
      faculty.groupIds.length >= deptConfig.btpConfig.maxGroupsPerSupervisor
    ) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You have reached your maximum group limit and cannot accept more." });
    }

    slot.status = "Accepted";
    slot.respondedAt = new Date();
    await request.save({ session: dbSession });

    const allAccepted = request.supervisorInvites.every((s) => s.status === "Accepted");

    // ── Partial Acceptance ────────────────────────────────────────────────────
    if (!allAccepted) {
      const remaining = request.supervisorInvites.filter((s) => s.status === "Pending").length;

      await dbSession.commitTransaction();
      committed = true;

      await sendNotification({
        type: "PROJECT_PROPOSAL_ACCEPTED",
        message: `A supervisor accepted your project proposal for Semester ${request.project.semester}. Waiting for ${remaining} more supervisor(s).`,
        refId: request._id,
        refModel: "ProjectApprovalRequest",
        triggeredBy: req.user._id,
      }, groupMemberRecipients);

      return res.status(200).json({ success: true, message: `You accepted. Waiting for ${remaining} more supervisor(s) to respond.` });
    }

    // ── All Accepted → Finalise ───────────────────────────────────────────────
    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Could not find active session to create the project." });
    }

    const supervisorIds = request.supervisorInvites.map((s) => s.faculty);

    const [newProject] = await Project.create(
      [{
        title: request.project.title,
        description: request.project.description,
        domain: request.project.domain,
        semester: request.project.semester,
        session: activeSession._id,
        group: request.group,
        status: "Approved",
      }],
      { session: dbSession }
    );

    request.status = "Approved";
    request.finalProject = newProject._id;

    const saves = [request.save({ session: dbSession })];

    if (request.project.semester === 7) {
      saves.push(
        Group.findByIdAndUpdate(
          request.group,
          { $set: { status: "Active" }, $addToSet: { supervisors: { $each: supervisorIds } } },
          { session: dbSession }
        ),
        Faculty.updateMany(
          { _id: { $in: supervisorIds } },
          { $addToSet: { groupIds: request.group } },
          { session: dbSession }
        )
      );
    }

    await Promise.all(saves);

    await dbSession.commitTransaction();
    committed = true;

    await sendNotification({
      type: "PROJECT_PROPOSAL_ACCEPTED",
      message: `All supervisors accepted your project proposal "${request.project.title}" for Semester ${request.project.semester}. Your project is now active!`,
      refId: newProject._id,
      refModel: "Project",
      triggeredBy: req.user._id,
    }, groupMemberRecipients);

    return res.status(200).json({
      success: true,
      message: request.project.semester === 7
        ? "All supervisors accepted. Group is now active and project has been created."
        : "All supervisors accepted. Semester 8 project has been created.",
    });

  } catch (error) {
    if (!committed) await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};