import mongoose from "mongoose";

/* ── remark/timeline entry sub-schema ───────────────────────── */
// A chronological log — "we submitted to ICSE", "reviews came back negative",
// "revised and resubmitted", etc. Anyone on the group or a supervisor can add one.

const remarkEntrySchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ── main schema ───────────────────────── */

const publicationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    // Optionally link to the approved project this paper comes from
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    abstract: {
      type: String,
      trim: true,
      default: null,
    },

    // Free-form author strings so external collaborators can be included too
    // e.g. ["Alice (CS21B001)", "Dr. Sharma", "Bob (External)"]
    authors: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    // Where in the publishing lifecycle the paper currently is
    status: {
      type: String,
      enum: [
        "Idea",           // Just a topic, nothing written
        "Writing",        // Actively drafting the paper
        "InternalReview", // Being reviewed by supervisor before submission
        "Submitted",      // Submitted to a conference / journal
        "UnderReview",    // Peer review in progress
        "Accepted",       // Acceptance received, not yet presented / published
        "Rejected",       // Rejected; may be revised and resubmitted
        "Presented",      // Presented at conference
        "Published",      // DOI assigned, fully public
        "Withdrawn",      // Authors withdrew the paper
      ],
      default: "Idea",
    },

    // Conference / venue details — fill in as they become known
    conference: {

      name: {
        type: String,
        trim: true,
        default: null,
      },

      submissionDate: {
        type: Date,
        default: null,
      },

      // Date the authors were told about acceptance / rejection
      notificationDate: {
        type: Date,
        default: null,
      },
      
      presentationDate: {
        type: Date,
        default: null,
      },
    },

    // Filled in only after the paper is published
    published: {
      doi: {
        type: String,
        trim: true,
        default: null,
      },

      link: {
        type: String,
        trim: true,
        default: null,
      },

      publishedDate: {
        type: Date,
        default: null,
      },

      venue: {
        type: String,
        trim: true,
        default: null,
      },

      publisher: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // The running log — add an entry every time something meaningful happens.
    // This is the field that tells the story: idea → outline → full draft →
    // submitted → reviews received → revised → accepted → camera-ready → published.
    remarks: {
      type: [remarkEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* ── indexes ───────────────────────── */

// All publications for a group (most common query)
publicationSchema.index({ group: 1, session: 1 });

// Filter by status across the whole department
publicationSchema.index({ status: 1 });

// Link from an approved project
publicationSchema.index({ project: 1 });

export default mongoose.model("Publication", publicationSchema);