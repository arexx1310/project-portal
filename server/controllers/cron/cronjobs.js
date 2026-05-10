import cron from "node-cron";
import mongoose from "mongoose";
import Department from "../../models/DepartmentConfig.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Group from "../../models/Group.js";
import GroupInvite from "../../models/GroupFormationInvite.js";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import WorkItem from "../../models/WorkItem.js";
import { notifyDepartment, notifyUser } from "../notificationController.js";

/* ══════════════════════════════════════════════════════════════════
   HELPER — months from now
   ══════════════════════════════════════════════════════════════════ */
const monthsFromNow = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
};

/* ══════════════════════════════════════════════════════════════════
   JOB 1 — SEMESTER TRANSITION
   Runs daily at 00:05.
   When today >= evenSemester.startDate and the active session has
   UG students still on semester 7, bump them to semester 8.
   Same logic for PG: odd → even (1→2, 3→4).
   ══════════════════════════════════════════════════════════════════ */
const semesterTransitionJob = cron.schedule("5 0 * * *", async () => {
  try {
    const session = await Session.getActiveSession();
    if (!session) return;

    const today = new Date();
    const evenStart = new Date(session.evenSemester.startDate);

    // Only act on the day even semester starts (same calendar day)
    if (
      today.getFullYear() !== evenStart.getFullYear() ||
      today.getMonth()    !== evenStart.getMonth()    ||
      today.getDate()     !== evenStart.getDate()
    ) return;

    // UG: 7 → 8
    const ugResult = await Student.updateMany(
      { session: session._id, programType: "UG", semester: 7 },
      { $set: { semester: 8 } }
    );

    // PG: 1 → 2, 3 → 4
    const pg1Result = await Student.updateMany(
      { session: session._id, programType: "PG", semester: 1 },
      { $set: { semester: 2 } }
    );
    const pg3Result = await Student.updateMany(
      { session: session._id, programType: "PG", semester: 3 },
      { $set: { semester: 4 } }
    );

    console.log(
      `[semesterTransition] UG: ${ugResult.modifiedCount} | PG 1→2: ${pg1Result.modifiedCount} | PG 3→4: ${pg3Result.modifiedCount}`
    );
  } catch (err) {
    console.error("[semesterTransitionJob]", err.message);
  }
}, { scheduled: false });


/* ══════════════════════════════════════════════════════════════════
   JOB 2 — DEADLINE REMINDER  (4 days before lockRecordDeadline)
   Runs daily at 08:00.
   Checks every department's btpConfig and mtpConfig lockRecordDeadline.
   If deadline is exactly 4 days away, notify all students of that dept.
   ══════════════════════════════════════════════════════════════════ */
const deadlineReminderJob = cron.schedule("0 8 * * *", async () => {
  try {
    const session = await Session.getActiveSession();
    if (!session) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 4);

    const departments = await Department.find().select("_id department btpConfig.lockRecordDeadline mtpConfig.lockRecordDeadline").lean();

    for (const dept of departments) {
      // ── BTP deadline ──────────────────────────────────────────────
      if (dept.btpConfig?.lockRecordDeadline) {
        const deadline = new Date(dept.btpConfig.lockRecordDeadline);
        deadline.setHours(0, 0, 0, 0);

        if (deadline.getTime() === targetDate.getTime()) {
          const formatted = new Date(dept.btpConfig.lockRecordDeadline).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          });
          await notifyDepartment(
            dept._id,
            null, // system-generated, no triggeredBy
            `Reminder: The BTP group formation & supervisor selection deadline for your department is ${formatted} — only 4 days away.`,
            false // students + faculty
          );
        }
      }

      // ── MTP deadline ──────────────────────────────────────────────
      if (dept.mtpConfig?.lockRecordDeadline) {
        const deadline = new Date(dept.mtpConfig.lockRecordDeadline);
        deadline.setHours(0, 0, 0, 0);

        if (deadline.getTime() === targetDate.getTime()) {
          const formatted = new Date(dept.mtpConfig.lockRecordDeadline).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          });
          await notifyDepartment(
            dept._id,
            null,
            `Reminder: The M.Tech supervisor selection deadline for your department is ${formatted} — only 4 days away.`,
            false
          );
        }
      }
    }
  } catch (err) {
    console.error("[deadlineReminderJob]", err.message);
  }
}, { scheduled: false });


/* ══════════════════════════════════════════════════════════════════
   JOB 3 — SESSION END CLEANUP
   Runs daily at 01:00.
   On the day evenSemester.endDate passes:
     • All groups of that session → status "Closed"
     • Pending GroupInvites of those groups → expiresAt = now + 3 months
     • Pending ProjectApprovalRequests of those groups → expiresAt = now + 3 months
     • WorkItems of projects in those groups → expiresAt = now + 3 months
   ══════════════════════════════════════════════════════════════════ */
const sessionEndCleanupJob = cron.schedule("0 1 * * *", async () => {
  try {
    const session = await Session.getActiveSession();
    if (!session) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const evenEnd = new Date(session.evenSemester.endDate);
    evenEnd.setHours(0, 0, 0, 0);

    if (today.getTime() !== evenEnd.getTime()) return;

    const expiry = monthsFromNow(3);

    // ── 1. Find all groups for this session ───────────────────────
    const groups = await Group.find({ session: session._id }).select("_id").lean();
    const groupIds = groups.map((g) => g._id);

    if (!groupIds.length) {
      console.log("[sessionEndCleanup] No groups found for session, skipping.");
      return;
    }

    // ── 2. Close all groups ───────────────────────────────────────
    await Group.updateMany(
      { _id: { $in: groupIds } },
      { $set: { status: "Closed" } }
    );

    // ── 3. Expire pending group invites ───────────────────────────
    await GroupInvite.updateMany(
      { groupId: { $in: groupIds } },
      { $set: { expiresAt: expiry } }
    );

    // ── 4. Expire pending project approval requests ───────────────
    await ProjectApprovalRequest.updateMany(
      { group: { $in: groupIds }},
      { $set: { expiresAt: expiry } }
    );

    // ── 5. Expire work items linked to projects of these groups ───
    // WorkItem references Project, not Group directly — go via Project
    
    const Project = mongoose.model("Project");
    const projects = await Project.find({ group: { $in: groupIds } }).select("_id").lean();
    const projectIds = projects.map((p) => p._id);

    if (projectIds.length) {
      await WorkItem.updateMany(
        { project: { $in: projectIds } },
        { $set: { expiresAt: expiry } }
      );
    }

    console.log(
      `[sessionEndCleanup] Session "${session.name}" closed. Groups: ${groupIds.length}, projects: ${projectIds.length}`
    );
  } catch (err) {
    console.error("[sessionEndCleanupJob]", err.message);
  }
}, { scheduled: false });


/* ══════════════════════════════════════════════════════════════════
   INIT — call this once at server startup
   ══════════════════════════════════════════════════════════════════ */
export const initCronJobs = () => {
  semesterTransitionJob.start();
  deadlineReminderJob.start();
  sessionEndCleanupJob.start();
  console.log("[cron] All jobs scheduled.");
};