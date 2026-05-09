import mongoose from "mongoose";
import axios from "axios";
import Publication from "../../models/Publication.js";
import Project from "../../models/Project.js";
import Group from "../../models/Group.js";
import Student from "../../models/Student.js";

/* ===============================================================
   HELPERS
=============================================================== */

/**
 * Resolves the caller's group membership and supervisor status from the
 * already-attached middleware profiles (req.student / req.faculty).
 * No DB hit for the identity check itself — all sourced from the JWT.
 *
 * Returns { groupId, isSupervisor } or null if the caller has no
 * recognised profile attached.
 */
export const resolveCallerContext = (req) => {
  if (req.student) {
    return { groupId: req.student.groupId ?? null, isSupervisor: false };
  }
  if (req.faculty) {
    // facultyId is used later to verify actual group supervisor membership
    return { facultyId: req.faculty.id, groupId: null, isSupervisor: true };
  }
  return null;
};

/**
 * Verifies that the caller (student or faculty) is actually authorised to
 * act on a specific group:
 *   - Student  → their token groupId must match the target group.
 *   - Faculty  → their facultyId must appear in group.supervisors.
 *
 * Accepts an already-fetched `group` document to avoid redundant DB calls.
 *
 * @returns true if authorised, false otherwise.
 */
export const isAuthorisedForGroup = (caller, group) => {
  if (!caller || !group) return false;

  if (!caller.isSupervisor) {
    // Student path — groupId is embedded in the token
    return caller.groupId?.toString() === group._id.toString();
  }

  // Faculty path — must be listed as a supervisor on the group
  return group.supervisors.some(
    (s) => s.toString() === caller.facultyId.toString()
  );
};

/* ===============================================================
   LIST PUBLICATIONS
=============================================================== */

/**
 * @desc    List all publications for a project
 * @route   GET /api/student/projects/:projectId/publications
 * @route   GET /api/faculty/projects/:projectId/publications
 * @access  Private — group members or supervisors only
 */
export const listPublications = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID." });
    }

    /* ── 1. Resolve caller ───────────────────────────────────────────────── */
    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    /* ── 2. Fetch project → derive group ─────────────────────────────────── */
    const project = await Project.findById(projectId).select("group session").lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    /* ── 3. Fetch group for authorisation check ───────────────────────────── */
    const group = await Group.findById(project.group).select("supervisors").lean();

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member or supervisor of this group.",
      });
    }

    /* ── 4. Fetch publications ───────────────────────────────────────────── */
    const publications = await Publication.find({ project: projectId, session: project.session })
      .select("-remarks")                       // remarks fetched on demand via getPublication
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: publications.length,
      data: publications.map((p) => ({
        _id: p._id,
        title: p.title,
        status: p.status,
        projectId: p.project
      })),
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================================================
   GET SINGLE PUBLICATION
=============================================================== */

/**
 * @desc    Get full details (including remarks timeline) of a single publication
 * @route   GET /api/student/projects/:projectId/publications/:publicationId
 * @route   GET /api/faculty/projects/:projectId/publications/:publicationId
 * @access  Private — group members or supervisors only
 */
export const getPublication = async (req, res, next) => {
  try {
    const { projectId, publicationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(publicationId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)." });
    }

    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    /* ── Fetch project ───────────────────────────────────────────────────── */
    const project = await Project.findById(projectId).select("group session").lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    /* ── Parallel fetch: group + publication ─────────────────────────────── */
    const [group, publication] = await Promise.all([
      Group.findById(project.group).select("supervisors").lean(),
      Publication.findOne({ _id: publicationId, project: projectId })
        .populate("remarks.addedBy", "name role")
        .lean(),
    ]);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member or supervisor of this group.",
      });
    }

    if (!publication) {
      return res.status(404).json({ success: false, message: "Publication not found." });
    }

    return res.status(200).json({ success: true, data: publication });
  } catch (error) {
    next(error);
  }
};

/* ===============================================================
   CREATE PUBLICATION
=============================================================== */

/**
 * @desc    Create a new publication record linked to a project
 * @route   POST /api/student/projects/:projectId/publications
 * @route   POST /api/faculty/projects/:projectId/publications
 * @access  Private — group members or supervisors only
 *
 * Required body: { title }
 * 
 */
export const createPublication = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID." });
    }

    /* ── 1. Resolve caller ───────────────────────────────────────────────── */
    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    /* ── 2. Validate required body fields ────────────────────────────────── */
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required and must be a non-empty string." });
    }

    /* ── 3. Fetch project — must exist and be Approved or beyond ─────────── */
    const project = await Project.findById(projectId).select("group session status").lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (!["Approved", "In Progress", "Completed"].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: `Publications can only be created for approved projects. Current project status: "${project.status}".`,
      });
    }

    /* ── 4. Fetch group for authorisation ────────────────────────────────── */
    const group = await Group.findById(project.group).select("supervisors").lean();

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member or supervisor of this group.",
      });
    }

    /* ── 5. Create ───────────────────────────────────────────────────────── */
    const publication = await Publication.create({
      group:    project.group,
      project:  projectId,
      session:  project.session,
      title:    title.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Publication created successfully.",
      data: {
        _id: publication._id,
        title: publication.title,
        status: publication.idea,
        projectId: publication.project
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================================================
   UPDATE PUBLICATION
=============================================================== */

/**
 * @desc    Update publication details
 * @route   PATCH /api/student/projects/:projectId/publications/:publicationId
 * @route   PATCH /api/faculty/projects/:projectId/publications/:publicationId
 * @access  Private — group members or supervisors only
 *
 * Editable fields:
 * - abstract
 * - status
 * - conference
 * - remarks
 * - published.doi
 *
 * If DOI is provided:
 * - Fetches metadata from CrossRef
 * - Auto updates:
 *   - title
 *   - authors
 *   - conference.name
 *   - published.link
 *   - published.publishedDate
 *   - published.venue
 *   - published.publisher
 */
export const updatePublication = async (req, res, next) => {
  try {
    const { projectId, publicationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(publicationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID(s).",
      });
    }

    const caller = resolveCallerContext(req);

    if (!caller) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    /* ── Fetch project ───────────────────────────────────────── */

    const project = await Project.findById(projectId)
      .select("group session")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    /* ── Fetch group + publication ──────────────────────────── */

    const [group, publication] = await Promise.all([
      Group.findById(project.group).select("supervisors").lean(),

      Publication.findOne({
        _id: publicationId,
        project: projectId,
      }),
    ]);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    if (!publication) {
      return res.status(404).json({
        success: false,
        message: "Publication not found.",
      });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not a member or supervisor of this group.",
      });
    }

    /* ── Lock published / withdrawn publications ────────────── */

    if (["Withdrawn"].includes(publication.status)) {
      return res.status(400).json({
        success: false,
        message: `Publication with status "${publication.status}" cannot be edited.`,
      });
    }

    /* ── Editable manual fields ─────────────────────────────── */

    const { abstract, status, conference, remarks, published } = req.body;

    if (abstract !== undefined) {
      publication.abstract = abstract;
    }

    if (status !== undefined) {
      publication.status = status;
    }

    if (conference !== undefined) {
      publication.conference = {
        ...publication.conference?.toObject?.(),
        ...conference,
      };
    }

    if (remarks !== undefined) {
      publication.remarks = remarks;
    }

    /* ── DOI metadata fetch ─────────────────────────────────── */

    const doi = published?.doi?.trim();

    if (doi) {
      try {
        const response = await axios.get(
          `https://api.crossref.org/works/${encodeURIComponent(doi)}`
        );

        const work = response.data?.message;

        if (!work) {
          return res.status(404).json({
            success: false,
            message: "DOI metadata not found.",
          });
        }

        /* ── Authors ───────────────────────────────────────── */

        const authors = Array.isArray(work.author)
          ? work.author.map((author) => {
              return [author.given, author.family]
                .filter(Boolean)
                .join(" ")
                .trim();
            })
          : [];

        /* ── Published date ────────────────────────────────── */

        let publishedDate = null;

        const publishedParts =
          work.created?.["date-parts"]?.[0] ||
          work.published?.["date-parts"]?.[0] ||
          work.issued?.["date-parts"]?.[0];

        if (publishedParts) {
          const [year, month = 1, day = 1] = publishedParts;

          publishedDate = new Date(year, month - 1, day);
        }

        /* ── Conference / venue name ───────────────────────── */

        const venue =
          work["container-title"]?.[0] || null;

        const conferenceName =
          work.event?.name || venue || null;

        /* ── Paper URL ─────────────────────────────────────── */

        const paperUrl =
          work.resource?.primary?.URL ||
          work.URL ||
          null;

        /* ── Update publication fields ────────────────────── */

        publication.title =
          work.title?.[0] || publication.title;

        publication.authors = authors;

        publication.conference = {
          ...publication.conference?.toObject?.(),

          name: conferenceName,
        };

        publication.published = {
          ...publication.published?.toObject?.(),

          doi,

          link: paperUrl,

          publishedDate,

          venue,

          publisher: work.publisher || null,
        };

        /* ── Auto status update ───────────────────────────── */

        publication.status = "Published";
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Failed to fetch DOI metadata.",
          
        });
      }
    }

    /* ── Save ─────────────────────────────────────────────── */

    await publication.save();

    return res.status(200).json({
      success: true,
      message: "Publication updated successfully.",
      data: publication,
    });
  } catch (error) {
    next(error);
  }
};

/* ===============================================================
   DELETE PUBLICATION
=============================================================== */

/**
 * @desc    Delete a publication
 *          Only allowed while status is "Idea" or "Writing" (not yet submitted anywhere).
 *          Supervisors can delete at any non-Published/non-Withdrawn stage.
 * @route   DELETE /api/student/projects/:projectId/publications/:publicationId
 * @route   DELETE /api/faculty/projects/:projectId/publications/:publicationId
 * @access  Private — group members or supervisors only
 */
export const deletePublication = async (req, res, next) => {
  try {
    const { projectId, publicationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(publicationId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)." });
    }

    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const project = await Project.findById(projectId).select("group session").lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const [group, publication] = await Promise.all([
      Group.findById(project.group).select("supervisors").lean(),
      Publication.findOne({ _id: publicationId, project: projectId }).lean(),
    ]);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member or supervisor of this group.",
      });
    }

    if (!publication) {
      return res.status(404).json({ success: false, message: "Publication not found." });
    }

    /* ── Students may only delete early-stage publications ───────────────── */
    const STUDENT_DELETABLE = ["Idea", "Writing"];
    if (!caller.isSupervisor && !STUDENT_DELETABLE.includes(publication.status)) {
      return res.status(403).json({
        success: false,
        message: `Students can only delete publications in "Idea" or "Writing" stage. Current status: "${publication.status}". Contact your supervisor.`,
      });
    }

    /* ── Supervisors cannot delete already-published records ─────────────── */
    if (["Published"].includes(publication.status)) {
      return res.status(400).json({
        success: false,
        message: `Published records cannot be deleted.`,
      });
    }

    await Publication.findByIdAndDelete(publicationId);

    return res.status(200).json({ success: true, message: "Publication deleted successfully." });
  } catch (error) {
    next(error);
  }
};

/* ===============================================================
   ADD REMARK
=============================================================== */

/**
 * @desc    Append a remark/timeline entry to a publication
 * @route   POST /api/student/projects/:projectId/publications/:publicationId/remarks
 * @route   POST /api/faculty/projects/:projectId/publications/:publicationId/remarks
 * @access  Private — group members or supervisors only
 *
 * Required body: { note }
 */
export const addRemark = async (req, res, next) => {
  try {
    const { projectId, publicationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(publicationId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)." });
    }

    const caller = resolveCallerContext(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { note } = req.body;

    if (typeof note !== "string" || !note.trim()) {
      return res.status(400).json({ success: false, message: "note is required and must be a non-empty string." });
    }

    const project = await Project.findById(projectId).select("group session").lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const [group, publication] = await Promise.all([
      Group.findById(project.group).select("supervisors").lean(),
      Publication.findOne({ _id: publicationId, project: projectId }),
    ]);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!isAuthorisedForGroup(caller, group)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member or supervisor of this group.",
      });
    }

    if (!publication) {
      return res.status(404).json({ success: false, message: "Publication not found." });
    }

    /* ── Append remark — addedBy is the User _id from the token ─────────── */
    publication.remarks.push({
      note: note.trim(),
      addedBy: req.user.id,
      date: new Date(),
    });

    await publication.save();

    // Return only the new remark for efficiency
    const newRemark = publication.remarks[publication.remarks.length - 1];

    return res.status(201).json({
      success: true,
      message: "Remark added successfully.",
      data: newRemark,
    });
  } catch (error) {
    next(error);
  }
};