import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Project from "../../models/Project.js";
import Group from "../../models/Group.js";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Department from "../../models/DepartmentConfig.js";

/**
 * @desc Get students with filters (session, department, pagination)
 * @route GET /api/admin/students?session=xxx&department=xxx&page=1&limit=20
 * @access Admin
 */

export const getStudents = async (req, res, next) => {
  try {
    let { search, session, department, page, limit } = req.query;

    // Pagination safety
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (page - 1) * limit;

    let filter = {}

    // Session filter
    if (session) {

      // ObjectId validation
      if (!mongoose.Types.ObjectId.isValid(session)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      filter.session = new mongoose.Types.ObjectId(session);

    } else {
      // Only fetch active session if not provided
      const activeSession = await Session.getActiveSession();
      if (!activeSession) {
        return res.status(404).json({
          success: false,
          message: "No active session found",
        });
      }
      filter.session = activeSession._id;
    }

  
    if (department) {
      // Added missing validation
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }
      filter.department = new mongoose.Types.ObjectId(department);
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: filter },

      // Join User details
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },

      // Join DepartmentConfig to get department name
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
    ];

    // Search filter
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      pipeline.push({
        $match: {
          $or: [
            { "userDetails.name": { $regex: safeSearch, $options: "i" } },
            { "userDetails.email": { $regex: safeSearch, $options: "i" } },
            { rollNumber: { $regex: safeSearch, $options: "i" } },
          ],
        },
      });
    }

    // Pagination + count using $facet (single DB call)
    const result = await Student.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [
            { $sort: { rollNumber: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                rollNumber: 1,
                phoneNumber: 1,
                semester: 1,
                specialization: 1,
                department: "$dept.department",
                departmentId: "$dept._id",
                user: {
                  name: "$userDetails.name",
                  email: "$userDetails.email",
                },
              },
            },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const students = result[0].data;
    const total = result[0].totalCount[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update student (email, name, rollNumber, phoneNumber)
 * @route PUT /api/admin/students/:id
 * @access Admin
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { email, name, rollNumber, phoneNumber } = req.body;

    // ================= 1. Validate ID =================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    // ================= 2. Check required fields =================
    if (!email || !name || !rollNumber || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: email, name, rollNumber, phoneNumber",
      });
    }

    // ================= 3. Type validation =================
    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof rollNumber !== "string" ||
      typeof phoneNumber !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields must be strings",
      });
    }

    // ================= 4. Sanitize =================
    email = email.trim().toLowerCase();
    name = name.trim();
    rollNumber = rollNumber.trim();
    phoneNumber = phoneNumber.trim();

    // ================= 5. Format validation =================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/; // Indian format
    const rollRegex = /^[a-zA-Z0-9_-]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number (must be 10 digits)",
      });
    }

    if (!rollRegex.test(rollNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roll number format",
      });
    }

    // ================= 6. Find student =================
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // ================= 7. Update Student =================
    student.rollNumber = rollNumber;
    student.phoneNumber = phoneNumber;
    await student.save();

    // ================= 8. Update User =================
    await User.findByIdAndUpdate(
      student.user,
      { email, name },
      { new: true, runValidators: true }
    );

    // ================= 9. Fetch updated =================
    const updatedStudent = await Student.findById(id)
      .populate("user", "name email")
      .populate("session", "name academicYear")
      .populate("department", "department")
      .lean();

    return res.status(200).json({
      success: true,
      data: updatedStudent,
      message: "Student updated successfully",
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc Bulk delete student by department
 * @route DELETE /api/admin/students/bulkdelete/:departmentId/:sessionId
 * @access Admin
 */
export const bulkDeleteStudents = async (req, res, next) => {
  const dbSession = await mongoose.startSession();

  try {
    const { departmentId, sessionId, semester} = req.params;

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(departmentId) ||
      !mongoose.Types.ObjectId.isValid(sessionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid departmentId or sessionId",
      });
    }

    dbSession.startTransaction();

    // Get students for given filters
    const students = await Student.find({
      department: departmentId,
      session: sessionId,
    })
      .select("_id user groupId")
      .session(dbSession);

    if (!students.length) {
      await dbSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "No students found",
      });
    }

    const studentIds = students.map(s => s._id);
    const userIds = students.filter(s => s.user).map(s => s.user);
    const groupIds = students.map(s=> s.groupId);



    // Delete students + linked users
    await Student.deleteMany({ _id: { $in: studentIds } }).session(dbSession);
  
    if (userIds.length) {
      await User.deleteMany({ _id: { $in: userIds } }).session(dbSession);
    }
    if (groupIds.length) {
      await Group.deleteMany({_id: {$in: groupIds}}).session(dbSession);
      await Project.deleteMany({group: {$in: groupIds}}).session(dbSession);
    }
    
    await dbSession.commitTransaction();

    res.status(200).json({
      success: true,
      deletedCount: studentIds.length,
      message: `${studentIds.length} students deleted successfully`,
    });

  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};


/**
 * @desc Get student statistics
 * @route GET /api/admin/students/stats?session=xxx
 * @access Admin
 */
export const getStudentStats = async (req, res, next) => {
  try {
    const { session } = req.query;

    let targetSessionId;

    if (session) {
      if (!mongoose.Types.ObjectId.isValid(session)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session id",
        });
      }

      targetSessionId = session;
    } else {
      // Only fetch active session if no query provided
      const activeSession = await Session.getActiveSession();
      targetSessionId = activeSession?._id;
    }

    // If no session available
    if (!targetSessionId) {
      const totalStudents = await Student.countDocuments();

      return res.status(200).json({
        success: true,
        data: {
          totalInSession: 0,
          targetSession: null,
          byDepartment: [],
          activeStudents: 0,
          totalStudents,
        },
      });
    }

    const sessionInfo = await Session.findById(targetSessionId)
      .select("name academicYear isActive")
      .lean();

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const activeSession = sessionInfo.isActive
      ? sessionInfo
      : await Session.getActiveSession(); // only needed if different

    // Counts (parallel for speed)
    const [
      totalInSession,
      totalStudents,
      activeStudents,
      byDepartment,
    ] = await Promise.all([
      Student.countDocuments({ session: targetSessionId }),
      Student.countDocuments(),
      activeSession
        ? Student.countDocuments({ session: activeSession._id })
        : 0,
      Student.aggregate([
        { $match: { session: new mongoose.Types.ObjectId(targetSessionId) } },
        {
          $lookup: {
            from: "departmentconfigs",
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
        {
          $project: {
            _id: 0,
            department: "$_id",
            count: 1,
          },
        },
        { $sort: { department: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInSession,
        targetSession: {
          _id: sessionInfo._id,
          name: sessionInfo.name,
          academicYear: sessionInfo.academicYear,
          isActive: sessionInfo.isActive,
        },
        byDepartment,
        activeStudents,
        totalStudents,
      },
    });
    
  } catch (error) {
    next(error);
  }
};