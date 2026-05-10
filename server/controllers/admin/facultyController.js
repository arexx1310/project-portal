import Faculty from "../../models/Faculty.js";
import User from "../../models/User.js";
import mongoose from "mongoose";


/**
 * @desc Get all faculty with optimized query
 * @route GET /api/admin/faculty
 * @access Admin
 */
export const getFaculty = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const { departmentId, search } = req.query;

    const query = {};

    if (departmentId && departmentId !== "All") {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid departmentId",
        });
      }
      query.department = departmentId;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { staffId: { $regex: searchRegex } },
      ];
    }

    const [faculty, total] = await Promise.all([
      Faculty.find(query)
        .populate({
          path: "user",
          select: "name email isActive role",
          match: search
            ? {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                ],
              }
            : undefined,
        })
        .select("staffId roles user department")
        .populate("department", "department")
        .sort({ staffId: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Faculty.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      page,
      total,
      count: faculty.length,
      data: faculty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get faculty statistics
 * @route GET /api/admin/faculty/stats
 * @access Admin
 */
export const getFacultyStats = async (req, res, next) => {
  try {
    const totalFaculty = await Faculty.countDocuments();

    const byDepartment = await Faculty.aggregate([
      {
        $lookup: {
          from: "departments", // ← was "department"
          localField: "department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $group: {
          _id: "$dept.department",
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: "$_id", count: 1 } },
      { $sort: { department: 1 } },
    ]);

    const byRole = await Faculty.aggregate([
      { $unwind: "$roles" },
      {
        $group: {
          _id: "$roles",
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, role: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    const withSpecialRoles = await Faculty.countDocuments({
      roles: { $exists: true, $ne: [] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalFaculty,
        byDepartment,
        byRole,
        withSpecialRoles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update faculty special access role
 * @route PUT /api/admin/faculty/:id
 * @access Admin
 */
export const updateFaculty = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid faculty ID" });
    }

    const updateData = {};
    const VALID_ROLES = ["HOD", "BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER"];
    const roleLabels = {
      HOD: "Head of Department",
      BTP_COMMITTEE_HEAD: "BTP Committee Head",
      BTP_COMMITTEE_MEMBER: "BTP Committee Member",
    };

    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return res.status(400).json({ success: false, message: "Roles must be an array" });
      }
      const invalidRoles = roles.filter(r => !VALID_ROLES.includes(r));
      if (invalidRoles.length) {
        return res.status(400).json({ success: false, message: `Invalid roles: ${invalidRoles.join(", ")}` });
      }
      updateData.roles = [...new Set(roles)];
    }

    session.startTransaction();

    const faculty = await Faculty.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true,
      session 
    })
      .populate("user", "name email isActive role")
      .populate("department", "department")
      .lean();

    if (!faculty) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      success: true, 
      message: "Faculty updated successfully", 
      data: faculty
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc Delete faculty and linked user (with transaction)
 * @route DELETE /api/admin/faculty/:id
 * @access Admin
 */
export const deleteFaculty = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    session.startTransaction();

    const faculty = await Faculty.findById(id)
      .select("user")
      .session(session);

    if (!faculty) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    await Faculty.deleteOne({ _id: id }).session(session);
    await User.deleteOne({ _id: faculty.user }).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Faculty and linked user deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @desc Bulk delete faculty and linked user (with transaction)
 * @route DELETE /api/admin/faculty/bulkdelete
 * @access Admin
 */

export const bulkDeleteFacultyByDepartment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    session.startTransaction();

    const facultyList = await Faculty.find({
      department: departmentId,
    })
      .select("_id user")
      .session(session);

    if (!facultyList.length) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "No faculty found for this department",
      });
    }

    const facultyIds = facultyList.map(f => f._id);
    const userIds = facultyList.map(f => f.user);

    await Faculty.deleteMany({ _id: { $in: facultyIds } }).session(session);
    await User.deleteMany({ _id: { $in: userIds } }).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `${facultyIds.length} faculty deleted successfully`,
      deletedCount: facultyIds.length,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};




