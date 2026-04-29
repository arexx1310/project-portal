import express from "express";

import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
import { updatePassword } from "../controllers/authController.js";

import { 
  createDepartment,
  getDepartments,
  editDepartment
 } from "../controllers/admin/departmenController.js";

// Session controllers
import {
  createSession,
  activateSession,
  getSessions,
  getActiveSession,
  deleteSession,
  deactivateSession
} from "../controllers/admin/sessionController.js";

// Student controllers
import { uploadStudents } from "../controllers/admin/uploadStudent.js";
import {
  getStudents,
  updateStudent,
  deleteStudent,
  getStudentStats,
  bulkDeleteStudents,
} from "../controllers/admin/studentController.js";

// Faculty controllers
import { uploadFaculty } from "../controllers/admin/uploadFaculty.js";
import {
  getFaculty,
  updateFaculty,
  deleteFaculty,
  bulkDeleteFacultyByDepartment,
  getFacultyStats,
} from "../controllers/admin/facultyController.js";

// Multer (for Excel uploads)
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.post("/updatePassword",updatePassword);

/* ================= DEPARTMENTS ================= */
router.get("/departments", getDepartments);
router.post("/department", createDepartment);
router.put("/department/:id", editDepartment);


/* ================= SESSION ================= */
router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.get("/sessions/active", getActiveSession);
router.patch("/sessions/:id/activate", activateSession);
router.patch("/sessions/:id/deactivate",deactivateSession)
router.delete("/sessions/:id/delete",deleteSession);

/* ================= STUDENTS ================= */
router.post("/upload/students/:departmentId", upload.single("file"), uploadStudents);
router.get("/students", getStudents);
router.get("/students/stats", getStudentStats);
router.put("/students/:id", updateStudent);
router.delete("/students/bulkdelete/:departmentId/:sessionId",bulkDeleteStudents);
router.delete("/students/:id", deleteStudent);


/* ================= FACULTY ================= */
router.post("/upload/faculty/:departmentId", upload.single("file"), uploadFaculty);
router.get("/faculty", getFaculty);
router.get("/faculty/stats",getFacultyStats);
router.put("/faculty/:id", updateFaculty);
router.delete("/faculty/bulkdelete/:departmentId", bulkDeleteFacultyByDepartment);
router.delete("/faculty/:id", deleteFaculty);



export default router;
