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

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    specialization: {
      type: String,
      default: null,
      trim: true,
    },

    programType: {
      type: String,
      enum: ["UG", "PG"],
      required: true,
      default: "UG",
    },
    
    semester: {
      type: Number,
      required: true,
      // BTech uses 7|8. MTech semesters 1-4.
      // Remove the enum constraint, add a validator instead:
      validate: {
        validator: function(v) {
          if (this.programType === "UG") return [7, 8].includes(v);
          if (this.programType === "PG") return v >= 1 && v <= 4;
          return false;
        },
        message: "Invalid semester for this program type."
      }
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

  },
  { timestamps: true }
);

/* =====================
   Indexing
===================== */


studentSchema.index({ department: 1, semester: 1 });
studentSchema.index({ department: 1, specialization: 1 });
studentSchema.index({ groupId: 1 });
studentSchema.index({ createdAt: -1 });


export default mongoose.model("Student", studentSchema);