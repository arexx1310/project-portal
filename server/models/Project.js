// models/Project.js
import mongoose from 'mongoose';

const projectDocumentSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    fileId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

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
      enum: [1, 2, 3, 4, 7, 8],
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

    documents: {
      type: [projectDocumentSchema],
      default: [],
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