import cron from "node-cron";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Group from "../../models/Group.js";
import { sendNotification } from "../notificationController.js";

const DAYS_BEFORE = 4;

const isWithinDays = (deadline, days) => {
  const now = new Date();
  const target = new Date(deadline);
  const diffMs = target - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
};

// ================= Semester Transition =================
const checkSemesterTransition = async () => {
  try {
    
    const activeSession = await Session.getActiveSession();
    if (!activeSession) return;
    
    const now = new Date();

    // Odd sem (7) just ended, even sem (8) starting
    const oddEnded = now > new Date(activeSession.oddSemester.endDate);
    const evenStarted = now >= new Date(activeSession.evenSemester.startDate);

    // Even sem (8) just ended
    const evenEnded = now > new Date(activeSession.evenSemester.endDate);

    if (oddEnded && evenStarted && !evenEnded) {
      // Transition sem 7 → sem 8
      const result = await Student.updateMany(
        {
          session: activeSession._id,
          semester: 7,
        },
        { $set: { semester: 8 } }
      );

      if (result.modifiedCount > 0) {
        // Notify all affected students
        const students = await Student.find({
          session: activeSession._id,
          semester: 8,
        })
          .populate("user", "_id role")
          .lean();

        await sendNotification({
          type: "SEM8_BTP_PHASE2_BEGIN",
          message: `Semester 8 has begun. You can now submit your Phase 2 project proposal.`,
          refId: activeSession._id,
          refModel: "Session",
          triggeredBy: null,
        }, students.map(s => ({ _id: s.user._id, role: s.user.role })));

        console.log(`[CRON] Transitioned ${result.modifiedCount} students to semester 8.`);
      }

    } else if (evenEnded) {
      // BTP year complete — close all active groups
      const result = await Group.updateMany(
        { session: activeSession._id, status: "Active" },
        { $set: { status: "Closed" } }
      );

      console.log(`[CRON] Closed ${result.modifiedCount} groups for completed session.`);
    }

  } catch (err) {
    console.error("[CRON] checkSemesterTransition error:", err.message);
  }
};

// ================= Group Creation Deadline =================
const checkGroupCreationDeadline = async () => {
  try {
    const configs = await DepartmentConfig.find({
      "btpConfig.isActive": true,
      "btpConfig.groupCreationDeadline": { $exists: true },
    }).lean();

    for (const config of configs) {
      if (!isWithinDays(config.btpConfig.groupCreationDeadline, DAYS_BEFORE)) continue;

      // Only notify students who still don't have a group
      const students = await Student.find({
        departmentConfig: config._id,
        groupId: null,
        semester: { $in: [7, 8] },
      })
        .populate("user", "_id role")
        .lean();

      if (students.length === 0) continue;

      const daysLeft = Math.ceil(
        (new Date(config.btpConfig.groupCreationDeadline) - new Date()) / (1000 * 60 * 60 * 24)
      );

      await sendNotification({
        type: "DEADLINE_REMINDER_GROUP_FORMATION",
        message: `Reminder: Group formation deadline for ${config.department} is in ${daysLeft} day(s). You have not joined a group yet.`,
        refId: config._id,
        refModel: "DepartmentConfig",
        triggeredBy: null,
      }, students.map(s => ({ _id: s.user._id, role: s.user.role })));

      console.log(`[CRON] Group formation reminder sent to ${students.length} students in ${config.department}`);
    }
  } catch (err) {
    console.error("[CRON] checkGroupCreationDeadline error:", err.message);
  }
};

// ================= Supervisor Selection Deadline =================
const checkSupervisorSelectionDeadline = async () => {
  try {
    const configs = await DepartmentConfig.find({
      "btpConfig.isActive": true,
      "btpConfig.supervisorSelectionDeadline": { $exists: true },
    }).lean();

    for (const config of configs) {
      if (!isWithinDays(config.btpConfig.supervisorSelectionDeadline, DAYS_BEFORE)) continue;

      // Only notify students in groups that still don't have a supervisor (status: Formed)
      const students = await Student.find({
        departmentConfig: config._id,
        groupId: { $ne: null },
        semester: { $in: [7, 8] },
      })
        .populate("user", "_id role")
        .populate({
          path: "groupId",
          match: { status: "Formed" },
          select: "_id status",
        })
        .lean();

      // Filter out students whose group didn't match (populate returns null if no match)
      const eligible = students.filter(s => s.groupId !== null);
      if (eligible.length === 0) continue;

      const daysLeft = Math.ceil(
        (new Date(config.btpConfig.supervisorSelectionDeadline) - new Date()) / (1000 * 60 * 60 * 24)
      );

      await sendNotification({
        type: "DEADLINE_REMINDER_SUPERVISOR_SELECTION",
        message: `Reminder: Supervisor selection deadline for ${config.department} is in ${daysLeft} day(s). Your group has not selected a supervisor yet.`,
        refId: config._id,
        refModel: "DepartmentConfig",
        triggeredBy: null,
      }, eligible.map(s => ({ _id: s.user._id, role: s.user.role })));

      console.log(`[CRON] Supervisor selection reminder sent to ${eligible.length} students in ${config.department}`);
    }
  } catch (err) {
    console.error("[CRON] checkSupervisorSelectionDeadline error:", err.message);
  }
};

// ================= Project Proposal Deadline =================
const checkProjectProposalDeadline = async () => {
  try {
    const configs = await DepartmentConfig.find({
      "btpConfig.isActive": true,
      "btpConfig.projectProposalDeadline": { $exists: true },
    }).lean();

    for (const config of configs) {
      if (!isWithinDays(config.btpConfig.projectProposalDeadline, DAYS_BEFORE)) continue;

      // Notify students in active groups that haven't submitted a proposal
      const students = await Student.find({
        departmentConfig: config._id,
        groupId: { $ne: null },
        semester: { $in: [7, 8] },
      })
        .populate("user", "_id role")
        .populate({
          path: "groupId",
          match: { status: "Active" },
          select: "_id status",
        })
        .lean();

      const eligible = students.filter(s => s.groupId !== null);
      if (eligible.length === 0) continue;

      const daysLeft = Math.ceil(
        (new Date(config.btpConfig.projectProposalDeadline) - new Date()) / (1000 * 60 * 60 * 24)
      );

      await sendNotification({
        type: "DEADLINE_REMINDER_PROJECT_PROPOSAL",
        message: `Reminder: Project proposal deadline for ${config.department} is in ${daysLeft} day(s). Submit your proposal before it expires.`,
        refId: config._id,
        refModel: "DepartmentConfig",
        triggeredBy: null,
      }, eligible.map(s => ({ _id: s.user._id, role: s.user.role })));

      console.log(`[CRON] Project proposal reminder sent to ${eligible.length} students in ${config.department}`);
    }
  } catch (err) {
    console.error("[CRON] checkProjectProposalDeadline error:", err.message);
  }
};


// ================= Register all cron jobs =================
export const registerDeadlineCrons = () => {
  // Runs every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running deadline checks...");
    await Promise.all([
      checkGroupCreationDeadline(),
      checkSupervisorSelectionDeadline(),
      checkProjectProposalDeadline(),
    ]);
  });

  // Semester transition — every day at midnight
     cron.schedule("0 0 * * *", async () => {
     console.log("[CRON] Running semester transition check...");
     await checkSemesterTransition();
    });

  console.log("[CRON] All cron jobs registered.");

};