import express from "express";
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
import {
  getProfile
} from "../controllers/faculty/profileController.js";
import {
  updatePassword
} from "../controllers/authController.js";

import { getNotifications } from "../controllers/notificationController.js"


import { authorizeFacultyRoles, attachFacultyProfile } from "../middleware/facultyAccess.js";

import { getSessions, getMyGroups, getMTechStudents } from "../controllers/faculty/groupController.js";

import { getProjectRequestDetails, listProjectRequests } from "../controllers/common/proposalsController.js";

import { getGroupDetails } from "../controllers/common/groupControllers.js";
import { editProject, getProjectById } from "../controllers/common/projectController.js";

import {
  createTask,
  editTask,
  deleteTask,
  getProjectWorkItems,
  addFeedback,
  updateWorkItemStatus
} from "../controllers/faculty/weeklyWorkController.js";

import { respondToMtpRequest, respondToRequest} from "../controllers/faculty/projectController.js";

import {
  listPublications,
  getPublication,
  createPublication,
  updatePublication,
  deletePublication,
  addRemark,
} from "../controllers/common/publicationController.js";
import { getDepartmentConfig, updateBTPConfig, updateMTPConfig } from "../controllers/faculty/departmentConfigController.js";

import {
  generateUGStatusReport,
  generateUGProjectReport,
  generatePGStatusReport,
  generatePGProjectReport,
} from "../controllers/faculty/reportController.js";
 

const router = express.Router();

router.use(protect, authorize("faculty"), attachFacultyProfile);

/* ============== Personal Info and Security ============ */
router.get("/profile/",getProfile);
router.put("/updatePassword",updatePassword);

/* ============== Notifications ============ */
router.get("/notifications", getNotifications);

// PATCH — BTP config: restricted to BTP_COMMITTEE_HEAD or HOD
router.patch(
  "/config/:departmentId/btp",
  authorizeFacultyRoles("BTP_COMMITTEE_HEAD", "HOD"),
  updateBTPConfig
);
 
// PATCH — MTP config: restricted to HOD only (PG-level programme)
router.patch(
  "/config/:departmentId/mtp",
  authorizeFacultyRoles("HOD"),
  updateMTPConfig
);

router.get("/config",getDepartmentConfig);

/* ============== Sessions ============ */
// To use details regarding different sessions
router.get("/sessions",getSessions);

/* ============== Project Proposals ============ */
router.get("/project-proposal/my-requests",listProjectRequests);

router.post("/project-proposal/:requestId/respond",respondToRequest);
router.post("/project-proposal/:requestId/respond-pg",respondToMtpRequest); // Master's Student Invite
router.get("/project-proposal/my-requests/:inviteId",getProjectRequestDetails);

router.get("/mtech-students",getMTechStudents); //Master's student list under faculties supervision

/* ============== Faculty's Group ============ */
router.get("/groups/my-groups",getMyGroups);
router.get("/groups/group-details/:groupId",getGroupDetails);
router.get("/projects/:projectId",getProjectById);
router.patch("/projects/:projectId",editProject);

/* ============== Faculty's Projects ============ */

router.post("/projects/:projectId/tasks", createTask);
router.put("/projects/:projectId/tasks/:itemId", editTask);
router.delete("/projects/:projectId/tasks/:itemId", deleteTask);

router.get("/projects/:projectId/work-items", getProjectWorkItems);
router.post("/projects/:projectId/work-items/:itemId/feedback",addFeedback);
router.patch("/projects/:projectId/work-items/:itemId/status",updateWorkItemStatus);

/* ============== ALL PUBLICATIONS DETAILS AND UPDATES ============ */
router.get("/projects/:projectId/publications",                         listPublications);
router.get("/projects/:projectId/publications/:publicationId",          getPublication);
router.post("/projects/:projectId/publications",                         createPublication);
router.patch("/projects/:projectId/publications/:publicationId",         updatePublication);
router.delete("/projects/:projectId/publications/:publicationId",        deletePublication);
router.post("/projects/:projectId/publications/:publicationId/remarks",  addRemark);



/* ============== Excel Reports ============ */

// UG Controller 1 — Status (students not in group, draft groups, groups with no supervisor)
router.get(
  "/reports/ug/:sessionId/status",
  authorizeFacultyRoles("BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER", "HOD"),
  generateUGStatusReport
);

// UG Controller 2 — Projects + Publications (requires ?semester=7|8)
router.get(
  "/reports/ug/:sessionId/projects",
  authorizeFacultyRoles("BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER", "HOD"),
  generateUGProjectReport
);

// PG Controller 1 — Status (students not registered, students with no supervisor)
router.get(
  "/reports/pg/:sessionId/status",
  authorizeFacultyRoles("HOD"),
  generatePGStatusReport
);

// PG Controller 2 — Projects + Publications (requires ?semester=1|2|3|4)
router.get(
  "/reports/pg/:sessionId/projects",
  authorizeFacultyRoles("HOD"),
  generatePGProjectReport
);


export default router;