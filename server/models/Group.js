import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    departmentConfigs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DepartmentConfig',
        required: true,
      },
    ],

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
groupSchema.index({ departmentConfig: 1, session: 1 });

export default mongoose.model('Group', groupSchema);