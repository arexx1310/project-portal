import Faculty from "../models/Faculty.js";
import mongoose from "mongoose";

/**
 * Attaches faculty profile to req.faculty.
 * Used for all faculty routes.
 */
export const attachFacultyProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized. No user identity attached."
        })
    }
    const faculty = await Faculty
      .findOne({ user: req.user.id })
      .select("departmentConfig roles")
      .lean();

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    // Validate departmentConfig ObjectId
    if (
      !faculty.departmentConfig ||
      !mongoose.Types.ObjectId.isValid(faculty.departmentConfig)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid department configuration reference",
      });
    }

    req.faculty = {
      id: faculty._id,
      departmentConfig: faculty.departmentConfig,
      roles: faculty.roles,
    };

    next();
  } catch (error) {
    next(error);
  }
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