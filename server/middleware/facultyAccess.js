import Faculty from "../models/Faculty.js";
import mongoose from "mongoose";

/**
 * Attaches faculty profile to req.faculty from the verified token.
 * No DB hit — facultyId, department, roles are embedded at login.
 */
export const attachFacultyProfile = (req, res, next) => {
  const { facultyId, department, roles } = req.user;

  if (!facultyId) {
    return res.status(404).json({ success: false, message: "Faculty profile not found." });
  }

  req.faculty = { id: facultyId, department, roles: roles ?? [] };
  next();
};

/**
 * Checks for faculty sub-roles.
 * attachFacultyProfile must run BEFORE this.
 */
export const authorizeFacultyRoles =
  (...allowedRoles) =>
  (req, res, next) => {
  
    if (!req.faculty) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Faculty profile not found in request",
      });
    }


    if (!Array.isArray(req.faculty.roles)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: No roles assigned",
      });
    }

    if (!allowedRoles.length) {
      return res.status(500).json({
        success: false,
        message: "Role authorization misconfigured",
      });
    }

    const hasRole = req.faculty.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Required faculty role not found",
      });
    }

    next();
  };