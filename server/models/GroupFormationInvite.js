import mongoose from "mongoose";

/* ── member sub-schema ───────────────────────── */

const memberInviteSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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
  },
  { _id: false }
);

/* ── main schema ───────────────────────── */

const groupFormationSchema = new mongoose.Schema(
  {
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    groupName: {
      type: String,
      required: true,
      trim: true,
    },

    memberInvites: {
      type: [memberInviteSchema],
      required: true,
    },

    finalGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PendingMemberApproval",
        "Approved",   // All members accepted → Group created
        "Rejected",
      ],
      default: "PendingMemberApproval",
    },

    // Stores a human-readable label, e.g. "Initiator" or "Member: CS21B001"
    rejectedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/* ── indexes ───────────────────────── */

groupFormationSchema.index({ initiator: 1, status: 1 });
groupFormationSchema.index({ "memberInvites.student": 1, status: 1 });

/* ── virtual ───────────────────────── */

groupFormationSchema.virtual("allMembersAccepted").get(function () {
  return this.memberInvites.every((m) => m.status === "Accepted");
});

export default mongoose.model("GroupFormation", groupFormationSchema);