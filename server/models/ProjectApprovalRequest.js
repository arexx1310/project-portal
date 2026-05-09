import mongoose from "mongoose";

/* ── supervisor sub-schema ───────────────────────── */

const supervisorInviteSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

/* ── main schema ───────────────────────── */

const projectApprovalRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    project: {
      title: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      domain: {
        type: String,
        trim: true,
      },
      semester: {
        type: Number,
        enum: [7,8,1,2,3,4],
        
      },
    },

    supervisorInvites: {
      type: [supervisorInviteSchema],
      required: true,
    },

    finalProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PendingSupervisorApproval",
        "Approved",   // All supervisors accepted → Project created
        "Rejected",
      ],
      default: "PendingSupervisorApproval",
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

/* ── indexes ───────────────────────── */

projectApprovalRequestSchema.index({ group: 1, status: 1 });
projectApprovalRequestSchema.index({ "supervisorInvites.faculty": 1, status: 1 });

projectApprovalRequestSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }  // delete exactly at the expiresAt time
);

/* ── virtual ───────────────────────── */

projectApprovalRequestSchema.virtual("allSupervisorsAccepted").get(function () {
  return this.supervisorInvites.every((s) => s.status === "Accepted");
});

export default mongoose.model(
  "ProjectApprovalRequest",
  projectApprovalRequestSchema
);
