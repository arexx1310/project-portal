import mongoose from "mongoose";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import { sendNotification } from "../notificationController.js";


/**
 * @desc Update config for a specific department
 * @route PATCH /api/faculty/btpconfig/:departmentId
 * @access Faculty (BTP_COMMITTEE_HEAD, BTP_COMMITTEE_MEMBER)
 */
export const updateBTPConfig = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // ── Auth / input guards ──────────────────────────────────────────────────

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Invalid department ID" });
    }

    if (!req.faculty?.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    if (String(req.faculty.departmentConfig) !== String(departmentId)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You can only update your own department configuration",
      });
    }

    if (!req.body.btpConfig || typeof req.body.btpConfig !== "object") {
      return res.status(400).json({ success: false, message: "btpConfig object is required" });
    }

    const configUpdates = req.body.btpConfig;

    if (Object.keys(configUpdates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }

    // ── Fetch existing config ────────────────────────────────────────────────

    const existingConfig = await DepartmentConfig.findById(departmentId).lean();
    if (!existingConfig) {
      return res.status(404).json({ success: false, message: "Configuration not found" });
    }

    // Single merged view — use this for all cross-field validation
    const merged = { ...existingConfig.btpConfig, ...configUpdates };

    // ── Numeric range validation (against merged so partial updates are safe) ─

    if (merged.minStudentsPerGroup < 1) {
      return res.status(400).json({
        success: false,
        message: "minStudentsPerGroup must be at least 1",
      });
    }

    // Bug fix: was only checked when BOTH keys were in the request body.
    // Now uses merged so a partial update (only max) is also caught.
    if (merged.maxStudentsPerGroup < merged.minStudentsPerGroup) {
      return res.status(400).json({
        success: false,
        message: "maxStudentsPerGroup must be >= minStudentsPerGroup",
      });
    }

    // ── Cross-department rules ───────────────────────────────────────────────

    if (configUpdates.crossDepartmentRules) {
      const { isAllowed, minSameDepartmentStudents } = merged.crossDepartmentRules ?? {};

      if (isAllowed !== undefined && typeof isAllowed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "crossDepartmentRules.isAllowed must be a boolean",
        });
      }

      if (
        isAllowed === true &&
        minSameDepartmentStudents !== undefined &&
        minSameDepartmentStudents > merged.maxStudentsPerGroup
      ) {
        return res.status(400).json({
          success: false,
          message: "minSameDepartmentStudents cannot exceed maxStudentsPerGroup",
        });
      }
    }

    // ── Deadline validation ──────────────────────────────────────────────────

    const deadlineFields = [
      "groupCreationDeadline",
      "supervisorSelectionDeadline",
      "projectProposalDeadline",
    ];

    const hasDeadlineUpdate = deadlineFields.some((f) => configUpdates[f]);

    if (hasDeadlineUpdate) {
      // Parse & validate date strings in configUpdates, then write back to merged
      for (const field of deadlineFields) {
        if (configUpdates[field]) {
          const date = new Date(configUpdates[field]);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ success: false, message: `Invalid date for ${field}` });
          }
          // Keep parsed Date objects in both places
          configUpdates[field] = date;
          merged[field] = date;
        }
      }

      // Use merged for ordering checks — handles partial updates correctly
      const { groupCreationDeadline, supervisorSelectionDeadline, projectProposalDeadline } = merged;

      if (
        groupCreationDeadline &&
        supervisorSelectionDeadline &&
        supervisorSelectionDeadline < groupCreationDeadline
      ) {
        return res.status(400).json({
          success: false,
          message: "supervisorSelectionDeadline must be after groupCreationDeadline",
        });
      }

      if (
        supervisorSelectionDeadline &&
        projectProposalDeadline &&
        projectProposalDeadline < supervisorSelectionDeadline
      ) {
        return res.status(400).json({
          success: false,
          message: "projectProposalDeadline must be after supervisorSelectionDeadline",
        });
      }
    }

    const dotNotationUpdate = Object.fromEntries(
      Object.entries(configUpdates).map(([k, v]) => [`btpConfig.${k}`, v])
    );

    const updatedConfig = await DepartmentConfig.findByIdAndUpdate(
      departmentId,
      { $set: dotNotationUpdate },
      {
        new: true,
      }
    )
      .select("department btpConfig")
      .lean();

    // ── Notifications (fire-and-forget via sendNotification helper) ──────────

    setImmediate(async () => {
      try {
        const [facultyList, studentList] = await Promise.all([
          Faculty.find({ departmentConfig: departmentId })
            .populate("user", "_id role")
            .lean(),
          Student.find({ departmentConfig: departmentId })
            .populate("user", "_id role")
            .lean(),
        ]);

        const recipients = [
          ...facultyList.map((f) => ({ _id: f.user._id, role: f.user.role })),
          ...studentList.map((s) => ({ _id: s.user._id, role: s.user.role })),
        ];

        await sendNotification(
          {
            type: "BTP_CONFIG_UPDATED",
            message: `BTP configuration for ${updatedConfig.department} department has been updated.`,
            refId: updatedConfig._id,
            refModel: "DepartmentConfig",
            triggeredBy: req.user._id,
          },
          recipients
        );
      } catch (notifError) {
        console.error("Failed to send notifications:", notifError);
      }
    });

    return res.status(200).json({
      success: true,
      message: "BTP configuration updated successfully",
      data: updatedConfig,
    });

  } catch (error) {
    next(error);
  }
};
/**
 * @desc Get BTP config for logged-in faculty's department
 * @route GET /api/faculty/btpconfig
 * @access Faculty (BTP_COMMITTEE_HEAD, BTP_COMMITTEE_MEMBER)
 */
export const getBTPConfig = async (req, res, next) => {
  try {

    if (!req.faculty || !req.faculty.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const departmentId = req.faculty.departmentConfig;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department reference",
      });
    }

    const config = await DepartmentConfig.findById(departmentId)
      .select("_id department specializations btpConfig")
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "BTP configuration not found for your department",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};