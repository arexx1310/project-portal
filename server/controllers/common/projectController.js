import mongoose from "mongoose";

import Student from "../../models/Student.js";
import Group from "../../models/Group.js";
import Project from "../../models/Project.js";
import Faculty from "../../models/Faculty.js";


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



