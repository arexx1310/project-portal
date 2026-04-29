import Group from "../../models/Group.js";
import Faculty from "../../models/Faculty.js";
import Student from "../../models/Student.js";
import Session from "../../models/Session.js";
import XLSX from "xlsx";
import mongoose from "mongoose";

export const exportUngroupedStudentsExcel = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const departmentId = req.faculty.departmentConfig;
    const activeSession = await Session.getActiveSession();

    const students = await Student.find({
      departmentConfig: departmentId,
      session: activeSession._id,
      groupId: null,
      isAvailableForInvite: true
    })
      .populate("user", "name email")
      .sort({rollNumber: 1})
      .lean();

    // Format data for Excel
    const data = students.map((s) => ({
      RollNumber: s.rollNumber,
      Name: s.user?.name || "",
      Email: s.user?.email || "",
      Semester: s.semester,
      Specialization: s.specialization || "",
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ungrouped Students");

    // Convert to buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Send file
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Ungrouped_Students.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (error) {
    next(error);
  }
};

export const exportUnsupervisedGroupsExcel = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const departmentId = req.faculty.departmentConfig;

    // Active session
    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: "Active session not found",
      });
    }

    const sessionId = activeSession._id;

    /* ======================
       Aggregation
    ====================== */

    const groups = await Group.aggregate([
      {
        $match: {
          departmentConfig: new mongoose.Types.ObjectId(departmentId),
          session: new mongoose.Types.ObjectId(sessionId),
          supervisors: { $size: 0 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "groupId",
          as: "students",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "students.user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          groupName: "$name",
          students: 1,
          userDetails: 1,
        },
      },
    ]);

    /* ======================
       Flatten Data
    ====================== */

    const rows = [];

    groups.forEach((group) => {
      group.students.forEach((student) => {
        const user = group.userDetails.find(
          (u) => u._id.toString() === student.user.toString()
        );

        rows.push({
          "Student Name": user ? user.name : "N/A",
          "Roll Number": student.rollNumber,
          "Group Name": group.groupName,
        });
      });
    });

    /* ======================
       Create Excel using XLSX
    ====================== */

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unsupervised Groups");

    // Write to buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    /* ======================
       Send File
    ====================== */

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Unsupervised_Groups.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportFullGroupsDataExcel = async (req, res, next) => {
  try {
    if (!req.faculty || !req.faculty.departmentConfig) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const departmentId = new mongoose.Types.ObjectId(
      req.faculty.departmentConfig
    );

    const activeSession = await Session.getActiveSession();
    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: "Active session not found",
      });
    }

    const sessionId = activeSession._id;

    const groups = await Group.aggregate([
      {
        $match: {
          departmentConfig: departmentId,
          session: sessionId,
          status: { $ne: "Draft" },
        },
      },
      {
        $lookup: {
          from: "faculties",
          localField: "supervisors",
          foreignField: "_id",
          as: "supervisors",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "supervisors.user",
          foreignField: "_id",
          as: "supervisorUsers",
        },
      },
      {
        $lookup: {
          from: "departmentconfigs",
          localField: "supervisors.departmentConfig",
          foreignField: "_id",
          as: "supervisorDepartments",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "groupId",
          as: "students",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "students.user",
          foreignField: "_id",
          as: "studentUsers",
        },
      },
      {
        $lookup: {
          from: "departmentconfigs",
          localField: "students.departmentConfig",
          foreignField: "_id",
          as: "studentDepartments",
        },
      },
    ]);

    // Format and sort by first supervisor name (mirrors getFullGroupsData)
    const formatted = groups
      .map((g) => ({
        groupName: g.name,
        supervisors: g.supervisors.map((sup) => {
          const user = g.supervisorUsers.find(
            (u) => u._id.toString() === sup.user.toString()
          );
          const dept = g.supervisorDepartments.find(
            (d) => d._id.toString() === sup.departmentConfig.toString()
          );
          return { name: user?.name, department: dept?.department };
        }),
        students: g.students.map((s) => {
          const user = g.studentUsers.find(
            (u) => u._id.toString() === s.user.toString()
          );
          const dept = g.studentDepartments.find(
            (d) => d._id.toString() === s.departmentConfig.toString()
          );
          return {
            name: user?.name,
            rollNumber: s.rollNumber,
            department: dept?.department,
            specialization: s.specialization,
            semester: s.semester,
          };
        }),
      }))
      .sort((a, b) =>
        (a.supervisors[0]?.name || "").localeCompare(
          b.supervisors[0]?.name || ""
        )
      );

    /* ======================
       Flatten into rows
       One row per student; supervisor columns repeat for the group.
    ====================== */

    const rows = [];

    formatted.forEach((group) => {
      const supervisorNames = group.supervisors
        .map((s) => s.name || "N/A")
        .join(", ");
      const supervisorDepts = group.supervisors
        .map((s) => s.department || "N/A")
        .join(", ");

      group.students.forEach((student) => {
        rows.push({
          "Group Name": group.groupName,
          "Supervisor(s)": supervisorNames,
          "Supervisor Department(s)": supervisorDepts,
          "Student Name": student.name || "N/A",
          "Roll Number": student.rollNumber || "N/A",
          "Student Department": student.department || "N/A",
          Specialization: student.specialization || "N/A",
          Semester: student.semester || "N/A",
        });
      });
    });

    /* ======================
       Create Excel
    ====================== */

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Groups");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    /* ======================
       Send File
    ====================== */

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Full_Groups_Data.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};