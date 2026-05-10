import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
      },
    ],

    programType: {
      type: String,
      enum: ["UG", "PG"],
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },

    supervisors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
      },
    ],

    status: {
      type: String,
      enum: ["Draft","Formed","SupervisorRequested", "Active", "Closed"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

groupSchema.index({ name: 1, session: 1 }, { unique: true });
groupSchema.index({ departments: 1, session: 1 });

export default mongoose.model('Group', groupSchema);