import express from "express";
import protect from "../middleware/protect.js";
import authorize from "../middleware/authorize.js";
import {
  getProfile
} from "../controllers/student/profileController.js";
import {
  updatePassword
} from "../controllers/authController.js";
import {
  createGroupInvite,
  listMyInvites,
  getGroupInvite,
  memberRespond,
  cancelGroupInvite,
  addMember,
  getBTPConfig,
} from "../controllers/student/groupInvitesController.js";

import { getNotifications } from "../controllers/notificationController.js";

import { attachStudentProfile } from "../middleware/studentAccess.js";
import { getMyBTPGroup } from "../controllers/student/btpInfoController.js";

import {getAvailableProfessors,cancelProjectApprovalRequest, createProjectApprovalRequest, getProjectApprovalRequest, listMyProjectApprovalRequests } from "../controllers/student/projectProposalController.js";

const router = express.Router();

router.use(protect, authorize("student"),attachStudentProfile);


/* ============== Personal Info and Security ============ */
router.get("/profile",getProfile);
router.put("/updatePassword",updatePassword);

/* ============== NOTIFICATIONS ============ */
router.get("/notifications", getNotifications);


/* ============== GROUP FORMATION AND RESPONSE ============ */
router.get("/btpconfig",getBTPConfig);

router.get("/group-invites/addmember/:rollNumber",addMember);
router.post("/group-invites/", createGroupInvite);
router.get("/group-invites/mine", listMyInvites);
router.get("/group-invites/:inviteId", getGroupInvite);
router.delete("/group-invites/:inviteId", cancelGroupInvite);
router.patch("/group-invites/:inviteId/member-response", memberRespond);

/* ============== SUPERVISOR SELECTION AND PROJECT PROPOSAL ============ */
router.get("/available-professors",getAvailableProfessors);
router.post("/project-approval/", createProjectApprovalRequest);
router.get("/project-approval/mine",listMyProjectApprovalRequests);
router.get("/project-approval/:requestId",getProjectApprovalRequest);
router.delete("/project-approval/:requestId",cancelProjectApprovalRequest);


/* ============== GROUP AND PROJECT INFORMATION============ */
router.get("/group",getMyBTPGroup);


export default router;