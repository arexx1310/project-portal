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

import { getSessions } from "../controllers/admin/sessionController.js"

import { updateBTPConfig, getBTPConfig } from "../controllers/faculty/btpconfigController.js";
import { authorizeFacultyRoles, attachFacultyProfile } from "../middleware/facultyAccess.js";

import {
  getMyGroups,
  getMyProjects,
  getFullGroupDetails,
} from "../controllers/faculty/supervisedGroupsController.js";
import { exportUngroupedStudentsExcel, exportUnsupervisedGroupsExcel, exportFullGroupsDataExcel } from "../controllers/faculty/manageDepartmentController.js";
import { getAllMyRequest, getRequestDetails, respondToRequest } from "../controllers/faculty/projectProposalController.js";

const router = express.Router();

router.use(protect, authorize("faculty"), attachFacultyProfile);

/* ============== Personal Info and Security ============ */

router.get("/profile/",getProfile);
router.post("/updatepassword",updatePassword);

router.get("/notifications", getNotifications);

/* ============== BTP CONFIG ============ */

// PATCH: Only HOD/Heads can update
router.patch("/btpconfig/:departmentId",authorizeFacultyRoles("BTP_COMMITTEE_HEAD", "HOD"),updateBTPConfig );


// GET: All faculty
router.get("/btpconfig",getBTPConfig);

router.get("/sessions",getSessions);

router.get("/project-approvals",getAllMyRequest);
router.get("/project-approvals/:requestId",getRequestDetails);
router.patch("/project-approvals/:requestId/respond", respondToRequest);

router.get("/groups",getMyGroups);
// router.get("/projects",getMyProjects);
router.get("/managegroup/groups/:groupId",getFullGroupDetails);

router.use(authorizeFacultyRoles("BTP_COMMITTEE_HEAD","BTP_COMMITTEE_MEMBER"));
router.get("/ungrouped-students/excel",exportUngroupedStudentsExcel);
router.get("/unsupervised-groups/excel",exportUnsupervisedGroupsExcel);
router.get("/department/groups",exportFullGroupsDataExcel);

export default router;