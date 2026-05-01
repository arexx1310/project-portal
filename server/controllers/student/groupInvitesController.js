import mongoose from "mongoose";
import GroupFormation from "../../models/GroupFormationInvite.js";
import Group from "../../models/Group.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import Session from "../../models/Session.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import { sendNotification } from "../notificationController.js";

// ── helper to avoid crashing after commit ────────────────────────────────
const safeNotify = async (payload, recipients) => {
  try {
    await sendNotification(payload, recipients);
  } catch (notifyErr) {
    console.error("sendNotification failed (non-fatal):", notifyErr);
  }
};

/**
 * @desc    Get BTP config for student's department
 * @route   GET /api/student/btpconfig
 * @access  Private (attachStudentProfile middleware required)
 */
export const getBTPConfig = async (req, res, next) => {
  try {
    if (!req.student || !req.student.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    const departmentConfig = await DepartmentConfig.findById(
      req.student.departmentConfig
    ).select("department btpConfig -_id");

    if (!departmentConfig) {
      return res.status(404).json({
        success: false,
        message: "Could not fetch department's BTP configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      data: departmentConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Look up a student by roll number to add to invite
 * @route GET /api/student/group-invites/addmember/:rollNumber
 * @access Private (attachStudentProfile middleware required)
 */
export const addMember = async (req, res, next) => {
  try {
    const { rollNumber } = req.params;

    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    if (!rollNumber || typeof rollNumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Roll number is required.",
      });
    }

    const normalizedRollNumber = rollNumber.trim().toUpperCase();

    const member = await Student.findOne({ rollNumber: normalizedRollNumber })
      .select("_id rollNumber user isAvailableForInvite groupId")
      .populate("user", "name")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Could not find member.",
      });
    }

    if (String(member._id) === String(req.student.id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot add yourself.",
      });
    }

    if (!member.isAvailableForInvite || member.groupId) {
      return res.status(400).json({
        success: false,
        message: "This student is already part of a group or has a pending invite.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: member._id,
        name: member.user?.name || null,
        rollNumber: member.rollNumber,
      },
      message: "Member found.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a group invite
 * @route POST /api/student/group-invites/
 * @access Private (attachStudentProfile middleware required)
 */
export const createGroupInvite = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // ================= 1. Auth =================
    if (!req.student?.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    const { groupName, membersIds = [] } = req.body;

    // ================= 2. Basic Validation =================
    if (!groupName?.trim()) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Group name is required.",
      });
    }

    if (!Array.isArray(membersIds)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "membersIds must be an array.",
      });
    }

    if (membersIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid member ID provided.",
      });
    }

    const uniqueMembers = [...new Set(membersIds.map(String))];

    // ================= 3. Fetch Initiator =================
    const initiator = await Student.findById(req.student.id).session(dbSession);

    if (!initiator) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    if (!initiator.isAvailableForInvite || initiator.groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "You already have an active invite or belong to a group.",
      });
    }

    if (uniqueMembers.includes(String(initiator._id))) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a member.",
      });
    }

    const totalMembers = uniqueMembers.length + 1;

    if (totalMembers === 1) {
        // Create group directly (no invites)
        const [group] = await Group.create(
          [
            {
              name: groupName.trim(),
              departmentConfigs: [initiator.departmentConfig],
              session: initiator.session,
              status: "Formed",
            },
          ],
          { session: dbSession }
        );

        // Assign group to initiator
        initiator.groupId = group._id;
        initiator.isAvailableForInvite = false;
        await initiator.save({ session: dbSession });

        await dbSession.commitTransaction();

        return res.status(201).json({
          success: true,
          message: "Group created successfully with only initiator.",
        });
    }

    // ================= 4. Fetch Members =================
    const members = await Student.find({ _id: { $in: uniqueMembers } })
      .populate("user", "_id role")
      .lean()
      .session(dbSession);

    if (members.length !== uniqueMembers.length) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Some members not found.",
      });
    }

    for (const m of members) {
      if (m.groupId || !m.isAvailableForInvite) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Member ${m.rollNumber} cannot be added.`,
        });
      }
    }

    // ================= 5. Fetch ALL Dept Configs (1 query) =================
    const deptIds = new Set([
      String(initiator.departmentConfig),
      ...members.map((m) => String(m.departmentConfig)),
    ]);

    const deptConfigs = await DepartmentConfig.find({
      _id: { $in: [...deptIds] },
    })
      .select("department btpConfig")
      .lean()
      .session(dbSession);

    const deptMap = {};
    deptConfigs.forEach((dc) => {
      deptMap[String(dc._id)] = dc;
    });

    const initiatorDeptId = String(initiator.departmentConfig);
    const initiatorConfig = deptMap[initiatorDeptId]?.btpConfig;

    if (!initiatorConfig) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Initiator department config not found.",
      });
    }

    // ================= 6. Deadline =================
    if (new Date() > new Date(initiatorConfig.groupCreationDeadline)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Group creation deadline has passed.",
      });
    }

    // ================= 7. Group Size =================
  
    if (
      totalMembers < initiatorConfig.minStudentsPerGroup ||
      totalMembers > initiatorConfig.maxStudentsPerGroup
    ) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Group size must be between ${initiatorConfig.minStudentsPerGroup} and ${initiatorConfig.maxStudentsPerGroup}.`,
      });
    }
    // ================= 8. Cross-Dept Validation =================
    const deptCounts = {};
    deptCounts[initiatorDeptId] = 1;

    for (const m of members) {
      const d = String(m.departmentConfig);
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    }

    for (const deptId of Object.keys(deptCounts)) {
      const count = deptCounts[deptId];
      const deptData = deptMap[deptId];

      if (!deptData) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Missing department config.",
        });
      }

      const { department, btpConfig } = deptData;
      const crossRules = btpConfig.crossDepartmentRules;

      if (!crossRules?.isAllowed && deptId !== initiatorDeptId) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Cross-department grouping not allowed for ${department}.`,
        });
      }

      if (crossRules?.isAllowed && totalMembers>1) {
        const minSame = crossRules.minSameDepartmentStudents;
        if (count < minSame) {
          await dbSession.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `${department} requires at least ${minSame} students from same department, but only ${count} selected.`,
          });
        }
      }
    }

    // ================= 9. Create Group =================
    const [groupFormation] = await GroupFormation.create(
      [
        {
          initiator: initiator._id,
          groupName: groupName.trim(),
          memberInvites: members.map((m) => ({ student: m._id })),
        },
      ],
      { session: dbSession }
    );

    // Lock initiator
    initiator.isAvailableForInvite = false;
    await initiator.save({ session: dbSession });

    // ================= 10. Commit =================
    await dbSession.commitTransaction();

    // ================= 11. Notify AFTER commit =================
    const recipients = members.map((m) => ({
      _id: m.user._id,
      role: m.user.role,
    }));

    await safeNotify(
      {
        type: "GROUP_INVITE_RECEIVED",
        message: `You have been invited to join group "${groupName.trim()}" by ${initiator.rollNumber}.`,
        refId: groupFormation._id,
        refModel: "GroupFormation",
        triggeredBy: req.user.id,
      },
      recipients
    );

    return res.status(201).json({
      success: true,
      message: "Group invite created successfully.",
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

/**
 * @desc Get invite details
 * @route GET /api/student/group-invites/:inviteId
 * @access Private
 */
export const getGroupInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invite ID.",
      });
    }

    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    const studentId = req.student.id;

    const invite = await GroupFormation.findOne({
      _id: inviteId,
      $or: [{ initiator: studentId }, { "memberInvites.student": studentId }],
    })
      .select(
        "groupName status rejectedBy createdAt updatedAt initiator memberInvites finalGroup"
      )
      .populate({
        path: "initiator",
        select: "rollNumber specialization",
        populate: { path: "user", select: "name email -_id" },
      })
      .populate({
        path: "memberInvites.student",
        select: "rollNumber specialization",
        populate: { path: "user", select: "name email -_id" },
      })
      .lean();

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found or access denied.",
      });
    }

    const members = (invite.memberInvites || []).map((m) => ({
      name: m.student?.user?.name || null,
      email: m.student?.user?.email || null,
      rollNumber: m.student?.rollNumber || null,
      specialization: m.student?.specialization || null,
      status: m.status,
      respondedAt: m.respondedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        _id: invite._id,
        groupName: invite.groupName,
        status: invite.status,
        initiator: {
          name: invite.initiator?.user?.name || null,
          email: invite.initiator?.user?.email || null,
          rollNumber: invite.initiator?.rollNumber || null,
          specialization: invite.initiator?.specialization || null,
        },
        members,
        finalGroup: invite.finalGroup || null,
        rejectedBy: invite.rejectedBy || null,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List all invites for the current student
 * @route GET /api/student/group-invites/mine
 * @access Private
 */
export const listMyInvites = async (req, res, next) => {
  try {
    if (!req.student || !req.student.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    const studentId = req.student.id;

    const invites = await GroupFormation.find({
      $or: [
        { initiator: studentId },
        { "memberInvites.student": studentId },
      ],
    })
      .select("groupName status rejectedBy createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: invites.length,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Cancel a pending invite (initiator only)
 * @route DELETE /api/student/group-invites/:inviteId
 * @access Private
 */
export const cancelGroupInvite = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const { inviteId } = req.params;

    if (!req.student || !req.student.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student profile not attached",
      });
    }

    const studentId = req.student.id;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid invite ID.",
      });
    }

    const invite = await GroupFormation.findOne({
      _id: inviteId,
      initiator: studentId,
    })
      .select("status initiator memberInvites groupName")
      .session(dbSession);

    if (!invite) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Invite not found or you are not the initiator.",
      });
    }

    if (invite.status !== "PendingMemberApproval") {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "This invite can no longer be cancelled.",
      });
    }

    invite.status = "Rejected";
    invite.rejectedBy = "Initiator";

    const allStudentIds = [
      invite.initiator,
      ...invite.memberInvites.map((m) => m.student),
    ];

    // Fetch members for notification before commit
    const memberStudents = await Student.find({
      _id: { $in: invite.memberInvites.map((m) => m.student) },
    })
      .populate("user", "_id role")
      .session(dbSession)
      .lean();

    await Promise.all([
      invite.save({ session: dbSession }),
      Student.updateMany(
        { _id: { $in: allStudentIds } },
        { $set: { isAvailableForInvite: true } },
        { session: dbSession }
      ),
    ]);

    await dbSession.commitTransaction();

    // Notify members AFTER commit
    const recipients = memberStudents
      .filter((s) => s.user)
      .map((s) => ({ _id: s.user._id, role: s.user.role }));

    if (recipients.length > 0) {
      await safeNotify(
        {
          type: "GROUP_INVITE_CANCELLED",
          message: `The group invite for "${invite.groupName}" has been cancelled by the initiator.`,
          refId: invite._id,
          refModel: "GroupFormation",
          triggeredBy: req.user.id,
        },
        recipients
      );
    }

    return res.status(200).json({
      success: true,
      message: "Invite cancelled successfully.",
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

/**
 * @desc Member responds to a group invite
 * @route PATCH /api/student/group-invites/:inviteId/member-response
 * @access Private
 */
export const memberRespond = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const { inviteId } = req.params;
    const { action } = req.body;

    if (!req.student || !req.student.id || !req.user || !req.user.id) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Student/User profile not attached",
      });
    }

    const studentId = req.student.id;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid invite ID.",
      });
    }

    if (!["accept", "reject"].includes(action)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Action must be 'accept' or 'reject'.",
      });
    }

    // Fetch Student
    const studentRecord = await Student.findById(studentId)
      .select("_id rollNumber isAvailableForInvite departmentConfig groupId")
      .session(dbSession);

    if (!studentRecord) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // Fetch Invite
    const invite = await GroupFormation.findOne({
      _id: inviteId,
      status: "PendingMemberApproval",
      "memberInvites.student": studentRecord._id,
    }).session(dbSession);

    if (!invite || !invite.memberInvites) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Invite not found or you are not invited.",
      });
    }

    const slot = invite.memberInvites.find((m) =>
      m.student.equals(studentRecord._id)
    );

    if (!slot || slot.status !== "Pending") {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "You have already responded to this invite.",
      });
    }

    // ── REJECTION ────────────────────────────────────────────────────────────
    if (action === "reject") {
      slot.status = "Rejected";
      slot.respondedAt = new Date();
      invite.status = "Rejected";
      invite.rejectedBy = `Member: ${studentRecord.rollNumber}`;

      const allStudentIds = [
        invite.initiator,
        ...invite.memberInvites.map((m) => m.student),
      ];

      const initiatorStudent = await Student.findById(invite.initiator)
        .populate("user", "_id role")
        .session(dbSession)
        .lean();

      await Promise.all([
        invite.save({ session: dbSession }),
        Student.updateMany(
          { _id: { $in: allStudentIds } },
          { $set: { isAvailableForInvite: true } },
          { session: dbSession }
        ),
      ]);

      await dbSession.commitTransaction();

      if (initiatorStudent?.user) {
        await safeNotify(
          {
            type: "GROUP_INVITE_REJECTED",
            message: `${studentRecord.rollNumber} rejected the group invite for "${invite.groupName}". Group registration cancelled.`,
            refId: invite._id,
            refModel: "GroupFormation",
            triggeredBy: req.user.id,
          },
          [{ _id: initiatorStudent.user._id, role: initiatorStudent.user.role }]
        );
      }

      return res.status(200).json({
        success: true,
        message: "Invite rejected. Group registration cancelled.",
      });
    }

    // ── ACCEPTANCE ───────────────────────────────────────────────────────────

    // Deadline check
    const config = await DepartmentConfig.findById(
      studentRecord.departmentConfig
    )
      .select("btpConfig.groupCreationDeadline")
      .session(dbSession);

    if (!config?.btpConfig?.groupCreationDeadline) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Group creation configuration not found.",
      });
    }

    if (new Date() > new Date(config.btpConfig.groupCreationDeadline)) {
      // Deadline passed — reject the whole invite and free everyone
      slot.status = "Rejected";
      slot.respondedAt = new Date();
      invite.status = "Rejected";
      invite.rejectedBy = `Member: ${studentRecord.rollNumber} (deadline passed)`;

      const allStudentIds = [
        invite.initiator,
        ...invite.memberInvites.map((m) => m.student),
      ];

      const initiatorStudent = await Student.findById(invite.initiator)
        .populate("user", "_id role")
        .session(dbSession)
        .lean();

      await Promise.all([
        invite.save({ session: dbSession }),
        Student.updateMany(
          { _id: { $in: allStudentIds } },
          { $set: { isAvailableForInvite: true } },
          { session: dbSession }
        ),
      ]);

      await dbSession.commitTransaction();

      if (initiatorStudent?.user) {
        await safeNotify(
          {
            type: "GROUP_INVITE_REJECTED",
            message: `Group invite for "${invite.groupName}" was cancelled because the group creation deadline has passed.`,
            refId: invite._id,
            refModel: "GroupFormation",
            triggeredBy: req.user.id,
          },
          [{ _id: initiatorStudent.user._id, role: initiatorStudent.user.role }]
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "The group creation deadline for your department has passed. The invite has been cancelled and all members have been freed.",
      });
    }

    slot.status = "Accepted";
    slot.respondedAt = new Date();

    await invite.save({ session: dbSession });

    const allAccepted = invite.memberInvites.every(
      (m) => m.status === "Accepted"
    );

    // ── All members accepted → form the group ────────────────────────────────
    if (allAccepted) {
      const activeSession = await Session.getActiveSession();

      if (!activeSession) {
        await dbSession.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Could not find active session for group creation.",
        });
      }

      const allStudentIds = [
        invite.initiator,
        ...invite.memberInvites.map((m) => m.student),
      ];

      const allStudents = await Student.find({ _id: { $in: allStudentIds } })
        .populate("user", "_id role")
        .session(dbSession)
        .lean();

      const departmentConfigs = [
        ...new Set(allStudents.map((s) => String(s.departmentConfig))),
      ];

      const [group] = await Group.create(
        [
          {
            name: invite.groupName,
            departmentConfigs,
            session: activeSession._id,
            supervisors: [],
            status: "Formed",
          },
        ],
        { session: dbSession }
      );

      const groupId = group._id;

      invite.status = "Approved";
      invite.finalGroup = groupId;

      await Promise.all([
        invite.save({ session: dbSession }),
        Student.updateMany(
          { _id: { $in: allStudentIds } },
          { $set: { groupId, isAvailableForInvite: false } },
          { session: dbSession }
        ),
      ]);

      await dbSession.commitTransaction();

      await safeNotify(
        {
          type: "GROUP_FORMED",
          message: `Your group "${invite.groupName}" has been formed successfully!`,
          refId: groupId,
          refModel: "Group",
          triggeredBy: req.user.id,
        },
        allStudents.map((s) => ({ _id: s.user._id, role: s.user.role }))
      );

      return res.status(200).json({
        success: true,
        message:
          "All members accepted. Group created. You can now submit a project approval request.",
      });
    }

    // ── Still waiting for other members ──────────────────────────────────────
    const remaining = invite.memberInvites.filter(
      (m) => m.status === "Pending"
    ).length;

    const initiatorStudent = await Student.findById(invite.initiator)
      .populate("user", "_id role")
      .session(dbSession)
      .lean();

    await dbSession.commitTransaction();

    if (initiatorStudent?.user) {
      await safeNotify(
        {
          type: "GROUP_INVITE_ACCEPTED",
          message: `${studentRecord.rollNumber} accepted your group invite for "${invite.groupName}". Waiting for ${remaining} more member(s).`,
          refId: invite._id,
          refModel: "GroupFormation",
          triggeredBy: req.user.id,
        },
        [{ _id: initiatorStudent.user._id, role: initiatorStudent.user.role }]
      );
    }

    return res.status(200).json({
      success: true,
      message: `You accepted. Waiting for ${remaining} more member(s) to respond.`,
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};