import mongoose from "mongoose";

const notificationEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        // Session
        "ROLE_ASSIGNED",
        "SESSION_CREATED",
        "SESSION_ACTIVATED",

        // Department Config
        "BTP_CONFIG_SET",
        "BTP_CONFIG_UPDATED",

        // Group Formation
        "GROUP_INVITE_RECEIVED",       // invitee gets this
        "GROUP_INVITE_ACCEPTED",       // initiator gets this
        "GROUP_INVITE_REJECTED",       // initiator gets this
        "GROUP_FORMED",                // all members get this

        // Project Proposal
        "PROJECT_PROPOSAL_SENT",       // supervisor gets this
        "PROJECT_PROPOSAL_ACCEPTED",   // all group members get this
        "PROJECT_PROPOSAL_REJECTED",   // all group members get this
        "PROJECT_PROPOSAL_WITHDRAWN",  // supervisor gets this

        // Deadlines (cron fired)
        "DEADLINE_REMINDER_GROUP_FORMATION",
        "DEADLINE_REMINDER_SUPERVISOR_SELECTION",
        "DEADLINE_REMINDER_PROJECT_PROPOSAL",

        // Semester transition (cron fired)
        "SEM8_BTP_PHASE2_BEGIN",

        // Account
        "ACCOUNT_CREATED",
      ],
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // What triggered this — so frontend can deep-link
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    refModel: {
      type: String,
      enum: [
        "Faculty",
        "Session",
        "Department",
        "GroupFormation",
        "Group",
        "ProjectApprovalRequest",
        "Project",
        "User",
        null,
      ],
      default: null,
    },

    // Who created this event (null for system/cron)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────── */

const userNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Role snapshot at time of notification
    recipientRole: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationEvent",
      required: true,
    },
  },
  { timestamps: true }
);

/* ── indexes ── */

// Most common query: get all notifications for a user, unread first
userNotificationSchema.index({ recipient: 1, createdAt: -1 });

// For marking all read for a user
userNotificationSchema.index({ recipient: 1, event: 1 }, { unique: true });

export const NotificationEvent = mongoose.model(
  "NotificationEvent",
  notificationEventSchema
);

export const UserNotification = mongoose.model(
  "UserNotification",
  userNotificationSchema
);