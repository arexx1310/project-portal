import mongoose from "mongoose";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import Department from "../../models/DepartmentConfig.js";
import { sendNotification } from "../notificationController.js";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates and parses date string fields in `updates` in-place.
 * Also mirrors the parsed value into `merged` so cross-field checks stay safe.
 *
 * @param {string[]}  fields   - Field names to inspect
 * @param {object}    updates  - Raw incoming update object (mutated)
 * @param {object}    merged   - existing + updates view        (mutated)
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
const parseDateFields = (fields, updates, merged) => {
  for (const field of fields) {
    if (updates[field] === undefined) continue;
    const date = new Date(updates[field]);
    if (isNaN(date.getTime())) {
      return { ok: false, message: `Invalid date for ${field}` };
    }
    updates[field] = date;
    merged[field]  = date;
  }
  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: validateDepartmentAccess
// Checks ObjectId validity + that the requesting faculty belongs to this dept.
// Returns { ok: false, status, message } on failure, { ok: true } on success.
// ─────────────────────────────────────────────────────────────────────────────
const validateDepartmentAccess = (departmentId, reqFaculty) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    return { ok: false, status: 400, message: "Invalid department ID" };
  }
  if (String(reqFaculty.department) !== String(departmentId)) {
    return {
      ok: false,
      status: 403,
      message: "Access Denied: You can only update your own department configuration",
    };
  }
  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// BTP VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates all BTP-specific business rules against the merged config view.
 * `updates`  — the incoming partial payload (may be mutated for date parsing)
 * `merged`   — { ...existingBtpConfig, ...updates }  (may be mutated for date parsing)
 *
 * Returns { ok: true } or { ok: false, status: 400, message: string }
 */
const validateBTPUpdates = (updates, merged) => {
  // ── Numeric range checks ─────────────────────────────────────────────────
  if (merged.minStudentsPerGroup !== undefined && merged.minStudentsPerGroup < 1) {
    return { ok: false, status: 400, message: "minStudentsPerGroup must be at least 1" };
  }

  if (
    merged.maxStudentsPerGroup !== undefined &&
    merged.minStudentsPerGroup !== undefined &&
    merged.maxStudentsPerGroup < merged.minStudentsPerGroup
  ) {
    return {
      ok: false,
      status: 400,
      message: "maxStudentsPerGroup must be >= minStudentsPerGroup",
    };
  }

  if (merged.maxSupervisors !== undefined && merged.maxSupervisors < 1) {
    return { ok: false, status: 400, message: "maxSupervisors must be at least 1" };
  }

  if (merged.maxGroupsPerSupervisor !== undefined && merged.maxGroupsPerSupervisor < 1) {
    return { ok: false, status: 400, message: "maxGroupsPerSupervisor must be at least 1" };
  }

  // ── Cross-department rules ───────────────────────────────────────────────
  if (updates.crossDepartmentRules) {
    const { isAllowed, minSameDepartmentStudents } = merged.crossDepartmentRules ?? {};

    if (isAllowed !== undefined && typeof isAllowed !== "boolean") {
      return {
        ok: false,
        status: 400,
        message: "crossDepartmentRules.isAllowed must be a boolean",
      };
    }

    if (
      isAllowed === true &&
      minSameDepartmentStudents !== undefined &&
      minSameDepartmentStudents > merged.maxStudentsPerGroup
    ) {
      return {
        ok: false,
        status: 400,
        message: "minSameDepartmentStudents cannot exceed maxStudentsPerGroup",
      };
    }
  }

  // ── Deadline validation ──────────────────────────────────────────────────
  // NOTE: groupCreationDeadline / supervisorSelectionDeadline / projectProposalDeadline
  // are not yet in btpConfigSchema — add them there when the session model is ready.
  const deadlineFields = [
    "groupCreationDeadline",
    "supervisorSelectionDeadline",
    "projectProposalDeadline",
  ];

  const hasDeadlineUpdate = deadlineFields.some((f) => updates[f] !== undefined);

  if (hasDeadlineUpdate) {
    const parseResult = parseDateFields(deadlineFields, updates, merged);
    if (!parseResult.ok) return { ok: false, status: 400, message: parseResult.message };

    const { groupCreationDeadline, supervisorSelectionDeadline, projectProposalDeadline } = merged;

    if (groupCreationDeadline && supervisorSelectionDeadline &&
        supervisorSelectionDeadline < groupCreationDeadline) {
      return {
        ok: false,
        status: 400,
        message: "supervisorSelectionDeadline must be after groupCreationDeadline",
      };
    }

    if (supervisorSelectionDeadline && projectProposalDeadline &&
        projectProposalDeadline < supervisorSelectionDeadline) {
      return {
        ok: false,
        status: 400,
        message: "projectProposalDeadline must be after supervisorSelectionDeadline",
      };
    }
  }

  // ── lockRecordDeadline (standalone date) ────────────────────────────────
  if (updates.lockRecordDeadline !== undefined) {
    const parseResult = parseDateFields(["lockRecordDeadline"], updates, merged);
    if (!parseResult.ok) return { ok: false, status: 400, message: parseResult.message };
  }

  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// MTP VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates all MTP-specific business rules.
 * Returns { ok: true } or { ok: false, status: 400, message: string }
 */
const validateMTPUpdates = (updates, merged) => {
  // ── Numeric range checks ─────────────────────────────────────────────────
  if (merged.maxSupervisors !== undefined && merged.maxSupervisors < 1) {
    return { ok: false, status: 400, message: "maxSupervisors must be at least 1" };
  }

  if (merged.maxStudentsPerSupervisor !== undefined && merged.maxStudentsPerSupervisor < 1) {
    return { ok: false, status: 400, message: "maxStudentsPerSupervisor must be at least 1" };
  }

  // ── Boolean check ────────────────────────────────────────────────────────
  if (updates.crossDeptisAllowed !== undefined && typeof updates.crossDeptisAllowed !== "boolean") {
    return { ok: false, status: 400, message: "crossDeptisAllowed must be a boolean" };
  }

  // ── Deadline ─────────────────────────────────────────────────────────────
  if (updates.lockRecordDeadline !== undefined) {
    const parseResult = parseDateFields(["lockRecordDeadline"], updates, merged);
    if (!parseResult.ok) return { ok: false, status: 400, message: parseResult.message };
  }

  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc  Update BTP config for a department
 * @route PATCH /api/faculty/config/:departmentId/btp
 * @access Faculty — BTP_COMMITTEE_HEAD | HOD
 */
export const updateBTPConfig = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // ── Access guard ─────────────────────────────────────────────────────────
    const access = validateDepartmentAccess(departmentId, req.faculty);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

    // ── Payload guard ────────────────────────────────────────────────────────
    if (!req.body.btpConfig || typeof req.body.btpConfig !== "object" || Array.isArray(req.body.btpConfig)) {
      return res.status(400).json({ success: false, message: "btpConfig object is required" });
    }
    const updates = req.body.btpConfig;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided for update" });
    }

    // ── Fetch + merge ────────────────────────────────────────────────────────
    const existing = await Department.findById(departmentId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Department configuration not found" });
    }
    const merged = { ...existing.btpConfig, ...updates };

    // ── Business-rule validation ─────────────────────────────────────────────
    const validation = validateBTPUpdates(updates, merged);
    if (!validation.ok) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    const dotSet = Object.fromEntries(
      Object.entries(updates).map(([k, v]) => [`btpConfig.${k}`, v])
    );

    const updatedConfig = await Department.findByIdAndUpdate(
      departmentId,
      { $set: dotSet },
      { new: true }
    )
      .select("department btpConfig")
      .lean();


    return res.status(200).json({
      success: true,
      message: "BTP configuration updated successfully",
      data: updatedConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update MTP config for a department
 * @route PATCH /api/faculty/config/:departmentId/mtp
 * @access Faculty — HOD  (MTP is PG-level; HOD sign-off makes sense)
 */
export const updateMTPConfig = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // ── Access guard ─────────────────────────────────────────────────────────
    const access = validateDepartmentAccess(departmentId, req.faculty);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

    // ── Payload guard ────────────────────────────────────────────────────────
    if (!req.body.mtpConfig || typeof req.body.mtpConfig !== "object" || Array.isArray(req.body.mtpConfig)) {
      return res.status(400).json({ success: false, message: "mtpConfig object is required" });
    }
    const updates = req.body.mtpConfig;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided for update" });
    }

    // ── Fetch + merge ────────────────────────────────────────────────────────
    const existing = await Department.findById(departmentId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Department configuration not found" });
    }

    // mtpConfig may be null if the department doesn't use PG programmes yet
    if (!existing.mtpConfig) {
      return res.status(404).json({
        success: false,
        message: "MTP configuration not set up for this department",
      });
    }

    const merged = { ...existing.mtpConfig, ...updates };

    // ── Business-rule validation ─────────────────────────────────────────────
    const validation = validateMTPUpdates(updates, merged);
    if (!validation.ok) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    const dotSet = Object.fromEntries(
      Object.entries(updates).map(([k, v]) => [`mtpConfig.${k}`, v])
    );

    const updatedConfig = await Department.findByIdAndUpdate(
      departmentId,
      { $set: dotSet },
      { new: true }
    )
      .select("department mtpConfig")
      .lean();

   

    return res.status(200).json({
      success: true,
      message: "MTP configuration updated successfully",
      data: updatedConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get full department config (BTP + MTP) for logged-in faculty's department
 * @route GET /api/faculty/config
 * @access All faculty
 */
export const getDepartmentConfig = async (req, res, next) => {
  try {
    const departmentId = req.faculty.department;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Invalid department reference" });
    }

    const config = await Department.findById(departmentId)
      .select("_id department btpConfig mtpConfig")
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found for your department",
      });
    }

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};