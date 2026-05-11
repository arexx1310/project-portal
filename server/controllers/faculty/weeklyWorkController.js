import mongoose from "mongoose";
import WorkItem from "../../models/WorkItem.js";
import Project from "../../models/Project.js";
import Group from "../../models/Group.js";
import User from "../../models/User.js";
import {notifyGroup} from "../notificationController.js";
// Weekly Work controller faculty
/* ─────────────────────────────────────────────────────
   HELPER
───────────────────────────────────────────────────── */

/**
 * Fetches the project and verifies the faculty is a supervisor of its group.
 * Uses req.faculty.id from the token — only 2 lean fetches, no extra join.
 */
const assertFacultyInProject = async (projectId, req) => {
  const project = await Project.findById(projectId).select("group").lean();
  if (!project) throw { status: 404, message: "Project not found." };

  const isSupervisor = await Group.exists({
    _id:         project.group,
    supervisors: req.faculty.id,
  });

  if (!isSupervisor) throw { status: 403, message: "You are not a supervisor of this project's group." };

  return project;
};

/* ─────────────────────────────────────────────────────
   TASK MANAGEMENT
───────────────────────────────────────────────────── */

/**
 * @desc  Assign a new task to the project
 * @route POST /api/projects/:projectId/tasks
 */
export const createTask = async (req, res, next) => {
  try {
    const { projectId }             = req.params;
    const facultyId                 = req.faculty.id;        // ← token
    const { title, description, dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Task title and description is required." });
    }

    await assertFacultyInProject(projectId, req);

    const task = await WorkItem.create({
      type:       "Task",
      project:    projectId,
      assignedBy: facultyId,
      title,
      description,
      dueDate:    dueDate ? new Date(dueDate) : undefined,
      status:     "Pending",
    });

    const faculty = await User.findById(req.user.id)
      .select("-_id name")
      .lean();

    const newTask = {
        _id: task._id,
        type: task.type,
        title: task.title,
        description: task.description,
        assignedBy: faculty.name,
        dueDate: task.dueDate,
        status: task.status,
        submission: task.submission,
        feedbacks: [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        updateText: "",
        links: [],
        weekNumber: null,
        submittedBy: "",
    }
    return res.status(201).json({ success: true, message: "Task created successfully.", data: newTask });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @desc  Edit task metadata (only the assigning faculty)
 * @route PUT /api/projects/:projectId/tasks/:itemId
 */
export const editTask = async (req, res, next) => {
  try {
    const { projectId, itemId }       = req.params;
    const facultyId                   = req.faculty.id;      // ← token
    const { title, description, dueDate } = req.body;

    await assertFacultyInProject(projectId, req);

    const task = await WorkItem.findOne({ _id: itemId, project: projectId, type: "Task" });

    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    if (task.assignedBy.toString() !== facultyId.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigning faculty can edit this task." });
    }

    if (title !== undefined)       task.title       = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined)     task.dueDate     = new Date(dueDate);

    await task.save();
    return res.status(201).json({ 
      success: true, 
      message: "Task updated.", 
      data: {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
      }});

  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @desc  Delete a task (only if still Pending)
 * @route DELETE /api/projects/:projectId/tasks/:itemId
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const facultyId             = req.faculty.id;            // ← token

    await assertFacultyInProject(projectId, req);

    const task = await WorkItem.findOne({ _id: itemId, project: projectId, type: "Task" });

    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    if (task.assignedBy.toString() !== facultyId.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigning faculty can delete this task." });
    }

    if (task.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Cannot delete a task that students have already submitted." });
    }

    await task.deleteOne();
    return res.json({ success: true, message: "Task deleted." });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/* ─────────────────────────────────────────────────────
   REVIEW DASHBOARD
───────────────────────────────────────────────────── */

/**
 * @desc  List all work items for a project with optional filters (paginated)
 * @route GET /api/projects/:projectId/work-items?page=1&limit=4&status=&type=
 */
export const getProjectWorkItems = async (req, res, next) => {
  try {
    const { projectId }    = req.params;
    const { status, type } = req.query;
 
    // --- Pagination params ---
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 4);
    const skip  = (page - 1) * limit;
 
    await assertFacultyInProject(projectId, req);
 
    const filter = { project: projectId };
    if (status) filter.status = status;
    if (type)   filter.type   = type;
 
    // Run count and data fetch in parallel for efficiency
    const [total, items] = await Promise.all([
      WorkItem.countDocuments(filter),
      WorkItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:     "submittedBy",
          select:   "-_id user",
          populate: [{ path: "user", select: "name -_id" }],
        })
        .populate({
          path:     "assignedBy",
          select:   "-_id user",
          populate: [{ path: "user", select: "name -_id" }],
        })
        .populate({
          path:     "feedbacks.faculty",
          select:   "-_id user",
          populate: [{ path: "user", select: "name -_id" }],
        })
        .lean(),
    ]);
 
    const itemData = items.map((i) => ({
      _id:         i._id,
      type:        i.type || "",
      weekNumber:  i.weekNumber  || "",
      updateText:  i.updateText  || "",
      title:       i.title       || "",
      description: i.description || "",
      links:       i.links,
      submittedBy: i.submittedBy?.user?.name || "",
      assignedBy:  i.assignedBy?.user?.name  || "",
      feedbacks:   i.feedbacks.map((f) => ({
        name:    f.faculty?.user?.name,
        comment: f.comment,
        givenAt: f.givenAt,
      })),
      submission: i.submission || null,
      dueDate:    i.dueDate    || null,
      status:     i.status     || "",
      createdAt:  i.createdAt,
      updatedAt:  i.updatedAt,
    }));
 
    return res.status(200).json({
      success: true,
      data:    itemData,
      pagination: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/* ─────────────────────────────────────────────────────
   FEEDBACK
───────────────────────────────────────────────────── */

/**
 * @desc  Add feedback to a work item — auto-advances Submitted → Reviewed
 * @route POST /api/projects/:projectId/work-items/:itemId/feedback
 */
export const addFeedback = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const facultyId             = req.faculty.id;            // ← token
    const { comment }           = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({ success: false, message: "Feedback comment is required." });
    }

    await assertFacultyInProject(projectId, req);

    const workItem = await WorkItem.findOne({ _id: itemId, project: projectId });

    if (!workItem) return res.status(404).json({ success: false, message: "Work item not found." });

    if (workItem.status === "Pending") {
      return res.status(400).json({ success: false, message: "Cannot review a task that has not been submitted yet." });
    }

    if (workItem.status === "Completed") {
      return res.status(400).json({ success: false, message: "This work item is already completed." });
    }

    workItem.feedbacks.push({ faculty: facultyId, comment });

    if (workItem.status === "Submitted") workItem.status = "Reviewed";

    await workItem.save();

    const populated = await workItem.populate({
        path: "feedbacks.faculty",
        select: "user -_id",
        populate: {
            path: "user",
            select: "name -_id"
        }
    });
    
    const latestFeedback = populated.feedbacks[populated.feedbacks.length - 1];

    const newFeedback = {
        name: latestFeedback.faculty?.user?.name || null,
        comment: latestFeedback.comment,
        givenAt: latestFeedback.givenAt
    };

    return res.status(201).json({
          success: true,
          message: "Feedback added.",
          data: newFeedback
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};


/* ─────────────────────────────────────────────────────
   STATUS MANAGEMENT
───────────────────────────────────────────────────── */

/**
 * @desc  Manually advance a work item's status
 * @route PATCH /api/projects/:projectId/work-items/:itemId/status
 *
 * Allowed transitions:
 *   Submitted → Reviewed
 *   Pending → Completed
 */
export const updateWorkItemStatus = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const { status }            = req.body;

    const ALLOWED_TRANSITIONS = {
      Submitted: ["Reviewed"],
      Reviewed: ["Submitted","Pending"],
      Completed: ["Pending"],
      Pending : ["Reviewed","Completed"],
    };

    await assertFacultyInProject(projectId, req);

    const workItem = await WorkItem.findOne({ _id: itemId, project: projectId });

    if (!workItem) return res.status(404).json({ success: false, message: "Work item not found." });

    const validNext = ALLOWED_TRANSITIONS[workItem.status];

    if (!validNext?.includes(status)) {
      return res.status(400).json({
        success: false,
        message:     `Invalid transition: ${workItem.status} → ${status}.`,
        allowedNext: validNext ?? [],
      });
    }

    workItem.status = status;
    await workItem.save();

    return res.status(201).json({ success: true, message: `Status updated to "${status}".`, data: workItem.status });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};