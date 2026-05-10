import mongoose from "mongoose";
import { refreshAuthCookie } from "../authController.js";

import Student from "../../models/Student.js";
import User from "../../models/User.js";
import Group from "../../models/Group.js";
import Department from "../../models/DepartmentConfig.js";
import GroupInvite from "../../models/GroupFormationInvite.js";


import { notifyUser, notifyGroup } from "../notificationController.js";

/**
 * @desc    Get BTP config for student's department
 * @route   GET /api/student/btpconfig
 * @access  Private (attachStudentProfile middleware required)
 */
export const getBTPConfig = async (req, res, next) => {
  try {
    // Validate auth data
    
    const department = await Department.findById(
      req.student.department
    ).select("department btpConfig -_id");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Could not fetch department's BTP configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Create a BTP group for UG students and creates a groupId for PG student to get officially registered.
 * @input   groupName (String)
 * @route   POST /api/student/create-group 
 * @access  Private (attachStudentProfile middleware required)
 */
export const createGroup = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { groupName } = req.body;
    const { id: initiatorId, isPG } = req.student;
    const programType = isPG ? "PG" : "UG";

    if (
      typeof groupName !== "string" ||
      !groupName.trim() ||
      groupName.trim().length < 6 ||
      !/^[a-zA-Z0-9_.@#\-\s]+$/.test(groupName.trim())
    ) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Group name must be at least 6 characters and contain only letters, numbers, and _ - . @ #",
      });
    }

    if (req.student.groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You are already part of a registered." });
    }

    const initiatorRecord = await Student.findById(initiatorId)
      .select("department groupId session")
      .lean()
      .session(dbSession);

    if (!initiatorRecord) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // ── Deadline — read from the right config block ──────────
    const deptData = await Department.findById(initiatorRecord.department)
      .select("btpConfig.lockRecordDeadline mtpConfig.lockRecordDeadline")
      .lean()
      .session(dbSession);

    const deadline = isPG
      ? deptData?.mtpConfig?.lockRecordDeadline
      : deptData?.btpConfig?.lockRecordDeadline;

    if (!deadline) {
      await dbSession.abortTransaction();
      return res.status(409).json({
        success: false,
        message: `${isPG ? "MTP" : "BTP"} configuration is not set for your department.`,
      });
    }

    if (new Date() > new Date(deadline)) {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "The deadline for changes has passed for your department.",
      });
    }

    // ── Create group ─────────────────────────────────────────
    const newGroup = await Group.create(
      [
        {
          name:        groupName.trim(),
          programType,                          // "UG" or "PG"
          departments: [initiatorRecord.department],
          session:     initiatorRecord.session,
          status:      "Draft",
        },
      ],
      { session: dbSession }
    );

    await Student.findByIdAndUpdate(
      initiatorId,
      { groupId: newGroup[0]._id },
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    await refreshAuthCookie(res, req);

    return res.status(201).json({
      success: true,
      message: "Group created successfully.",
      group: newGroup[0],
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

/**
 * @desc    Get all invites from the group
 * @route   GET /api/student/group/invites
 * @access  Private (attachStudentProfile middleware required)
 */
export const getGroupsInvite = async (req, res,next) => {
    try {
        //  handle null student
        if (!req.student || !req.student.groupId) {
            return res.status(200).json({
                success: true,
                data: null,
                isGroup: false,
            });
        }

        const groupInvites = await GroupInvite.find({groupId: req.student.groupId})
            .populate({
                path: "initiator",
                select: "user rollNumber",
                populate: [
                    {path: "user", select: "name -_id"},
                ]
            })
            .populate({
                path: "receiver",
                select: "user rollNumber",
                populate: [
                    {path: "user", select: "name -_id"},
                ]
            })

        const list = groupInvites.map((g) => (
            {
                id: g._id,
                initiator: {
                    name: g.initiator?.user?.name || "",
                    rollNumber: g.initiator?.rollNumber || ""
                },
                receiver: {
                    name: g.receiver?.user?.name || "",
                    rollNumber: g.receiver?.rollNumber || ""
                },
                status: g.status,
                rejectionReason: g.rejectionReason,
                expiresAt: g.expiresAt
            }
        ))

        return res.status(200).json({
            success: true,
            data: list || [],
            isGroup: true
        });

    } catch (error) {
        next(error);
    }
}

/* ===============================================================
   HELPERS
=============================================================== */

/**
 * Returns actual available slots for a group factoring in
 * current members AND pending invites against a given max cap.
 */
const getActualSlots = async (groupId, maxStudents, dbSession) => {
    const memberCount = await Student.countDocuments({ groupId }).session(dbSession);
    const pendingCount = await GroupInvite.countDocuments({ groupId, status: "pending" }).session(dbSession);
    const actualSlots = maxStudents - memberCount - pendingCount;
    return { actualSlots, memberCount, pendingCount };

};


/**
 * @desc    Get all invites for a receiver 
 * @route   GET /api/student/group/my-invites
 * @access  Private (attachStudentProfile middleware required)
 */
export const getMyInvites = async (req, res,next) => {
    try {
        const studentId = req.student.id;
    
        const groupInvites = await GroupInvite.find({
            receiver: req.student.id,
            status: "pending"
        })
            .populate({
                path: "initiator",
                select: "user rollNumber",
                populate: [
                    {path: "user", select: "name -_id"},
                ]
            })
            .populate({
                path: "receiver",
                select: "user rollNumber",
                populate: [
                    {path: "user", select: "name -_id"},
                ]
            })

        const list = groupInvites.map((g) => (
            {
                id: g._id,
                initiator: {
                    name: g.initiator?.user?.name || "",
                    rollNumber: g.initiator?.rollNumber || ""
                },
                receiver: {
                    name: g.receiver?.user?.name || "",
                    rollNumber: g.receiver?.rollNumber || ""
                },
                status: g.status,
                rejectionReason: g.rejectionReason,
                expiresAt: g.expiresAt
            }
        ))
        
        return res.status(200).json({
            success: true,
            data: list || [],
        });

    } catch (error) {
        next(error);
    }
}


/* ===============================================================
   SEND INVITE
=============================================================== */

/**
 * @desc    Send a group formation invite to another student
 * @route   POST /api/student/group/send-invite
 * @access  Private (attachStudentProfile middleware required)
 */
export const sendInvite = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { rollNumber } = req.body;

    /* ── 1. Validate input ───────────────────────────────────────────────────── */
    if (!rollNumber || typeof rollNumber !== "string" || !rollNumber.trim()) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "rollNumber must be a non-empty string." });
    }

    const normalizedRollNumber = rollNumber.trim().toUpperCase();

    /* ── 2. Sender checks — straight from token, no DB ───────────────────────── */
    const { id: senderId, groupId, session: sessionId } = req.student;

    if (!groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You must be part of a group before sending invites." });
    }

    /* ── 3. Parallel fetch: group + receiver ─────────────────────────────────── */
    // Neither depends on the other — fire together.
    const group = await Group.findById(groupId)
        .select("name departments status")
        .lean()
        .session(dbSession);

    const receiver = await Student.findOne({ rollNumber: normalizedRollNumber, session: sessionId })
        .select("_id groupId user")
        .lean()
        .session(dbSession);

    /* ── 4. Group guards ──────────────────────────────────────────────────────── */
    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (group.status !== "Draft") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Group has been registered officially. Cannot add more members." });
    }

    /* ── 5. Receiver guards ───────────────────────────────────────────────────── */
    if (!receiver) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: `No student found with roll number "${normalizedRollNumber}" in your session.` });
    }

    if (receiver._id.equals(senderId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You cannot send an invite to yourself." });
    }

    if (receiver.groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: `${normalizedRollNumber} is already part of a group.` });
    }

    /* ── 6. Parallel fetch: dept config + duplicate invite check ─────────────── */
    // Both depend on group being valid — fire together now.
    const primaryDept = await Department.findById(group.departments[0])
        .select("department btpConfig.lockRecordDeadline btpConfig.maxStudentsPerGroup")
        .lean()
        .session(dbSession);

    const existingInvite = await  GroupInvite.findOne({ groupId: group._id, receiver: receiver._id, status: "pending" })
        .lean()
        .session(dbSession);
    

    if (!primaryDept?.btpConfig) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Primary department configuration not found." });
    }

    if (existingInvite) {
      await dbSession.abortTransaction();
      return res.status(409).json({ success: false, message: `A pending invite already exists for ${normalizedRollNumber}.` });
    }

    const { btpConfig, department: deptName } = primaryDept;

    /* ── 7. Deadline check ────────────────────────────────────────────────────── */
    if (new Date() > new Date(btpConfig.lockRecordDeadline)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: `Invite window has closed. Lock deadline was ${new Date(btpConfig.lockRecordDeadline).toDateString()}.` });
    }

    /* ── 8. Slot check ────────────────────────────────────────────────────────── */
    const { actualSlots, memberCount } = await getActualSlots(
      group._id,
      btpConfig.maxStudentsPerGroup,
      dbSession
    );

    if (memberCount >= btpConfig.maxStudentsPerGroup) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: `Group is full. Maximum allowed: ${btpConfig.maxStudentsPerGroup} for department "${deptName}".` });
    }

    if (actualSlots <= 0) {
      await dbSession.abortTransaction();
      return res.status(409).json({ success: false, message: "No slots available. All remaining slots are occupied by pending invites. Withdraw one to proceed." });
    }

    /* ── 9. Create invite ─────────────────────────────────────────────────────── */
    const expiresAt = new Date(btpConfig.lockRecordDeadline);
    expiresAt.setDate(expiresAt.getDate() + 15);

    const [invite] = await GroupInvite.create(
      [{ initiator: senderId, groupId: group._id, receiver: receiver._id, status: "pending", expiresAt }],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    
    await notifyUser(receiver.user, "student", req.user.id,`You received an invite to join group: ${group.name}. Check details in invitation page.`);
    await notifyGroup(group._id,req.user.id,`A group invite has been sent from your group to ${rollNumber}. Check details in invitation page.`);
    return res.status(201).json({
      success: true,
      message: `Invite sent to ${normalizedRollNumber} successfully.`,
      data: { inviteId: invite._id, receiver: normalizedRollNumber },
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};


/**
 * Marks an invite as rejected with a reason and nulls out expiry.
 * Does NOT commit — caller owns the transaction.
 */
const rejectInvite = async (invite, reason, dbSession) => {
    invite.status = "rejected";
    invite.rejectionReason = reason;
    invite.expiresAt = null;
    await invite.save({ session: dbSession });
};

/* ===============================================================
   RESPOND INVITE
=============================================================== */
/**
 * @desc    Respond to a received group invite
 * @route   PATCH /api/student/group/respond-invite/:inviteId
 * @access  Private (attachStudentProfile middleware required)
 */
export const respondInvite = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { inviteId } = req.params;
    const { action }   = req.body;

    /* ── 1. Validate action ───────────────────────────────────────────────── */
    if (!["Accept", "Reject"].includes(action)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: 'action must be "Accept" or "Reject".' });
    }

    /* ── 2. Responder — from token, no DB ────────────────────────────────── */
    const { id: responderId, groupId: responderGroupId, department: responderDeptId, session: sessionId } = req.student;

    /* ── 3. Parallel fetch: invite + responder dept config ───────────────── */
    const invite = await GroupInvite.findOne({ _id: inviteId, receiver: responderId, status: "pending" })
        .session(dbSession);

    const responderDept = await Department.findById(responderDeptId)
        .select("department btpConfig")
        .lean()
        .session(dbSession);

    if (!invite) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Pending invite not found." });
    }

    if (!responderDept?.btpConfig) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Your department configuration was not found." });
    }

    const { btpConfig: responderBtpConfig, department: deptName } = responderDept;

    /* ── 4. Already in a group — auto-reject ──────────────────────────────── */
    if (responderGroupId) {
      await rejectInvite(invite, "Receiver has already joined another group.", dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: "Invite rejected automatically as you are already part of a group." });
    }

    /* ── 5. Deadline check — auto-reject if passed ────────────────────────── */
    if (new Date() > new Date(responderBtpConfig.lockRecordDeadline)) {
      await rejectInvite(invite, `Deadline for department "${deptName}" has passed.`, dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: true, message: "Invite rejected as your department's deadline has passed." });
    }

    /* ── 6. Explicit reject ───────────────────────────────────────────────── */
    if (action === "Reject") {
      await rejectInvite(invite, "Rejected by receiver.", dbSession);
      await dbSession.commitTransaction();
      await notifyGroup(invite.groupId,req.user.id,`Group invitation was ${invite?.status}. Check details in invite page.`);
      return res.status(200).json({ success: true, message: "Invite rejected." });
    }

    /* ── 7. Accept path — fetch group ─────────────────────────────────────── */
    const group = await Group.findById(invite.groupId)
      .select("_id departments status")
      .session(dbSession);

    if (!group || group.status !== "Draft") {
      await rejectInvite(invite, "Group no longer exists or is not available to join.", dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: false, message: "Group not found or unavailable. Invite has been rejected." });
    }

    const responderDeptStr = responderDeptId.toString();
    const isInGroupDepts   = group.departments.map((d) => d.toString()).includes(responderDeptStr);

    /* ── 8. Slot check (shared by both dept paths) ────────────────────────── */
    const { actualSlots, memberCount, pendingCount } = await getActualSlots(
      group._id,
      responderBtpConfig.maxStudentsPerGroup,
      dbSession
    );

    /* ── 9. Same department ───────────────────────────────────────────────── */
    if (isInGroupDepts) {
      // +1 because this invite itself is counted in pendingCount
      if (actualSlots + 1 <= 0) {
        await rejectInvite(
          invite,
          `Group is full. Members: ${memberCount}, pending: ${pendingCount}, max: ${responderBtpConfig.maxStudentsPerGroup}.`,
          dbSession
        );
        await dbSession.commitTransaction();
        return res.status(200).json({ success: false, message: "Invite rejected. Group has no available slots per your department's policy." });
      }

      invite.status    = "accepted";
      invite.expiresAt = null;
      await invite.save({ session: dbSession });

      await Student.updateOne(
        { _id: responderId },
        { $set: { groupId: group._id } },
        { session: dbSession }
      );

      await dbSession.commitTransaction();
      await notifyGroup(group._id,req.user.id,`Group invitation was ${invite?.status}`);
      await refreshAuthCookie(res,req);
      return res.status(200).json({ success: true, message: "Invite accepted. You have joined the group." });
    }

    /* ── 10. Cross-department ─────────────────────────────────────────────── */
    if (!responderBtpConfig.crossDepartmentRules?.isAllowed) {
      await rejectInvite(invite, `Cross-department collaboration is not permitted for "${deptName}".`, dbSession);
      await dbSession.commitTransaction();
      return res.status(200).json({ success: false, message: `Invite rejected. Your department "${deptName}" does not allow cross-department groups.` });
    }

    if (actualSlots <= 0) {
      await rejectInvite(
        invite,
        `"${deptName}" allows max ${responderBtpConfig.maxStudentsPerGroup} students. Members: ${memberCount}, pending: ${pendingCount}.`,
        dbSession
      );
      await dbSession.commitTransaction();
      return res.status(200).json({ success: false, message: `Invite rejected. All slots are occupied per "${deptName}" policy.` });
    }

    /* ── 11. Accept — also register responder's dept in group ─────────────── */
    invite.status    = "accepted";
    invite.expiresAt = null;
    await invite.save({ session: dbSession });

    await Student.updateOne({ _id: responderId }, { $set: { groupId: group._id } }, { session: dbSession });

    await Group.updateOne({ _id: group._id }, { $addToSet: { departments: responderDeptId } }, { session: dbSession });
    await dbSession.commitTransaction();
    await notifyGroup(group._id,req.user.id,`Group invitation was ${invite?.status}.`);
    await refreshAuthCookie(res,req);
    return res.status(200).json({ success: true, message: "Invite accepted. You have joined the group." });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};


/* ===============================================================
   WITHDRAW INVITE
=============================================================== */
/**
 * @desc    Withdraw a pending invite sent from the student's group
 * @route   DELETE /api/student/group/withdraw-invite/:inviteId
 * @access  Private (attachStudentProfile middleware required)
 */
export const withDrawInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return res.status(400).json({ success: false, message: "Invalid invite ID." });
    }

    // groupId is on req.student from the token — no DB fetch needed
    const { groupId } = req.student;

    if (!groupId) {
      return res.status(403).json({ success: false, message: "You are not part of any group." });
    }

    const invite = await GroupInvite.findOneAndDelete({
      _id:     inviteId,
      groupId: groupId,
      status:  "pending",
    });

    if (!invite) {
      return res.status(404).json({ success: false, message: "Invite not found or can no longer be withdrawn." });
    }

    return res.status(200).json({ success: true, message: "Invite withdrawn successfully." });

  } catch (error) {
    next(error);
  }
};


/* ===============================================================
   HELPER — Dissolve group, reset members, wipe all invites
=============================================================== */
const dissolveGroup = async (groupId, memberIds, dbSession) => {
    await Student.updateMany({ _id: { $in: memberIds } }, { $set: { groupId: null } }, { session: dbSession });
    await GroupInvite.deleteMany({ groupId }, { session: dbSession });
    await Group.findByIdAndDelete(groupId, { session: dbSession });
};


/* ===============================================================
   REGISTER GROUP
=============================================================== */
/**
 * @desc    Make a group official if it complies with all department BTP policies.
 *          Transitions group status from "Draft" → "Formed".
 * @route   PATCH /api/student/group/register
 * @access  Private (attachStudentProfile middleware required)
 */
export const registerGroup = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    /* ── 1. groupId from token — no DB fetch needed ───────────────────────── */
    const { groupId } = req.student;

    if (!groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You are not part of any group." });
    }

    /* ── 2. Parallel fetch: group + members + dept configs ───────────────── */
    // Group must come first so we know which depts to fetch.
    const group = await Group.findById(groupId)
      .select("departments status")
      .lean()
      .session(dbSession);

    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (group.status !== "Draft") {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: `Group cannot be registered from its current status: "${group.status}".` });
    }

    // members + dept configs have no dependency on each other — parallel
    const members = await Student.find({ groupId: group._id }).select("_id department").lean().session(dbSession);
    
    const deptConfigs = await Department.find({ _id: { $in: group.departments } }).select("department btpConfig").lean().session(dbSession);
    

    const memberIds   = members.map((m) => m._id);
    const memberCount = members.length;
    const isMultiDept = group.departments.length > 1;

    const deptConfigMap = Object.fromEntries(
      deptConfigs.map((d) => [d._id.toString(), d])
    );

    /* ── Helper: dissolve + respond in one step ───────────────────────────── */
    // memberIds is fully resolved here — no reference-before-assignment risk
    const dissolveAndRespond = async (message) => {
      await dissolveGroup(group._id, memberIds, dbSession);
      await dbSession.commitTransaction();
      
      return res.status(400).json({
        success: false,
        dissolved: true,
        message: `${message} Group has been dissolved — please create a new group.`,
      });
    };

    /* ── 3. PATH A — Single department ───────────────────────────────────── */
    if (!isMultiDept) {
      const deptConfig = deptConfigMap[group.departments[0].toString()];

      if (!deptConfig) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "Department configuration not found." });
      }

      const { btpConfig, department: deptName } = deptConfig;

      if (new Date() > new Date(btpConfig.lockRecordDeadline)) {
        return dissolveAndRespond(`Registration deadline for "${deptName}" has passed (${new Date(btpConfig.lockRecordDeadline).toDateString()}).`);
      }

      if (memberCount < btpConfig.minStudentsPerGroup) {
        return dissolveAndRespond(`Group needs at least ${btpConfig.minStudentsPerGroup} student(s) per "${deptName}" policy. Current: ${memberCount}.`);
      }

      if (memberCount > btpConfig.maxStudentsPerGroup) {
        return dissolveAndRespond(`Group exceeds maximum of ${btpConfig.maxStudentsPerGroup} student(s) per "${deptName}" policy. Current: ${memberCount}.`);
      }
    }

    /* ── 4. PATH B — Multiple departments ────────────────────────────────── */
    if (isMultiDept) {
      const membersByDept = members.reduce((acc, m) => {
        const key = m.department.toString();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      for (const deptId of group.departments.map((d) => d.toString())) {
        const deptConfig = deptConfigMap[deptId];

        if (!deptConfig) {
          await dbSession.abortTransaction();
          return res.status(404).json({ success: false, message: "Configuration not found for one of the group's departments." });
        }

        const { btpConfig, department: deptName } = deptConfig;
        const deptMemberCount = membersByDept[deptId] ?? 0;

        if (new Date() > new Date(btpConfig.lockRecordDeadline)) {
          return await dissolveAndRespond(`Registration deadline for "${deptName}" has passed (${new Date(btpConfig.lockRecordDeadline).toDateString()}).`);
        }

        if (!btpConfig.crossDepartmentRules?.isAllowed) {
          return await dissolveAndRespond(`"${deptName}" does not permit cross-department groups.`);
        }

        if (deptMemberCount < btpConfig.crossDepartmentRules.minSameDepartmentStudents) {
          return await dissolveAndRespond(`"${deptName}" requires at least ${btpConfig.crossDepartmentRules.minSameDepartmentStudents} of its own student(s) in the group. Found: ${deptMemberCount}.`);
        }

        if (memberCount < btpConfig.minStudentsPerGroup) {
          return await dissolveAndRespond(`Group does not meet minimum size of ${btpConfig.minStudentsPerGroup} required by "${deptName}". Current: ${memberCount}.`);
        }

        if (memberCount > btpConfig.maxStudentsPerGroup) {
          return await dissolveAndRespond(`Group exceeds maximum size of ${btpConfig.maxStudentsPerGroup} allowed by "${deptName}". Current: ${memberCount}.`);
        }
      }
    }

    /* ── 5. All checks passed → Formed + clear pending invites ───────────── */

    await Group.updateOne({ _id: group._id }, { $set: { status: "Formed" } }, { session: dbSession });
    await GroupInvite.deleteMany({ groupId: group._id, status: "pending" }, { session: dbSession });

    await dbSession.commitTransaction();
    
    await notifyGroup(group._id,req.user.id,"Your group has been finalized for the BTP process.");
    return res.status(200).json({ success: true, message: "Group registered successfully." });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};



