import mongoose from "mongoose";
import User from "../../models/User.js";
import WorkItem from "../../models/WorkItem.js";
import Project from "../../models/Project.js";


// Weekly Work controller student
/* ─────────────────────────────────────────────────────
   HELPER
───────────────────────────────────────────────────── */

/**
 * Fetches the project and verifies the student belongs to its group.
 * Uses req.student.groupId from the token — no extra DB hit for membership.
 */
const assertStudentInProject = async (projectId, req) => {
  const project = await Project.findById(projectId).select("group").lean();

  if (!project) throw { status: 404, message: "Project not found" };

  // Project.group is the GroupId — student's groupId comes from the token
  if (!req.student.groupId || project.group.toString() !== req.student.groupId.toString()) {
    throw { status: 403, message: "You do not have access to this project." };
  }

  return project;
};

/* ─────────────────────────────────────────────────────
   WEEKLY UPDATES
───────────────────────────────────────────────────── */

/**
 * @desc  Submit a new weekly update
 * @route POST /api/projects/:projectId/weekly-updates
 */
export const submitWeeklyUpdate = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const studentId     = req.student.id;     // ← token
    
    const { weekNumber, updateText, links = [] } = req.body;

    if (!weekNumber || !updateText) {
      return res.status(400).json({ success: false, message: "weekNumber and updateText are required." });
    }

    await assertStudentInProject(projectId, req);

    // One update per project per week
    const existing = await WorkItem.exists({ project: projectId, type: "WeeklyUpdate", weekNumber });

    if (existing) {
      return res.status(409).json({ success: false, message: `A weekly update for week ${weekNumber} already exists.` });
    }

    const workItem = await WorkItem.create({
      type:        "WeeklyUpdate",
      project:     projectId,
      weekNumber,
      updateText,
      links,
      submittedBy: studentId,
      status:      "Submitted",
    });
  
    const user = await User.findById(req.user.id)
      .select("-_id name")
      .lean();


    const data = {
        _id: workItem._id,
        type: workItem.type,
        weekNumber: workItem.weekNumber,
        updateText: workItem.updateText,
        links: workItem.links,
        submittedBy: user.name,
        feedbacks: [],
        status: workItem.status,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    return res.status(201).json({ success: true, message: "Weekly update submitted.", data: data});
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @desc  Edit an existing weekly update (only if not yet Reviewed)
 * @route PUT /api/projects/:projectId/weekly-updates/:itemId
 */
export const editWeeklyUpdate = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const studentId             = req.student.id;    // ← token
    const { updateText, links } = req.body;

    await assertStudentInProject(projectId, req);    // ← pass req, not studentId

    const workItem = await WorkItem.findOne({ _id: itemId, project: projectId, type: "WeeklyUpdate" });

    if (!workItem) {
      return res.status(404).json({ success: false, message: "Weekly update not found." });
    }

    if (workItem.submittedBy._id.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own updates." });
    }

    if (["Reviewed", "Completed"].includes(workItem.status)) {
      return res.status(400).json({ success: false, message: "Update has already been reviewed and cannot be edited." });
    }

    if (updateText !== undefined) workItem.updateText = updateText;
    if (links !== undefined)      workItem.links      = links;

    await workItem.save();

    return res.status(201).json({ success: true, message: "Weekly update edited.", data: {
        updateText: workItem.updateText,
        links: workItem.links
      } 
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @desc  List all weekly updates for a project (paginated)
 * @route GET /api/projects/:projectId/weekly-updates?page=1&limit=4
 */
export const getWeeklyUpdates = async (req, res, next) => {
  try {
    const { projectId } = req.params;
 
    // --- Pagination params ---
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 4);
    const skip  = (page - 1) * limit;
 
    await assertStudentInProject(projectId, req);
 
    const filter = { project: projectId, type: "WeeklyUpdate" };
 
    // Run count and data fetch in parallel for efficiency
    const [total, updates] = await Promise.all([
      WorkItem.countDocuments(filter),
      WorkItem.find(filter)
        .sort({ weekNumber: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:     "submittedBy",
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
 
    const data = updates.map((u) => ({
      _id:         u._id,
      type:        u.type,
      weekNumber:  u.weekNumber,
      updateText:  u.updateText,
      links:       u.links,
      submittedBy: u.submittedBy?.user?.name || "",
      feedbacks:   u.feedbacks.map((f) => ({
        name:    f.faculty?.user?.name || "",
        comment: f.comment,
        givenAt: f.givenAt,
      })),
      status:    u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
 
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
   TASKS
───────────────────────────────────────────────────── */

/**
 * @desc  List all tasks for a project (paginated)
 * @route GET /api/projects/:projectId/tasks?page=1&limit=4&status=Pending
 */
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status }    = req.query;
 
    // --- Pagination params ---
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 4);
    const skip  = (page - 1) * limit;
 
    await assertStudentInProject(projectId, req);
 
    const filter = { project: projectId, type: "Task" };
    if (status) filter.status = status;
 
    // Run count and data fetch in parallel for efficiency
    const [total, tasks] = await Promise.all([
      WorkItem.countDocuments(filter),
      WorkItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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
 
    const data = (tasks || []).map((t) => ({
      _id: t?._id,
      type: t?.type || "",
      title: t?.title || "",
      description: t?.description || "",

      assignedBy: t?.assignedBy?.user?.name || "",

      submission: t?.submission || null,

      feedbacks: (t?.feedbacks || []).map((f) => ({
        name: f?.faculty?.user?.name || "",
        comment: f?.comment || "",
        givenAt: f?.givenAt || null,
      })),

      dueDate: t?.dueDate || null,
      status: t?.status || "",
      createdAt: t?.createdAt || null,
      updatedAt: t?.updatedAt || null,
    }));
 
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};


/**
 * @desc  Submit (or re-submit) a task
 * @route POST /api/projects/:projectId/tasks/:itemId/submit
 */
export const submitTask = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const { text, links = [] }  = req.body;

    if (!text && links.length === 0) {
      return res.status(400).json({ success: false, message: "Provide submission text or at least one link." });
    }

    await assertStudentInProject(projectId, req);

    const task = await WorkItem.findOne({ _id: itemId, project: projectId, type: "Task" });

    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    if (task.status === "Completed") {
      return res.status(400).json({ success: false, message: "Task is already completed and cannot be re-submitted." });
    }

    task.submission = { text, links, submittedAt: new Date() };
    task.status     = "Submitted";
    await task.save();

    return res.status(201).json({ 
      success: true, 
      message: "Task submitted successfully.", 
      data: {
        submission: task.submission,
        status: task.status
      }});
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @desc  Edit a task submission before it is reviewed
 * @route PUT /api/projects/:projectId/tasks/:itemId/submission
 */
export const editTaskSubmission = async (req, res, next) => {
  try {
    const { projectId, itemId } = req.params;
    const { text, links }       = req.body;

    await assertStudentInProject(projectId, req);

    const task = await WorkItem.findOne({ _id: itemId, project: projectId, type: "Task" });

    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    if (!task.submission) {
      return res.status(400).json({ success: false, message: "No existing submission found. Use POST to submit first." });
    }

    if (["Reviewed", "Completed"].includes(task.status)) {
      return res.status(400).json({ success: false, message: "Submission has already been reviewed and cannot be edited." });
    }

    if (text !== undefined)  task.submission.text  = text;
    if (links !== undefined) task.submission.links = links;
    task.submission.submittedAt = new Date();

    await task.save();
    return res.status(201).json({ success: true, message: "Submission updated.", data:{
        submission: task.submission,
        status: task.status
    }});
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};