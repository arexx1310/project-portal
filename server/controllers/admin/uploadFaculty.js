//controllers/admin/uploadFaculty.js

// Checked

import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../../models/User.js";
import Faculty from "../../models/Faculty.js";
import Department from "../../models/DepartmentConfig.js";

/**
 * @desc Upload faculty via Excel (Admin only)
 * @route POST /api/admin/upload/faculty
 */
export const uploadFaculty = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  try {
    // 1. File validation
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const { departmentId } = req.params;

    // Validate form data
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    // ObjectId validation (prevents Mongo crash)
        if (!mongoose.Types.ObjectId.isValid(departmentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid department ID",
          });
        }

    // Fetch department config
    const deptConfig = await Department.findById(departmentId)
      .select("_id").lean();

    if (!deptConfig) {
      return res.status(404).json({
        success: false,
        message: "Department configuration not found",
      });
    }

    // Read Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    const REQUIRED_FIELDS = ["name", "email", "phonenumber", "staffid"];

    // Normalize rows
    const normalizedRows = rows.map((row) => {
      const obj = {};
      Object.keys(row).forEach((key) => {
        obj[key.toLowerCase().replace(/\s/g, "")] = row[key];
      });
      return obj;
    });

    // Prefetch existing emails & staffIds
    const emails = normalizedRows
      .map(r => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const staffIds = normalizedRows
      .map(r => r.staffid?.toString().trim().toUpperCase())
      .filter(Boolean);

    const existingUsers = await User.find({ email: { $in: emails } }).select("email");
    const existingFaculty = await Faculty.find({ staffId: { $in: staffIds } }).select("staffId");

    const existingEmailSet = new Set(existingUsers.map(u => u.email));
    const existingStaffSet = new Set(existingFaculty.map(f => f.staffId));

    // Prepare bulk arrays
    const usersToInsert = [];
    const facultyToInsert = [];

    let created = 0;
    let skipped = 0;
    const errors = [];

    // Generate salt once (performance)
    const salt = await bcrypt.genSalt(10);

    for (const row of normalizedRows) {
      // Required field check
      const missingField = REQUIRED_FIELDS.find(f => !row[f]);
      if (missingField) {
        skipped++;
        errors.push(`Missing ${missingField}`);
        continue;
      }

      const name = row.name;
      const email = row.email.toLowerCase().trim();
      const phoneNumber = row.phonenumber.toString().trim();
      const staffId = row.staffid.toString().trim().toUpperCase();

      // Duplicate check
      if (existingEmailSet.has(email) || existingStaffSet.has(staffId)) {
        skipped++;
        errors.push(`${name}: Duplicate ${email} or ${staffId} present in registry.`);
        continue;
      }

      // Phone validation (Indian format)
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        skipped++;
        errors.push(`${name}: Invalid phone: ${phoneNumber}`);
        continue;
      }

      const userId = new mongoose.Types.ObjectId();

      const rawPassword = staffId + "@PROF";
      // 🔐 Password = staffId (hashed)
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      usersToInsert.push({
        _id: userId,
        name,
        email,
        password: hashedPassword,
        role: "faculty",
        isActive: true,
      });

      facultyToInsert.push({
        user: userId,
        staffId,
        phoneNumber,
        department: deptConfig._id,
        roles: [],
      });

      created++;
    }

    // Bulk insert with transaction
    dbSession.startTransaction();

    try {
      if (usersToInsert.length > 0) {
        await User.insertMany(usersToInsert, { session: dbSession });
        await Faculty.insertMany(facultyToInsert, { session: dbSession });
      }

      await dbSession.commitTransaction();
    } catch (err) {
      await dbSession.abortTransaction();
      throw err;
    } finally {
      dbSession.endSession();
    }

    res.status(201).json({
      success: true,
      message: "Faculty upload completed",
      summary: {
        totalRows: rows.length,
        created,
        skipped,
        errors: errors,
      },
    });

  } catch (error) {
    dbSession.endSession();
    next(error);
  }
};
