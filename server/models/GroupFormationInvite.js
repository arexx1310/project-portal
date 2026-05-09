import mongoose from "mongoose";

const groupInviteSchema = new mongoose.Schema(
  {
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

groupInviteSchema.index({ groupId: 1 });
groupInviteSchema.index({ receiver: 1 });

// TTL index (only works if expiresAt is set)
groupInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("GroupInvite", groupInviteSchema);