// models/Project.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    
    domain: {
      type: String,
      required: true,
    },

    semester: {
      type: Number,
      enum: [7, 8],
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },

    status: {
      type: String,
      enum: ['Proposed', 'Approved', 'In Progress', 'Completed'],
      default: 'Proposed',
    },
  },
  { timestamps: true }
);

/**
 * Guarantees:
 * - One project per group per semester
 */
projectSchema.index(
  { group: 1, semester: 1, session: 1 },
  { unique: true }
);


export default mongoose.model('Project', projectSchema);
