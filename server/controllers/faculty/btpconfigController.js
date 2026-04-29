import mongoose from "mongoose";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";
import { NotificationEvent, UserNotification } from "../../models/Notifications.js";


/**
 * @desc Update config for a specific department
 * @route PATCH /api/faculty/btpconfig/:id
 * @access Faculty (BTP_COMMITTEE_HEAD, BTP_COMMITTEE_MEMBER)
 */
export const updateBTPConfig = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // Object id validation
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    if (!req.faculty || !req.faculty.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Faculty profile not attached",
      });
    }

    // Faculty can only update their own department
    if (
      String(req.faculty.departmentConfig) !== String(departmentId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: You can only update your own department configuration",
      });
    }

    if (!req.body.btpConfig || typeof req.body.btpConfig !== "object") {
      return res.status(400).json({
        success: false,
        message: "btpConfig object is required",
      });
    }

    const config = req.body.btpConfig;
    const updates = {};

    if (
      config.minStudentsPerGroup !== undefined &&
      config.maxStudentsPerGroup !== undefined &&
      config.maxStudentsPerGroup < config.minStudentsPerGroup
    ) {
      return res.status(400).json({
        success: false,
        message: "maxStudentsPerGroup must be greater than or equal to minStudentsPerGroup",
      });
    }

    if (
      config.minSupervisors !== undefined &&
      config.maxSupervisors !== undefined &&
      config.maxSupervisors < config.minSupervisors
    ) {
      return res.status(400).json({
        success: false,
        message: "maxSupervisors must be greater than or equal to minSupervisors",
      });
    }
    
    if (config.crossDepartmentRules) {
      const { isAllowed, minSameDepartmentStudents } = config.crossDepartmentRules;

      if (isAllowed !== undefined && typeof isAllowed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "crossDepartmentRules.isAllowed must be a boolean",
        });
      }

      if (
        minSameDepartmentStudents !== undefined &&
        (typeof minSameDepartmentStudents !== "number" ||
          minSameDepartmentStudents < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "minSameDepartmentStudents must be a number >= 1",
        });
      }

  
      if (
        isAllowed === true &&
        minSameDepartmentStudents !== undefined &&
        config.maxStudentsPerGroup !== undefined &&
        minSameDepartmentStudents > config.maxStudentsPerGroup
        ) {
          return res.status(400).json({
            success: false,
            message:
              "minSameDepartmentStudents cannot exceed maxStudentsPerGroup",
          });
        }
    }

    const deadlines = [
      "groupCreationDeadline",
      "supervisorSelectionDeadline",
      "projectProposalDeadline",
    ];

    for (const field of deadlines) {
      if (config[field]) {
        const date = new Date(config[field]);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid date for ${field}`,
          });
        }
        config[field] = date; // normalize date format
      }
    }
    
    if (
      config.groupCreationDeadline &&
      config.supervisorSelectionDeadline &&
      config.supervisorSelectionDeadline < config.groupCreationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "supervisorSelectionDeadline must be after groupCreationDeadline",
      });
    }

    if (
      config.supervisorSelectionDeadline &&
      config.projectProposalDeadline &&
      config.projectProposalDeadline < config.supervisorSelectionDeadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "projectProposalDeadline must be after supervisorSelectionDeadline",
      });
    }
    
    updates.btpConfig = config;

     const updatedConfig = await DepartmentConfig.findByIdAndUpdate(
      departmentId,
      { $set: updates },
      {
        new: true,
        runValidators: true, // schema-level validation
      }
    )
      .select("department btpConfig")
      .lean();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    const [facultyList, studentList] = await Promise.all([
      Faculty.find({ departmentConfig: departmentId }).populate("user", "_id role").lean(),
      Student.find({ departmentConfig: departmentId }).populate("user", "_id role").lean(),
    ]);

    const allUsers = [
      ...facultyList.map(f => ({ _id: f.user._id, role: f.user.role })),
      ...studentList.map(s => ({ _id: s.user._id, role: s.user.role })),
    ];

    const message = `BTP configuration for ${updatedConfig.department} department has been updated.`;

    const event = await NotificationEvent.create({
      type: "BTP_CONFIG_UPDATED",
      message,
      refId: updatedConfig._id,
      refModel: "DepartmentConfig",
      triggeredBy: req.user._id,
    });

    // Fan-out
    await UserNotification.insertMany(
      allUsers.map(u => ({
        recipient: u._id,
        recipientRole: u.role,
        event: event._id,
      }))
    );
    
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