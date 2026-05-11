import mongoose from "mongoose";
import ProjectApprovalRequest from "../../models/ProjectApprovalRequest.js";
import Project from "../../models/Project.js";
import Group from "../../models/Group.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Faculty from "../../models/Faculty.js";
import Department from "../../models/DepartmentConfig.js";
import { notifyUser, notifyGroup } from "../notificationController.js";
import { deleteFileFromDrive, getTemporaryViewUrl, resolveUploadFolder, uploadFileToDrive } from "../../config/googledrive.js";



export const getMyProjects = async (req, res, next) => {
  try {
      const groupId = req.student?.groupId;

      if (!groupId) {
          return res.status(404).json({
            success: false,
            message: "No projects found as their is no registered group for you."
          });
      }

      const projects  = await Project.find({group: req.student.groupId})
        .select("_id title semester");
      
      return res.status(200).json({
          success: true,
          data: projects || []
      });
  } catch (err) {
    next(err);
  }
};

export const getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find({})
          .select("_id department");
        
        return res.status(200).json({
            success: true,
            data: departments || []
        });
         
    } catch (error) {
       next(error);
    }
};

/**
 * @route GET /api/faculty/available-supervisors/:departmentId
 *
 * @desc Returns all faculty belonging to `departmentId` who still have open
 * supervisor slots in the current session, based on the department's
 * `btpConfig.maxGroupsPerSupervisor` for UG students and `mtpConfig.maxStudentsPerSupervisor for PG students limit.
 * @Params - departmentId  – the Department _id whose faculty list is requested
 * A faculty member is "available" when:
 *   activeGroupCount < maxGroupsPerSupervisor for UG
 *   activeGroupCount < maxStudentsPerSupervisor for PG
 *
 * "Active" groups = any group in this session where the faculty appears in
 *   `supervisors[]` AND the group status is NOT "Closed"
 *   (Closed groups are finished; they should not consume a slot).
 */

export const getAvailableSupervisors = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { session: sessionId, isPG } = req.student;

    if (!mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({ message: "Invalid department ID." });
    }

    /* ── 1. Fetch config ──────────────────────────────────────── */
    const department = await Department.findById(departmentId)
      .select("department btpConfig.maxGroupsPerSupervisor mtpConfig.maxStudentsPerSupervisor")
      .lean();

    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    // Pick the right limit and programType based on the student's programme
    const programType = isPG ? "PG" : "UG";
    const maxGroupsPerSupervisor = isPG
      ? department.mtpConfig?.maxStudentsPerSupervisor
      : department.btpConfig?.maxGroupsPerSupervisor;

    if (!maxGroupsPerSupervisor) {
      return res.status(409).json({
        message: `${isPG ? "MTP" : "BTP"} configuration is not set for this department.`,
      });
    }

    /* ── 2. Fetch faculty in the department ───────────────────── */
    const facultyList = await Faculty.find({ department: departmentId })
      .select("user _id department")
      .populate("user", "name email -_id")
      .lean();

    if (facultyList.length === 0) {
      return res.status(200).json({ availableSupervisors: [] });
    }

    const facultyIds = facultyList.map((f) => f._id);

    /* ── 3. Count active groups per faculty (one aggregation) ─── */
    const groupCounts = await Group.aggregate([
      {
        $match: {
          session:     new mongoose.Types.ObjectId(sessionId),
          programType, // "UG" or "PG" — narrows to the right pool
          status:      { $ne: "Closed" },
          supervisors: { $in: facultyIds },
        },
      },
      { $unwind: "$supervisors" },
      { $match: { supervisors: { $in: facultyIds } } },
      { $group: { _id: "$supervisors", activeGroupCount: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      groupCounts.map((e) => [e._id.toString(), e.activeGroupCount])
    );

    /* ── 4. Filter + annotate ─────────────────────────────────── */
    const availableSupervisors = facultyList
      .map((faculty) => {
        const activeGroupCount = countMap.get(faculty._id.toString()) ?? 0;
        const availableSlots   = maxGroupsPerSupervisor - activeGroupCount;
        return { _id: faculty._id, name: faculty.user.name, activeGroupCount, availableSlots };
      })
      .filter((f) => f.availableSlots > 0);

    return res.status(200).json({
      maxGroupsPerSupervisor,
      total: availableSupervisors.length,
      availableSupervisors,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc Submit a project approval request
 *       - Semester 7: requires supervisorsIds, picks new supervisors
 *       - Semester 8: supervisors inherited from group, no selection needed
 * @route POST /api/student/project-proposal/create-request
 * @access Private (attachStudentProfile middleware required)
 */

export const createProjectRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { title, description, domain, supervisorIds = [] } = req.body;

    // ── 1. Field validation ───────────────────────────────────────────────────
    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof domain !== "string" || !domain.trim()
    ) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Title, description, and domain are required." });
    }

    // ── 2. Student context ────────────────────────────────────────────────────
    const { id: studentId, session: sessionId, groupId, semester } = req.student;

    // ── 3. Group check ────────────────────────────────────────────────────────
    if (!groupId) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "You must be part of a group before submitting a project request." });
    }

    // ── 4. Load group ─────────────────────────────────────────────────────────
    const group = await Group.findById(groupId)
      .select("_id name status departments supervisors")
      .lean()
      .session(dbSession);

    if (!group) {
      await dbSession.abortTransaction();
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    // ── 5. Branch by semester ─────────────────────────────────────────────────
    let resolvedSupervisorIds;
    let expiresAt;

    /* ════════════════════════════════════════════════════════════════
       SEMESTER 7
    ════════════════════════════════════════════════════════════════ */
    if (semester === 7) {

      if (group.status === "Draft") {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "Project request can only be submitted when group status is 'Formed'." });
      }

      if (group.supervisors?.length > 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "This group already has supervisors assigned." });
      }

      // ── Validate supervisorIds from body ──────────────────────────────────
      if (!Array.isArray(supervisorIds) || supervisorIds.length === 0) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "At least one supervisor is required." });
      }

      if (supervisorIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "One or more supervisor IDs are invalid." });
      }

      // FIX 1: block ANY pending sem-7 request for this group, not just same-supervisor ones
      const pendingExists = await ProjectApprovalRequest.exists({
        group: group._id,
        "project.semester": 7,
        status: "PendingSupervisorApproval",
      }).session(dbSession);

      if (pendingExists) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "A pending project approval request already exists for this group. Withdraw to send a new one" });
      }

      const uniqueSupervisorIds = [...new Set(supervisorIds.map(String))];

      const primaryDeptId = group.departments?.[0];
      if (!primaryDeptId) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "Group has no department assigned." });
      }

      // FIX 2: added .session(dbSession) — was reading outside the transaction
      const primaryDeptConfig = await Department.findById(primaryDeptId)
        .select("department btpConfig.lockRecordDeadline btpConfig.maxSupervisors btpConfig.crossDepartmentRules")
        .lean()
        .session(dbSession);

      const facultyRecords = await Faculty.find({ _id: { $in: uniqueSupervisorIds } })
        .select("_id department user")
        .populate("user", "_id role")
        .lean()
        .session(dbSession);

      if (!primaryDeptConfig?.btpConfig) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "BTP configuration not found for this group's department." });
      }

      const { btpConfig, department: deptName } = primaryDeptConfig;

      // ── Deadline check ────────────────────────────────────────────────────
      if (new Date() > new Date(btpConfig.lockRecordDeadline)) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: `The supervisor selection deadline has passed for department ${deptName}.` });
      }

      // ── Max supervisors check ─────────────────────────────────────────────
      if (uniqueSupervisorIds.length > btpConfig.maxSupervisors) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: `Department ${deptName} allows a maximum of ${btpConfig.maxSupervisors} supervisor(s).` });
      }

      // ── All faculty found? ────────────────────────────────────────────────
      if (facultyRecords.length !== uniqueSupervisorIds.length) {
        await dbSession.abortTransaction();
        return res.status(404).json({ success: false, message: "One or more supervisors were not found." });
      }

      // ── Cross-department check ────────────────────────────────────────────
      const primaryDeptIdStr = primaryDeptId.toString();
      const crossDeptSupervisors = facultyRecords.filter(
        (f) => f.department.toString() !== primaryDeptIdStr
      );

      if (crossDeptSupervisors.length > 0 && !btpConfig.crossDepartmentRules?.isAllowed) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Department ${deptName} does not allow supervisors from other departments.`,
        });
      }
      
      // At least one supervisor must belong to one of the group's departments
      const groupDeptStrs = new Set(group.departments.map((d) => d.toString()));
      const hasInternalSupervisor = facultyRecords.some((f) =>
        groupDeptStrs.has(f.department.toString())
      );

      if (!hasInternalSupervisor) {
        await dbSession.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "At least one supervisor must be from one of the group's departments.",
        });
      }

      resolvedSupervisorIds = facultyRecords.map((f) => f._id);
      expiresAt = new Date(btpConfig.lockRecordDeadline);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

    /* ════════════════════════════════════════════════════════════════
       SEMESTER 8
    ════════════════════════════════════════════════════════════════ */
    } else if (semester === 8) {

      if (group.supervisors?.length > 0) {
        resolvedSupervisorIds = group.supervisors;
      } else {
        if (!Array.isArray(supervisorIds) || supervisorIds.length === 0) {
          await dbSession.abortTransaction();
          return res.status(400).json({ success: false, message: "No supervisors found on this group. Please provide supervisor IDs." });
        }

        if (supervisorIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
          await dbSession.abortTransaction();
          return res.status(400).json({ success: false, message: "One or more supervisor IDs are invalid." });
        }

        const uniqueSupervisorIds = [...new Set(supervisorIds.map(String))];
        const facultyRecords = await Faculty.find({ _id: { $in: uniqueSupervisorIds } })
          .select("_id")
          .lean()
          .session(dbSession);

        if (facultyRecords.length !== uniqueSupervisorIds.length) {
          await dbSession.abortTransaction();
          return res.status(404).json({ success: false, message: "One or more supervisors were not found." });
        }

        resolvedSupervisorIds = facultyRecords.map((f) => f._id);
      }

      const pendingExists = await ProjectApprovalRequest.exists({
        group: group._id,
        "project.semester": 8,
        status: "PendingSupervisorApproval",
      }).session(dbSession);

      if (pendingExists) {
        await dbSession.abortTransaction();
        return res.status(400).json({ success: false, message: "A pending project approval request already exists for this group for sem 8." });
      }

      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

    } else {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Project approval requests are only allowed in semester 7 or 8." });
    }

    // ── 6. Create the approval request ───────────────────────────────────────
    const [approvalRequest] = await ProjectApprovalRequest.create(
      [
        {
          group: group._id,
          project: {
            title: title.trim(),
            description: description.trim(),
            domain: domain.trim(),
            semester,
          },
          supervisorInvites: resolvedSupervisorIds.map((id) => ({ faculty: id })),
          expiresAt,
        },
      ],
      { session: dbSession }
    );

    // ── 7. Advance group status (sem 7 only) ──────────────────────────────────
    if (semester === 7) {
      await Group.updateOne(
        { _id: group._id },
        { $set: { status: "SupervisorRequested" } },
        { session: dbSession }
      );
    }

    // FIX 4: both notify calls moved BEFORE commitTransaction with dbSession
    if (semester === 7) {
      await notifyGroup(
        group._id,
        req.user.id,
        `Your group "${group.name}" has sent a project proposal to supervisor(s). Check details in Project Proposals tab.`,
        dbSession
      );
    } else if (semester === 8) {
      await notifyGroup(
        group._id,
        req.user.id,
        `A project proposal has been created for Semester 8 by your group: "${group.name}".`,
        dbSession
      );
    }

    await dbSession.commitTransaction();

    return res.status(201).json({
      success: true,
      message:
        semester === 7
          ? "Project approval request submitted. Awaiting supervisor responses."
          : "Semester 8 project submitted. Your existing supervisors have been notified.",
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

 
/**
 * @desc Cancel a pending project approval request (any group member can cancel)
 * @route DELETE /api/student/project-proposal/:inviteId
 * @access Private (attachStudentProfile middleware required)
 */
export const cancelProjectRequest = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const { inviteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      await dbSession.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid request ID." });
    }
 
    const {id: studentId, groupId, semester } = req.student;
 
    if (!groupId) {
      await dbSession.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You are not part of any group.",
      });
    }
 
    const request = await ProjectApprovalRequest.findOne({
      _id: inviteId,     
      group: groupId,
    }).session(dbSession);

    if (!request) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Request not found or access denied.",
      });
    }
 
    if (request.status !== "PendingSupervisorApproval") {
      await dbSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "This request can no longer be cancelled.",
      });
    }
 
    await ProjectApprovalRequest.findByIdAndDelete(inviteId, { 
      session: dbSession,
    });
    
    await dbSession.commitTransaction();
  
    return res.status(200).json({
      success: true,
      message: "Project approval request cancelled.",
    });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};


// ---------------------------------------------------------------------------
// Resolve human-readable labels needed to build the Drive folder path
// ---------------------------------------------------------------------------
 
const resolveLabels = async (project, student) => {
  const [session, group, department] = await Promise.all([
    Session.findById(project.session).lean(),
    Group.findById(project.group).lean(),
    Department.findById(student.department).lean(),
  ]);
 
  if (!session || !group || !department) {
    const err = new Error("Could not resolve session, group or department.");
    err.statusCode = 500;
    throw err;
  }
 
  return {
    programType:    student.isPG ? "PG" : "UG",
    sessionName:    session.name,
    departmentName: department.department,
    groupName:      group.name,
  };
};


export const uploadDocument = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const { label } = req.body;

    if (!label?.trim()) {
      return res.status(400).json({ success: false, message: "Document label is required." });
    }

    // Bug fixed: was missing await, and had typo "projecId"
    const project = await Project.findById(projectId).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Bug fixed: was req.student but middleware attaches to req.student
    if (!req.student.groupId || project.group.toString() !== req.student.groupId.toString()) {
      return res.status(403).json({ success: false, message: "You do not have access to this project." });
    }

    const labels = await resolveLabels(project, req.student);

    // Bug fixed: was "folderIds" (typo) and category was not pulled from body
    const folderId = await resolveUploadFolder({
      ...labels,
      category: "documents",
    });

    // Bug fixed: was passing undefined folderId
    const { fileId , webViewLink} = await uploadFileToDrive({
      buffer:       req.file.buffer,
      originalName: req.file.originalname,
      folderId,
    });

    // Push { label, url } into project.documents and save
    const updated = await Project.findByIdAndUpdate(
      projectId,
      { $push: { documents: { label: label.trim(), fileId, url:webViewLink} } },
      { new: true, select: "documents" }
    );

    await notifyGroup(project.group,req.user.id,`Document - ${label} submitted for the project ${project.title}`);

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully.",
      data: updated.documents.at(-1), // return the newly added entry
    });
  } catch (err) {
    next(err);
  }
};


export const deleteDocument = async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;

    const project = await Project.findById(projectId)
      .select("documents group")
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (!req.student.groupId || project.group.toString() !== req.student.groupId.toString()) {
      return res.status(403).json({ success: false, message: "You do not have access to this project." });
    }

    if (project.status === "Completed") {
      return res.status(400).json({ success: false, message: "Project has been completed. No changes allowed"});
    }
    const document = project.documents.find((d) => d._id.toString() === documentId);

    const title = document.label;

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    // Extract Drive file ID from the URL and delete from Drive
    const fileId = document.fileId;
    
    if (fileId) await deleteFileFromDrive(fileId).catch(() => {});

    await Project.findByIdAndUpdate(projectId, {
      $pull: { documents: { _id: documentId } },
    });
    return res.status(200).json({ success: true, message: "Document deleted successfully." });
  } catch (err) {
    next(err);
  }
};




