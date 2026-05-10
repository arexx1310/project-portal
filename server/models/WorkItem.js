import mongoose from "mongoose";

/* ── feedback sub-schema ───────────────────────── */

const feedbackSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    givenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ── link sub-schema ───────────────────────── */

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "" },
    url:   { type: String, trim: true, required: true },
  },
  { _id: false }
);

/* ── submission sub-schema (for tasks) ───────────────────────── */

const submissionSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true },
    links: {
      type: [linkSchema],
      default: [],
    },
    submittedAt: Date,
  },
  { _id: false }
);

/* ── main schema ───────────────────────── */

const workItemSchema = new mongoose.Schema(
  {
    /* ── common fields ───────────────────────── */

    type: {
      type: String,
      enum: ["WeeklyUpdate", "Task"],
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    /* ── weekly update specific ───────────────────────── */

    weekNumber: {
      type: Number,
      min: 1,
      required: function () {
        return this.type === "WeeklyUpdate";
      },
    },

    updateText: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "WeeklyUpdate";
      },
    },

    links: {
      type: [linkSchema],
      default: [],
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: function () {
        return this.type === "WeeklyUpdate";
      },
    },

    /* ── task specific ───────────────────────── */

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: function () {
        return this.type === "Task";
      },
    },

    title: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "Task";
      },
    },

    description: {
      type: String,
      trim: true,
    },

    dueDate: {
      type: Date,
    },

    submission: {
      type: submissionSchema,
      default: null,
    },

    /* ── shared workflow ───────────────────────── */

    feedbacks: {
      type: [feedbackSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Pending", "Submitted", "Reviewed", "Completed"],
      default: function () {
        return this.type === "Task" ? "Pending" : "Submitted";
      },
    },

    // Set to 3 months after session end — Mongo auto-deletes at this time
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* ── indexes ───────────────────────── */

// Unique weekly update per project per week
workItemSchema.index(
  { project: 1, weekNumber: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "WeeklyUpdate" },
  }
);

// Fast project timeline queries (all work items of a project)
workItemSchema.index({ project: 1, createdAt: 1 });

// Faculty review dashboard (pending/reviewed items per faculty)
workItemSchema.index({ status: 1, "feedbacks.faculty": 1 });

// Tasks due tracking (for reminders / overdue tasks)
workItemSchema.index({ dueDate: 1, status: 1 });

// TTL — auto-delete 3 months after session ends (only fires when expiresAt is set)
workItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("WorkItem", workItemSchema);