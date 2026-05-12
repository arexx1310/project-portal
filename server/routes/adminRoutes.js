import express from "express";

// Middlewares
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
// Multer (for Excel uploads)
import upload from "../middleware/upload.js";

// Controllers

import { updatePassword } from "../controllers/authController.js";

// Department Information Controllers for Admin
import { 
  createDepartment,
  getDepartments,
  editDepartment
 } from "../controllers/admin/departmenController.js";

// Session Information Controllers
import {
  createSession,
  getSessions,
  getActiveSession,
  deleteSession,
  activateSession,
  activateStudents,
  deactivateStudents,
} from "../controllers/admin/sessionController.js";

// Student Information controllers
import { uploadStudents } from "../controllers/admin/uploadStudent.js";
import {
  getStudents,
  updateStudent,
  getStudentStats,
  bulkDeleteStudents,
} from "../controllers/admin/studentController.js";

// Faculty Information controllers
import { uploadFaculty } from "../controllers/admin/uploadFaculty.js";
import {
  getFaculty,
  updateFaculty,
  deleteFaculty,
  bulkDeleteFacultyByDepartment,
  getFacultyStats,
} from "../controllers/admin/facultyController.js";



// Express Router
const router = express.Router();


// Use middlewares protect and authorize only admin for these routes below
router.use(protect, authorize("admin"));


/* ================= User Info Routes ================= */
router.put("/updatePassword",updatePassword);

/* ================= DEPARTMENTS ================= */
router.get("/departments", getDepartments);
router.post("/department", createDepartment);
router.put("/department/:id", editDepartment);


/* ================= SESSION ================= */
router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.get("/sessions/active", getActiveSession);
router.patch("/sessions/:id/activate",activateSession);
router.delete("/sessions/:id/delete",deleteSession);




// ================= STUDENTS ================= */
router.patch("/sessions/:id/deactivate-users",deactivateStudents);
router.patch("/sessions/:id/activate-users",activateStudents);
router.post("/upload/students/:departmentId", upload.single("file"), uploadStudents);
router.get("/students", getStudents);
router.get("/students/stats", getStudentStats);
router.put("/students/:id", updateStudent);
router.delete("/students/bulkdelete/:departmentId/:sessionId",bulkDeleteStudents);

/* ================= FACULTY ================= */
router.post("/upload/faculty/:departmentId", upload.single("file"), uploadFaculty);
router.get("/faculty", getFaculty);
router.get("/faculty/stats",getFacultyStats);
router.put("/faculty/:id", updateFaculty);
router.delete("/faculty/bulkdelete/:departmentId", bulkDeleteFacultyByDepartment);
router.delete("/faculty/:id", deleteFaculty);



export default router;
