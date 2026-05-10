import express from "express";
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
import { attachStudentProfile ,requireProgram } from "../middleware/studentAccess.js";

import uploadPdf from "../config/multer.js";
import { getNotifications } from "../controllers/notificationController.js";

import {
  getProfile
} from "../controllers/student/profileController.js";
import {
  updatePassword
} from "../controllers/authController.js";

import {
  getBTPConfig,
  createGroup,
  sendInvite,
  respondInvite,
  getGroupsInvite,
  getMyInvites,
  withDrawInvite,
  registerGroup
} from "../controllers/student/groupController.js";

import { 
  getDepartments,
  getAvailableSupervisors,
  createProjectRequest,
  cancelProjectRequest,
  getMyProjects,
  uploadDocument,
  getDocuments,
  deleteDocument,
} from "../controllers/student/projectController1.js";

import { getGroupDetails} from "../controllers/common/groupControllers.js";
import { editProject, getProjectById } from "../controllers/common/projectController.js";

import {
  getProjectRequestDetails,
  listProjectRequests
} from "../controllers/common/proposalsController.js";


import { editTaskSubmission, editWeeklyUpdate, getProjectTasks, getWeeklyUpdates, submitTask, submitWeeklyUpdate } from "../controllers/student/weeklyWorkController.js";

import {
  listPublications,
  getPublication,
  createPublication,
  updatePublication,
  deletePublication,
  addRemark,
} from "../controllers/common/publicationController.js";

import { createMtpProjectRequest } from "../controllers/student/mtechControllers.js";



const router = express.Router();

router.use(protect, authorize("student"),attachStudentProfile);


/* ============== Personal Info and Security ============ */
router.get("/profile",getProfile);
router.put("/updatePassword",updatePassword);

/* ============== NOTIFICATIONS ============ */
router.get("/notifications", getNotifications);


/* ============== GROUP FORMATION AND RESPONSE ============ */
router.get("/btpconfig",getBTPConfig);
router.post("/create-group",createGroup);
router.get("/group",getGroupDetails);
router.get("/group/invites",getGroupsInvite);
router.get("/group/my-invites",getMyInvites);
router.post("/group/send-invite",sendInvite);
router.patch("/group/respond-invite/:inviteId",respondInvite);
router.delete("/group/withdraw-invite/:inviteId",withDrawInvite);

router.patch("/group/register",registerGroup);

/* ============== PROJECT PROPOSALS ============ */
router.get("/project-proposal/departments",getDepartments);
router.get("/project-proposal/available-professors/:departmentId",getAvailableSupervisors);
router.post("/project-proposal/create-request",createProjectRequest);
router.get("/project-proposal/my-requests",listProjectRequests);
router.get("/project-proposal/my-requests/:inviteId",getProjectRequestDetails);
router.delete("/project-proposal/:inviteId",cancelProjectRequest);

/* ============== ALL PROJECT DETAILS AND UPDATES ============ */
router.get("/projects/my-projects",getMyProjects);
router.get("/projects/:projectId",getProjectById);
router.patch("/projects/:projectId",editProject);
router.post("/projects/:projectId/weekly-updates",submitWeeklyUpdate);
router.put("/projects/:projectId/weekly-updates/:itemId",editWeeklyUpdate);
router.get("/projects/:projectId/weekly-updates",getWeeklyUpdates);
router.get("/projects/:projectId/tasks",getProjectTasks);
router.post("/projects/:projectId/tasks/:itemId/submit",submitTask);
router.put("/projects/:projectId/tasks/:itemId/submission",editTaskSubmission);

router.post(
  "/projects/:projectId/upload-document",
  uploadPdf.single("document"),
  uploadDocument
);

router.get("/projects/:projectId/get-documents",getDocuments);

router.delete("/projects/:projectId/delete-report/:documentId",deleteDocument);

/* ============== ALL PUBLICATIONS DETAILS AND UPDATES ============ */
router.get("/projects/:projectId/publications",                         listPublications);
router.get("/projects/:projectId/publications/:publicationId",          getPublication);
router.post("/projects/:projectId/publications",                         createPublication);
router.patch("/projects/:projectId/publications/:publicationId",         updatePublication);
router.delete("/projects/:projectId/publications/:publicationId",        deletePublication);
router.post("/projects/:projectId/publications/:publicationId/remarks",  addRemark);



/* ============== ONLY FOR PG STUDENTS ============ */
router.use(requireProgram("PG"));

router.post("/mtp/supervisor-request",createMtpProjectRequest);



export default router;