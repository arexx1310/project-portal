import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    admissionYear: {
      type: Number,
      required: true,
      min: 2000,
      max: new Date().getFullYear(),
    },

    departmentConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentConfig",
      required: true,
    },

    specialization: {
      type: String,
      default: null,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
      enum: [7, 8],
      default: 7,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    isAvailableForInvite: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =====================
   Indexing
===================== */

studentSchema.index({ departmentConfig: 1, semester: 1 });
studentSchema.index({ departmentConfig: 1, specialization: 1 });
studentSchema.index({ groupId: 1 });
studentSchema.index({ createdAt: -1 });


export default mongoose.model("Student", studentSchema);