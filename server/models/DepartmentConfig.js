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
    
    lockRecordDeadline: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

/* ─────────────────────────────────────────────────────────────
   MTP CONFIG  (PG — MTech)
   MTech dissertations are individual: one student, 1-N supervisors.
   No group-size rules needed — only supervisor and cross-dept rules.
───────────────────────────────────────────────────────────── */
const mtpConfigSchema = new mongoose.Schema(
  {
    /**
     * How many supervisors a PG student may invite in total.
     * Co-supervision is common (e.g. 2), but departments set their own cap.
     */
    maxSupervisors: {
      type: Number,
      required: true,
      min: 1,
    },
 
    /**
     * How many active MTP groups (i.e. PG students) a supervisor
     * may be assigned to concurrently in a session.
     */
    maxStudentsPerSupervisor: {
      type: Number,
      required: true,
      min: 1,
    },

      /** If false, the student may only invite faculty from their own department. */
    crossDeptisAllowed: {
        type: Boolean,
        default: true,
    },
 
    lockRecordDeadline: {
      type: Date,
      required: true,
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

    mtpConfig: {
      type: mtpConfigSchema,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Department',departmentConfigSchema);

