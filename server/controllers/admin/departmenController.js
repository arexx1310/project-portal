// controllers/admin/departmentController.js
import mongoose from "mongoose";
import Department from "../../models/DepartmentConfig.js";

// Checked

const validateAndNormalizeInput = ({
  department,
  specializations,
}) => {
  const result = {};

  // Validate & normalize department
  if (department !== undefined) {
    if (typeof department !== "string" || department.trim().length === 0) {
      return { error: "Department name must be a valid string" };
    }

    result.department = department.trim().toUpperCase();
  } else {
    return { error: "Department name is required" };
  }

  // Validate & normalize specializations
  if (specializations !== undefined) {
    if (!Array.isArray(specializations) || specializations.length === 0) {
      return { error: "Specializations must be a non-empty array" };
    }

    const normalizedSpecs = specializations
      .map((spec) => spec.trim().toUpperCase())
      .filter((spec) => spec.length > 0);

    result.specializations = [...new Set(normalizedSpecs)];
  } else {
    return { error: "At least one specialization is required" };
  }

  return { data: result };
};

/**
 * @desc Create department with specializations
 * @route POST /api/admin/department
 * @access Admin
 */
export const createDepartment = async (req, res, next) => {
  try {
    // Received data containing departmnet name (string) and specializations as an array of strings
    const { department, specializations } = req.body;

    const { error, data } = validateAndNormalizeInput({
      department,
      specializations,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const { department: deptName, specializations: normalizedSpecs } = data;

    // Check if department already exists
    const existingDept = await Department.findOne({
      department: deptName,
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: "Department already exists",
      });
    }

    // Default deadlines(30 days after the current date)
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);

    // Create department with default config
   const departmentDoc = await Department.create({
      department: deptName,
      specializations: [...new Set(normalizedSpecs)],
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
        }
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
 * @desc Create department with specializations
 * @route PUT /api/admin/department/:id
 * @access Admin
 */
export const editDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department, specializations } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // Find existing department
    const existingDept = await Department.findById(id);

    if (!existingDept) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    //  Use reusable validator
    const { error, data } = validateAndNormalizeInput({
      department,
      specializations,
      isUpdate: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    let updatedFields = { ...data };

    //  Check duplicate only if department is being updated
    if (updatedFields.department) {
      const duplicate = await Department.findOne({
        department: updatedFields.department,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another department with this name already exists",
        });
      }
    }

    // If nothing to update
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Perform update
    const updatedDept = await Department.findByIdAndUpdate(
      id,
      { $set: updatedFields },
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
 * @desc Get list of exisiting departments with their specializations
 * @route GET /api/admin/departments
 * @access Admin
 */
export const getDepartments = async (req, res, next) => {
  try {
    // Get all available departments in database
    const departments = await Department.find()
      .select("_id department specializations")
      .sort({ department: 1 })
      .lean(); 

    res.status(200).json({
      success: true,
      count: departments.length,//Number of departments
      data: departments, // Departments data array
    });
  } catch (error) {
    next(error);
  }
};