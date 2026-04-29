// controllers/admin/departmentController.js
import DepartmentConfig from "../../models/DepartmentConfig.js";

/**
 * @desc Create department with specializations
 * @route POST /api/admin/department
 * @access Admin
 */
export const createDepartment = async (req, res, next) => {
  try {
    // Received data containing departmnet name (string) and specializations as an array of strings
    const { department, specializations } = req.body;

    // Validate received input
     if (
      typeof department !== "string" ||
      department.trim().length === 0 ||
      !Array.isArray(specializations) ||
      specializations.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department name must be a string and at least one specialization is required.",
      });
    }

    // Create normalized department and specializations string all to upper case
    const deptName = department.trim().toUpperCase();

    const normalizedSpecs = specializations
      .map(spec => spec.trim().toUpperCase())
      .filter(spec => spec.length > 0);
    

    // Check if department already exists
    const existingDept = await DepartmentConfig.findOne({
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
   const departmentDoc = await DepartmentConfig.create({
      department: deptName,
      specializations: [...new Set(normalizedSpecs)],
      btpConfig: {
        minStudentsPerGroup: 1,
        maxStudentsPerGroup: 4,
        minSupervisors: 1,
        maxSupervisors: 2,
        maxGroupsPerSupervisor: 5,
        groupCreationDeadline: defaultDeadline,
        supervisorSelectionDeadline: defaultDeadline,
        projectProposalDeadline: defaultDeadline,
        isActive: true,

        crossDepartmentRules: {
          isAllowed: true,
          minSameDepartmentStudents: 2,
        },
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
    const existingDept = await DepartmentConfig.findById(id);

    if (!existingDept) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    let updatedFields = {};

    // Update department name (if provided)
    if (department !== undefined) {
      if (typeof department !== "string" || department.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Department name must be a valid string",
        });
      }

      const deptName = department.trim().toUpperCase();

      // Check for duplicate (excluding current doc)
      const duplicate = await DepartmentConfig.findOne({
        department: deptName,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another department with this name already exists",
        });
      }

      updatedFields.department = deptName;
    }

    // ✅ Update specializations (if provided)
    if (specializations !== undefined) {
      if (
        !Array.isArray(specializations) ||
        specializations.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Specializations must be a non-empty array",
        });
      }

      const normalizedSpecs = specializations
        .map((spec) => spec.trim().toUpperCase())
        .filter((spec) => spec.length > 0);

      updatedFields.specializations = [...new Set(normalizedSpecs)];
    }

    // If nothing to update
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Perform update
    const updatedDept = await DepartmentConfig.findByIdAndUpdate(
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
    const departments = await DepartmentConfig.find()
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