import Student from "../models/Student.js";
import mongoose from "mongoose";

/**
 * Attaches student profile to req.student from the verified token.
 * No DB hit — studentId, department, session, semester, groupId are embedded at login.
 */
export const attachStudentProfile = (req, res, next) => {
  const { studentId, department, session, semester, groupId, isPG } = req.user;

  if (!studentId) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  req.student = { id: studentId, department, session, semester, groupId: groupId ?? null, isPG };
  next();
};

/**
 * requireProgram("PG") → blocks UG students
 * requireProgram("UG") → blocks PG students
 */
export const requireProgram = (programType) => (req, res, next) => {
  const isPG = req.student?.isPG;
  const allowed = programType === "PG" ? isPG : !isPG;

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: `This route is for ${programType} students only.`,
    });
  }
  next();
};