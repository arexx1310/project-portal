//controllers/admin/uploadStudent.js

import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import Department from "../../models/DepartmentConfig.js";

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
    let { programType } = req.body;                        // specialization removed

    if (typeof programType !== "string" || programType.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Program type is required",
      });
    }

    programType = programType.trim();

    if (!["btech", "mtech"].includes(programType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "ProgramType must be either BTech or MTech.",
      });
    }

    const level = programType.toLowerCase() === "btech" ? "UG" : "PG";
    const sem = level === "UG" ? 7 : 3;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // specialization body validation block removed entirely

    // Fetch department config — specializations no longer needed
    const deptConfig = await Department.findById(departmentId)
      .select("_id")
      .lean();

    if (!deptConfig) {
      return res.status(404).json({
        success: false,
        message: "Department configuration not found",
      });
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

    // "spec" is UG-only; checked per-row below
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
      .map((r) => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const rolls = normalizedRows
      .map((r) => r.rollnumber?.toString().trim())
      .filter(Boolean);

    const existingUsers = await User.find({ email: { $in: emails } }).select("email");
    const existingStudents = await Student.find({ rollNumber: { $in: rolls } }).select("rollNumber");

    const existingEmailSet = new Set(existingUsers.map((u) => u.email));
    const existingRollSet = new Set(existingStudents.map((s) => s.rollNumber));

    // 5. Prepare bulk arrays
    const usersToInsert = [];
    const studentsToInsert = [];

    let created = 0;
    let skipped = 0;
    const skipDetails = [];

    const salt = await bcrypt.genSalt(10);

    for (const row of normalizedRows) {
      // Required fields check
      const missingField = REQUIRED_FIELDS.find((f) => !row[f]);
      if (missingField) {
        skipped++;
        skipDetails.push({ row, reason: `Missing ${missingField}` });
        continue;
      }

      const name = row.name;
      const email = row.email.toLowerCase().trim();
      const rollNumber = row.rollnumber.toString().trim();
      const phoneNumber = row.phonenumber.toString().trim();

      // Per-row specialization from "Spec" column (UG only)
      const specialization =
        level === "UG" ? row.spec?.toString().trim().toUpperCase() : null;

      // Duplicate check
      if (existingEmailSet.has(email) || existingRollSet.has(rollNumber)) {
        skipped++;
        skipDetails.push({ email, reason: "Duplicate Email or Roll Number" });
        continue;
      }

      existingEmailSet.add(email);
      existingRollSet.add(rollNumber);

      // Phone validation (Indian format)
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        skipped++;
        skipDetails.push({ email, reason: "Invalid phone number" });
        continue;
      }

      const userId = new mongoose.Types.ObjectId();
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
        department: deptConfig._id,
        specialization,                  // now per-row, null for PG
        semester: sem,
        programType: level,
        session: activeSession._id,
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

    return res.status(201).json({
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