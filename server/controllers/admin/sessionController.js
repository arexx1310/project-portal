//controllers/admin/sessionController.js
import mongoose from "mongoose";
import Student from "../../models/Student.js";
import User from "../../models/User.js";
import Session from "../../models/Session.js";

/**
 * @desc Create a new academic session
 * @route POST /api/admin/sessions
 * @access Admin
 */
export const createSession = async (req, res, next) => {
  try {
    const {
      name,
      academicYear,
      oddSemester,
      evenSemester,
    } = req.body;

    // Basic Required Validation
    if (
      !name ||
      !academicYear ||
      !oddSemester?.startDate ||
      !oddSemester?.endDate ||
      !evenSemester?.startDate ||
      !evenSemester?.endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All session fields are required",
      });
    }

    // Academic Year Validation
    if (!Number.isInteger(academicYear) || academicYear < 2000) {
      return res.status(400).json({
        success: false,
        message: "Invalid academic year.",
      });
    }

    // Validate Session Name Format (YYYY-YYYY)
    const expectedName = `${academicYear}-${academicYear + 1}`;

    if (name !== expectedName) {
      return res.status(400).json({
        success: false,
        message: `Session name must be '${expectedName}'.`,
      });
    }

    // Convert Dates
    const oddStart = new Date(oddSemester.startDate);
    const oddEnd = new Date(oddSemester.endDate);
    const evenStart = new Date(evenSemester.startDate);
    const evenEnd = new Date(evenSemester.endDate);

    if (
      isNaN(oddStart) || isNaN(oddEnd) ||
      isNaN(evenStart) || isNaN(evenEnd)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    const allowedStartYear = academicYear;
    const allowedEndYear = academicYear + 1;

    const allDates = [oddStart, oddEnd, evenStart, evenEnd];

    // Check if dates are withing the given year range
    for (const date of allDates) {
      const year = date.getFullYear();

      if (year !== allowedStartYear && year !== allowedEndYear) {
        return res.status(400).json({
          success: false,
          message: `All semester dates must fall within ${allowedStartYear}-${allowedEndYear}.`
        });
      }
    }

    // Ensure End Date > Start Date
    if (oddEnd <= oddStart || evenEnd <= evenStart) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    // Minimum Duration: 2 Months 
    const minDurationMs = 60 * 24 * 60 * 60 * 1000;

    if (
      (oddEnd - oddStart) < minDurationMs ||
      (evenEnd - evenStart) < minDurationMs
    ) {
      return res.status(400).json({
        success: false,
        message: "Each semester must be at least 2 months long.",
      });
    }

    // Ensure Even Semester starts after Odd Semester ends
    if (evenStart <= oddEnd) {
      return res.status(400).json({
        success: false,
        message: "Even semester must start after odd semester ends.",
      });
    }

    // Prevent Duplicate Session
    const existingSession = await Session.findOne({ academicYear }).lean();
    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: "Session for this academic year already exists.",
      });
    }

    // Create Session
    await Session.create({
      name,
      academicYear,
      oddSemester: {
        startDate: oddStart,
        endDate: oddEnd,
      },
      evenSemester: {
        startDate: evenStart,
        endDate: evenEnd,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Session created successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Activate a session (only one active at a time)
 * @route PATCH /api/admin/sessions/:id/activate
 * @access Admin
 */

export const activateSession = async (req, res, next) => {
  const mongoSession = await mongoose.startSession();

  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    await mongoSession.withTransaction(async () => {

      // Fetch requested session inside transaction
      const session = await Session.findById(id).session(mongoSession);

      if (!session) {
        return res.status(404).json({ 
          success: false,
          message: "Session not found" 
        });
      }
      

      // Check if another session is active
      const activeSession = await Session.findOne({ isActive: true })
        .session(mongoSession);

      if (activeSession && activeSession._id.toString() !== id) {
        return res.status(409).json({ 
          success: false,
          message: "Another session is currently active. Please deactivate it first." 
        });
      }

      if (session.isActive) {
        return res.status(400).json({ 
          success: false,
          message: "Session already active" 
        });
      }

      // Activate session
      session.isActive = true;
      await session.save({ session: mongoSession });

      // Activate related students' users
      const students = await Student.find({ session: session._id })
        .select("user")
        .session(mongoSession);

      const userIds = students.map((s) => s.user);

      if (userIds.length > 0) {
        await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: true } },
          { session: mongoSession }
        );
      }
    });

    res.status(200).json({
      success: true,
      message: "Session activated and related users activated.",
    });

  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
};
/**
 * @desc Deactivae a session (only one active at a time)
 * @route PATCH /api/admin/sessions/:id/deactivate
 * @access Admin
 */
export const deactivateSession = async (req, res, next) => {
  const mongoSession = await mongoose.startSession();

  try {
    const { id } = req.params;

    //Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    let modifiedUsers = 0;

    await mongoSession.withTransaction(async () => {

      //Fetch session inside transaction
      const session = await Session.findById(id).session(mongoSession);

      if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found",
        });
      }

      if (!session.isActive) {
        return res.status(400).json({
            success: false,
            message: "Session already active",
        });
      }

      //Deactivate session
      session.isActive = false;
      await session.save({ session: mongoSession });

      //Find related students
      const students = await Student.find({ session: session._id })
        .select("user")
        .session(mongoSession);

      const userIds = students.map((s) => s.user);

      // Deactivate related users only if exist
      if (userIds.length > 0) {
        const result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: false } },
          { session: mongoSession }
        );
        modifiedUsers = result.modifiedCount;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Session and all related student accounts deactivated successfully",
      modifiedUsers,
    });

  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
};

/**
 * @desc Get all sessions
 * @route GET /api/admin/sessions GET /api/admin/sessions
 * @access Admin and Faculty
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .sort({ isActive: -1, academicYear: -1 }) // Active first, then latest year first
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 
 * @desc Get the active session
 * @route GET/api/admin/sessions/active
 * @access Admin
 */
export const getActiveSession = async (req, res, next) => {
  try {
    const activeSession = await Session.getActiveSession();
    
    res.status(200).json({
      success: true,
      session: activeSession || null,
      isInitialSetup: !activeSession // Helpful flag for the UI
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 
 * @desc Get the active session
 * @route DELETE/api/admin/sessions/:id/delete
 * @access Admin
 */
export const deleteSession = async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    if (session.isActive) {
      return res.status(400).json({ success: false, message: "Deactivate session before deleting" });
    }

    await mongoSession.withTransaction(async () => {
      const students = await Student.find({ session: id })
        .select("user")
        .session(mongoSession);

      const userIds = students.map((s) => s.user);

      await Student.deleteMany({ session: id }).session(mongoSession);
      await User.deleteMany({ _id: { $in: userIds }, role: "student" }).session(mongoSession);
      await Session.deleteOne({ _id: id }).session(mongoSession);
    });

    res.status(200).json({ success: true, message: "Session and related data deleted successfully" });
  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
};