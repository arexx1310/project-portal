import mongoose from "mongoose";

import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Group from "../../models/Group.js";
import Faculty from "../../models/Faculty.js";
import Publication from "../../models/Publication.js";
import Project from "../../models/Project.js";


import { sendNotification } from "../notificationController.js";



/* ─────────────────────────────────────────────────────────────
   HELPER — fetch and validate that the requesting student
   belongs to the group that owns a given project / publication
───────────────────────────────────────────────────────────── */
 
/**
 * Returns { groupId } if the student has a group, or sends a 4xx response.
 * We pull groupId here because attachStudentProfile only selects
 * `session` and `departmentConfig` for performance.
 */
const resolveStudentGroup = async (studentId, res) => {
  const student = await Student.findById(studentId).select("groupId").lean();
 
  if (!student) {
    res.status(404).json({ success: false, message: "Student not found" });
    return null;
  }
 
  if (!student.groupId) {
    res.status(400).json({
      success: false,
      message: "You are not registered yet",
    });
    return null;
  }
 
  return student.groupId;
};
 
/* ─────────────────────────────────────────────────────────────
   ALLOWED STATUS TRANSITIONS
   Prevents random jumps like Idea → Published in one step.
───────────────────────────────────────────────────────────── */
const ALLOWED_TRANSITIONS = {
  Idea:           ["Writing"],
  Writing:        ["InternalReview", "Idea"],
  InternalReview: ["Submitted", "Writing"],
  Submitted:      ["UnderReview", "Withdrawn"],
  UnderReview:    ["Accepted", "Rejected"],
  Accepted:       ["Presented", "Published"],
  Rejected:       ["Writing", "Withdrawn"],
  Presented:      ["Published"],
  Published:      [],   // terminal
  Withdrawn:      [],   // terminal
};
 
/* ─────────────────────────────────────────────────────────────
   1. CREATE PUBLICATION
───────────────────────────────────────────────────────────── */
 
/**
 * @desc    Create an initial (default) publication record for a project
 * @route   POST /api/student/publications
 * @access  Student (must be in the project's group)
 */
export const createPublication = async (req, res, next) => {
  try {

    if(!req.student || !req.student.id) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized: Student profile not attached",
          });
        }

    const { projectId }  = req.params;

  
 
    // — Validate projectId —
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }
 
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }
 
    // — Confirm student belongs to a group —
    const groupId = await resolveStudentGroup(req.student.id, res);
    if (!groupId) return; // response already sent
  
    // — Confirm the project exists and belongs to this student's group —
    const project = await Project.findById(projectId)
      .select("title group session status")
      .lean();
    
  
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
 
    if (project.group.toString() !== groupId.toString()) {
      return res.status(403).json({
        success: false,
        message: "This project does not belong to you.",
      });
    }
 
    // — Guard: only allow publications for approved / active projects —
    if (!["Approved", "In Progress", "Completed"].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: "Publications can only be created for approved projects",
      });
    }
 
    // — Create default publication record —
    // Title is seeded from the project; everything else starts blank / default.
    const publication = await Publication.create({
      group:   groupId,
      project: project._id,
      session: project.session,
      title:   project.title,   // pre-filled from the project
      status:  "Idea",
      remarks: [
        {
          note:    `Publication record created for project: "${project.title}"`,
          addedBy: req.user.id,
          date:    new Date(),
        },
      ],
    });
 
    return res.status(201).json({
      success: true,
      message: "Publication record created successfully",
      data: publication,
    });
  } catch (error) {
    next(error);
  }
};
 
/* ─────────────────────────────────────────────────────────────
   2. UPDATE PUBLICATION
───────────────────────────────────────────────────────────── */
 
/**
 * @desc    Update publication details, status, conference / published info,
 *          or append a new remark to the running diary.
 * @route   PATCH /api/student/publications/:publicationId
 * @access  Student (must be in the publication's group)
 * @body    {
 *            title?, abstract?, authors?,
 *            status?,
 *            conference?: { name?, submissionDate?, notificationDate?, presentationDate? },
 *            published?:  { doi?, link?, publishedDate?, venue? },
 *            remark?:     string   ← appends one entry to the remarks diary
 *          }
 */
export const updatePublication = async (req, res, next) => {
  try {
    const { publicationId } = req.params;
 
    // — Validate ID —
    if (!mongoose.Types.ObjectId.isValid(publicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication ID",
      });
    }
 
    // — Confirm student belongs to a group —
    const groupId = await resolveStudentGroup(req.student.id, res);
    if (!groupId) return;
 
    // — Fetch existing publication —
    const publication = await Publication.findById(publicationId);
 
    if (!publication) {
      return res.status(404).json({
        success: false,
        message: "Publication not found",
      });
    }
 
    // — Ownership check —
    if (publication.group.toString() !== groupId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this publication",
      });
    }
 
    // — Terminal state guard —
    if (["Published", "Withdrawn"].includes(publication.status)) {
      return res.status(400).json({
        success: false,
        message: `A publication in "${publication.status}" state cannot be edited`,
      });
    }
 
    const {
      title,
      abstract,
      authors,
      status,
      conference,
      published,
      remark,
    } = req.body;
 
    // — Status transition validation —
    if (status && status !== publication.status) {
      const allowed = ALLOWED_TRANSITIONS[publication.status] ?? [];
 
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from "${publication.status}" to "${status}". Allowed next states: [${allowed.join(", ") || "none"}]`,
        });
      }
 
      publication.status = status;
    }
 
    // — Scalar field updates (only replace if provided) —
    if (title   !== undefined) publication.title    = title.trim();
    if (abstract !== undefined) publication.abstract = abstract.trim();
    if (authors  !== undefined) {
      if (!Array.isArray(authors)) {
        return res.status(400).json({
          success: false,
          message: "authors must be an array of strings",
        });
      }
      publication.authors = authors.map((a) => a.trim()).filter(Boolean);
    }
 
    // — Conference details (merge, not replace) —
    if (conference && typeof conference === "object") {
      const allowedConferenceFields = [
        "name",
        "submissionDate",
        "notificationDate",
        "presentationDate",
      ];
 
      allowedConferenceFields.forEach((field) => {
        if (conference[field] !== undefined) {
          publication.conference[field] = conference[field];
        }
      });
    }
 
    // — Published details (merge, not replace) —
    if (published && typeof published === "object") {
      const allowedPublishedFields = ["doi", "link", "publishedDate", "venue"];
 
      allowedPublishedFields.forEach((field) => {
        if (published[field] !== undefined) {
          publication.published[field] = published[field];
        }
      });
    }
 
    // — Append remark to the running diary —
    if (remark !== undefined) {
      if (typeof remark !== "string" || !remark.trim()) {
        return res.status(400).json({
          success: false,
          message: "remark must be a non-empty string",
        });
      }
 
      publication.remarks.push({
        note:    remark.trim(),
        addedBy: req.user.id,
        date:    new Date(),
      });
    }
 
    // — Guard: nothing was actually changed —
    if (!publication.isModified()) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }
 
    await publication.save({ runValidators: true });
 
    return res.status(200).json({
      success: true,
      message: "Publication updated successfully",
      data: publication,
    });
  } catch (error) {
    next(error);
  }
};
 
/* ─────────────────────────────────────────────────────────────
   3. LIST PUBLICATIONS  (for student's group)
───────────────────────────────────────────────────────────── */
 
/**
 * @desc    List all publication records for the requesting student's group
 * @route   GET /api/student/publications
 * @access  Student
 */
export const listPublications = async (req, res, next) => {
  try {
    // — Confirm student belongs to a group —
    const groupId = await resolveStudentGroup(req.student.id, res);
    if (!groupId) return;
 
    const publications = await Publication.find({
      group:   groupId,
      session: req.student.session,
    })
      .select("title status authors conference.name published.doi createdAt updatedAt")
      .populate("project", "title domain semester")
      .sort({ createdAt: -1 })
      .lean();
 
    return res.status(200).json({
      success: true,
      count: publications.length,
      data: publications,
    });
  } catch (error) {
    next(error);
  }
};
 
/* ─────────────────────────────────────────────────────────────
   4. GET DETAILED PUBLICATION RECORD
───────────────────────────────────────────────────────────── */
 
/**
 * @desc    Get full details of a single publication including remarks diary
 * @route   GET /api/student/publications/:publicationId
 * @access  Student (must be in the publication's group)
 */
export const getPublication = async (req, res, next) => {
  try {
    const { publicationId } = req.params;
 
    // — Validate ID —
    if (!mongoose.Types.ObjectId.isValid(publicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publication ID",
      });
    }
 
    // — Confirm student belongs to a group —
    const groupId = await resolveStudentGroup(req.student.id, res);
    if (!groupId) return;
 
    const publication = await Publication.findById(publicationId)
      .populate("project",  "title domain semester status")
      .populate("remarks.addedBy", "name role")
      .lean();
 
    if (!publication) {
      return res.status(404).json({
        success: false,
        message: "Publication not found",
      });
    }
 
    // — Ownership check —
    if (publication.group.toString() !== groupId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this publication",
      });
    }
 
    return res.status(200).json({
      success: true,
      data: publication,
    });
  } catch (error) {
    next(error);
  }
};