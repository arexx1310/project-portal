//controllers/admin/uploadStudent.js
import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import DepartmentConfig from "../../models/DepartmentConfig.js";

export const uploadStudents = async (req, res, next) => {
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
    let { specialization } = req.body;

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
    
    // specialization required
    if (typeof specialization !== "string" || specialization.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Specialization is required",
      });
    }

    specialization = specialization.trim().toUpperCase();

    // Fetch department config
    const deptConfig = await DepartmentConfig.findById(departmentId)
      .select("_id specializations")
      .lean();

    if (!deptConfig) {
      return res.status(404).json({
        success: false,
        message: "Department configuration not found",
      });
    }

    if (
      Array.isArray(deptConfig.specializations) &&
      deptConfig.specializations.length > 0
    ) {

      const normalizedSpecs = deptConfig.specializations.map(s =>
        s.trim().toUpperCase()
      );

      if (!normalizedSpecs.includes(specialization)) {
        return res.status(400).json({
          success: false,
          message: `Invalid specialization. Allowed: ${normalizedSpecs.join(", ")}`,
        });
      }
    }

    // 2. Active session
    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: "No active session available.",
      });
    }

    // 3. Read Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    const REQUIRED_FIELDS = ["name", "email", "phonenumber", "rollnumber"];

    // Normalize keys
    const normalizedRows = rows.map((row) => {
      const obj = {};
      Object.keys(row).forEach((key) => {
        obj[key.toLowerCase().trim()] = row[key];
      });
      return obj;
    });

    // 4. Prefetch existing emails & rolls
    const emails = normalizedRows
      .map(r => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const rolls = normalizedRows
      .map(r => r.rollnumber?.toString().trim())
      .filter(Boolean);

    const existingUsers = await User.find({ email: { $in: emails } }).select("email");
    const existingStudents = await Student.find({ rollNumber: { $in: rolls } }).select("rollNumber");

    const existingEmailSet = new Set(existingUsers.map(u => u.email));
    const existingRollSet = new Set(existingStudents.map(s => s.rollNumber));

    // 5. Prepare bulk arrays
    const usersToInsert = [];
    const studentsToInsert = [];

    let created = 0;
    let skipped = 0;
    const skipDetails = [];

    // Salt once (performance optimization)
    const salt = await bcrypt.genSalt(10);

    for (const row of normalizedRows) {
      // Required fields check
      const missingField = REQUIRED_FIELDS.find(f => !row[f]);
      if (missingField) {
        skipped++;
        skipDetails.push({ row, reason: `Missing ${missingField}` });
        continue;
      }

      const name = row.name;
      const email = row.email.toLowerCase().trim();
      const rollNumber = row.rollnumber.toString().trim();
      const phoneNumber = row.phonenumber.toString().trim();

      // Duplicate check
      if (existingEmailSet.has(email) || existingRollSet.has(rollNumber)) {
        skipped++;
        skipDetails.push({ email, reason: "Duplicate Email or Roll Number" });
        continue;
      }

      // Phone validation (Indian format)
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        skipped++;
        skipDetails.push({ email, reason: "Invalid phone number" });
        continue;
      }

      // Admission year
      const admissionYear = activeSession.academicYear - 3;

      const userId = new mongoose.Types.ObjectId();

      // Hash roll number as password
      const hashedPassword = await bcrypt.hash(rollNumber, salt);

      usersToInsert.push({
        _id: userId,
        name,
        email,
        password: hashedPassword,
        role: "student",
        isActive: true,
      });

      studentsToInsert.push({
        user: userId,
        rollNumber,
        phoneNumber,
        admissionYear,
        departmentConfig: deptConfig._id,
        specialization: specialization || null,
        semester: 7,
        session: activeSession._id,
        isAvailableForInvite: true,
      });
      created++;
    }

    // 6. Bulk insert with transaction
    dbSession.startTransaction();

    try {
      if (usersToInsert.length > 0) {
        await User.insertMany(usersToInsert, { session: dbSession });
        await Student.insertMany(studentsToInsert, { session: dbSession });
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
      summary: {
        totalRows: rows.length,
        created,
        skipped,
        details: skipDetails,
      },
    });

  } catch (error) {
    dbSession.endSession();
    next(error);
  }
};
