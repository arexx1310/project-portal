import mongoose from "mongoose";

import Student from "../../models/Student.js";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Faculty from "../../models/Faculty.js";

import { resolveCallerContext, isAuthorisedForGroup } from "./publicationController.js";

/**
 * @desc    Get project details by projectId
 * @route   GET /api/student/projects/:projectId
 * @route   GET /api/faculty/projects/:projectId
 * @access  Student (must belong to the project's group) | Faculty (unrestricted)
 */
export const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID." });
    }

    const project = await Project.findById(projectId)
      .select("title description group domain semester status createdAt")
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // ── Student guard: must be a member of the project's group ───────────────
    if (req.user.role === "student") {
      const { groupId } = req.student;   // from token — no DB

      if (!groupId || groupId.toString() !== project.group.toString()) {
        return res.status(403).json({ success: false, message: "You do not have access to this project." });
      }
    }

    return res.status(200).json({ 
      success: true, 
      data: project || null
    });

  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Edit project details by projectId
 * @route   PATCH /api/student/projects/:projectId
 * @route   PATCH /api/faculty/projects/:projectId
 * @access  Student (must belong to the project's group) | Faculty (must be supervisor of the project)
 */
/**
 *
 * Shared PATCH handler for both student and faculty routers.
 *
 * Middleware expected upstream (per router):
 *   Student → protect → authorize("student") → attachStudentProfile
 *   Faculty → protect → authorize("faculty") → attachFacultyProfile
 *
 * Both middlewares must attach their profile to the request
 * (req.student / req.faculty) before this handler runs.
 */

/* ─── Editable fields per role ──────────────────────────────────────────── */
const STUDENT_FIELDS = ["title", "description", "domain"];
const FACULTY_FIELDS = ["title", "description", "domain", "status"];

/* ─── Valid supervisor-driven status transitions ────────────────────────── */
const ALLOWED_TRANSITIONS = {
  Approved:      ["In Progress"],
  "In Progress": ["Completed"],
  Completed:     ["In Progress"],   // reopen
  // "Proposed" is intentionally excluded — lifecycle managed by ProjectApprovalRequest
};

/* ══════════════════════════════════════════════════════════════════════════
   HANDLER
══════════════════════════════════════════════════════════════════════════ */
export const editProject = async (req, res, next) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ success: false, message: "Invalid project ID." });
  }

  try {
    /* ── 1. Resolve who is calling ── */
    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(403).json({ success: false, message: "Forbidden: no recognised profile on request." });
    }

    /* ── 2. Load project ── */
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    /* ── 3. Load group (needed for supervisor membership check) ── */
    const group = await Group.findById(project.group).lean();
    if (!group) {
      return res.status(404).json({ success: false, message: "Associated group not found." });
    }

    /* ── 4. Authorise ── */
    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: caller.isSupervisor
          ? "Access denied: you are not a supervisor of this project's group."
          : "Access denied: you are not a member of this project's group.",
      });
    }

    /* ── 5. Pick allowed fields and strip anything not sent ── */
    const allowedFields = caller.isSupervisor ? FACULTY_FIELDS : STUDENT_FIELDS;
    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    /* ── 6. Role-specific guards ── */
    if (!caller.isSupervisor) {
      // Students cannot touch a completed project
      if (project.status === "Completed") {
        return res.status(403).json({
          success: false,
          message: "This project is Completed and can no longer be edited by students.",
        });
      }
    } else {
      // Validate status transition when supervisor sends one
      if (updates.status) {
        if (updates.status === project.status) {
          // No-op — silently drop rather than erroring
          delete updates.status;
        } else {
          const allowed = ALLOWED_TRANSITIONS[project.status] ?? [];
          if (!allowed.includes(updates.status)) {
            return res.status(400).json({
              success: false,
              message:
                `Cannot move project from "${project.status}" to "${updates.status}".` +
                (allowed.length
                  ? ` Allowed: ${allowed.join(", ")}.`
                  : " No transitions allowed from current status."),
            });
          }
        }
      }

      // After dropping a no-op status, re-check if anything remains
      if (Object.keys(updates).length === 0) {
        return res.status(200).json({ success: true, message: "No changes detected." });
      }
    }

    /* ── 7. Sanitise string fields ── */
    for (const field of ["title", "description", "domain"]) {
      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
        if (!updates[field]) {
          return res.status(400).json({ success: false, message: `"${field}" cannot be blank.` });
        }
      }
    }

    /* ── 8. Persist ── */
    const updated = await Project.findByIdAndUpdate(
      projectId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: updated,
    });

  } catch (err) {
    next(err);
  }
};




