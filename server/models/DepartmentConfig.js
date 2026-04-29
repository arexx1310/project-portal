import mongoose from "mongoose";

// Sub-schema for BTP settings
const btpConfigSchema = new mongoose.Schema(
  {
    minStudentsPerGroup: {
      type: Number,
      required: true,
      min: 1,
    },

    maxStudentsPerGroup: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v >= this.minStudentsPerGroup;
        },
        message: "Max students must be >= min students",
      },
    },

    minSupervisors: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxSupervisors: {
      type: Number,
      required: true,
      min: 1,
    },

    crossDepartmentRules: {
        isAllowed: {
          type: Boolean,
          default: true,
        },
        minSameDepartmentStudents: {
          type: Number,
          default: 2,
          min: 1,
        },
    },
  
    maxGroupsPerSupervisor: {
      type: Number,
      required: true,
      min: 1,
    },
    
    groupCreationDeadline: {
      type: Date,
      required: true,
    },

    supervisorSelectionDeadline: {
      type: Date,
      required: true,
    },

    projectProposalDeadline: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const departmentConfigSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
      unique: true,   
      index: true,
    },

    specializations: [
      {
        type: String,
        trim: true,
      },
    ],

    btpConfig: {
      type: btpConfigSchema,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('DepartmentConfig',departmentConfigSchema);

