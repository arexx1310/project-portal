import Student from "../models/Student.js";
import mongoose from "mongoose";

/**
 * Attaches student profile to req.student.
 * Used for all student routes.
 */
export const attachStudentProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized. No user identity attached."
        })
    }
    
    const student = await Student
      .findOne({ user: req.user.id })
      .select("session departmentConfig")
      .lean();

    if (!student || !student._id) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    req.student = {
      id:               student._id,
      departmentConfig: student.departmentConfig,
      session : student.session
    };

    next();
  } catch (error) {
    next(error);
  }
};