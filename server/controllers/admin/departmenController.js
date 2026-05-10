// controllers/admin/departmentController.js
import mongoose from "mongoose";
import Department from "../../models/DepartmentConfig.js";

const validateAndNormalizeInput = ({ department }) => {
  if (typeof department !== "string" || department.trim().length === 0) {
    return { error: "Department name must be a valid string" };
  }
  return { data: { department: department.trim().toUpperCase() } };
};

/**
 * @desc Create a department
 * @route POST /api/admin/department
 * @access Admin
 */
export const createDepartment = async (req, res, next) => {
  try {
    const { department } = req.body;

    const { error, data } = validateAndNormalizeInput({ department });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const { department: deptName } = data;

    const existingDept = await Department.findOne({ department: deptName });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: "Department already exists",
      });
    }

    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);

    await Department.create({
      department: deptName,
      btpConfig: {
        minStudentsPerGroup: 1,
        maxStudentsPerGroup: 4,
        maxSupervisors: 2,
        maxGroupsPerSupervisor: 4,
        lockRecordDeadline: defaultDeadline,
        crossDepartmentRules: {
          isAllowed: true,
          minSameDepartmentStudents: 1,
        },
      },
      mtpConfig: {
        maxSupervisors: 2,
        maxStudentsPerSupervisor: 10,
        crossDeptisAllowed: false,
        lockRecordDeadline: defaultDeadline,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Department created with default configuration",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Edit a department name
 * @route PUT /api/admin/department/:id
 * @access Admin
 */
export const editDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid department ID" });
    }

    const existingDept = await Department.findById(id);
    if (!existingDept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const { error, data } = validateAndNormalizeInput({ department });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const duplicate = await Department.findOne({
      department: data.department,
      _id: { $ne: id },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Another department with this name already exists",
      });
    }

    const updatedDept = await Department.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDept,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all departments
 * @route GET /api/admin/departments
 * @access Admin
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .select("_id department")
      .sort({ department: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};