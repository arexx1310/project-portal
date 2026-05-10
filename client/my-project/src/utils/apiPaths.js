export const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_PATHS = {
  AUTH: {
    ADMIN_LOGIN: "/api/auth/admin/login",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },

  ADMIN: {

    CREATE_DEPARTMENTS: "/api/admin/department",
    UPDATE_DEPARTMENT: (id) => `/api/admin/department/${id}`,
    GET_DEPARTMENTS: "/api/admin/departments",
    
    /*===============SESSIONS==============*/ 
    CREATE_SESSION: "/api/admin/sessions",
    GET_SESSIONS: "/api/admin/sessions",
    GET_ACTIVE_SESSION: "/api/admin/sessions/active",
    ACTIVATE_SESSION: (id) => `/api/admin/sessions/${id}/activate`,
    DELETE_SESSION: (id) => `/api/admin/sessions/${id}/delete`,

    // Students
    UPLOAD_STUDENTS: (id) =>  `/api/admin/upload/students/${id}`,
    GET_STUDENTS: "/api/admin/students",
    UPDATE_STUDENT: (id) => `/api/admin/students/${id}`,
    GET_STUDENT_STATS: "/api/admin/students/stats",
    BULK_DELETE_STUDENT: (deptId,sessionId) => `/api/admin/students/bulkdelete/${deptId}/${sessionId}`,

    // Faculty
    UPLOAD_FACULTY: (id) => `/api/admin/upload/faculty/${id}`,
    GET_FACULTY: "/api/admin/faculty",
    GET_FACULTY_STATS: "/api/admin/faculty/stats",
    UPDATE_FACULTY: (id) => `/api/admin/faculty/${id}`,
    BULK_DELETE_FACULTY: (departmentId) => `/api/admin/faculty/bulkdelete/${departmentId}`,
    DELETE_FACULTY: (id) => `/api/admin/faculty/${id}`,
  },
  FACULTY: {
    /* ============== Personal Info and Security ============ */
    GET_PROFILE: "/api/faculty/profile/",
    UPDATE_PASSWORD: "/api/faculty/updatePassword",

    /* ============== NOTIFICATIONS ============ */
    GET_NOTIFICATIONS: "/api/faculty/notifications",

    /* ============== DEPARTMENT CONFIG ============ */
    GET_DEPT_CONFIG: "/api/faculty/config",
    UPDATE_BTP_CONFIG: (departmentId) => `/api/faculty/config/${departmentId}/btp`,
    UPDATE_MTP_CONFIG: (departmentId) => `/api/faculty/config/${departmentId}/mtp`,
    GENERATE_UG_STATUS_REPORT:   (sessionId) =>
      `/api/faculty/reports/ug/${sessionId}/status`,

    GENERATE_UG_PROJECT_REPORT:  (sessionId, semester) =>
      `/api/faculty/reports/ug/${sessionId}/projects?semester=${semester}`,

    GENERATE_PG_STATUS_REPORT:   (sessionId) =>
      `/api/faculty/reports/pg/${sessionId}/status`,

    GENERATE_PG_PROJECT_REPORT:  (sessionId, semester) =>
      `/api/faculty/reports/pg/${sessionId}/projects?semester=${semester}`,

    /* ============== SESSIONS ============ */
    GET_SESSIONS: "/api/faculty/sessions",



    /* ============== PROJECT PROPOSALS ============ */
    GET_MY_REQUESTS: "/api/faculty/project-proposal/my-requests",
    GET_REQUEST_DETAILS: (inviteId) =>
      `/api/faculty/project-proposal/my-requests/${inviteId}`,
    RESPOND_TO_REQUEST: (requestId) =>
      `/api/faculty/project-proposal/${requestId}/respond`,
    RESPOND_TO_MTP_REQUEST: (requestId) => 
      `/api/faculty/project-proposal/${requestId}/respond-pg`,

    /* ============== GROUPS ============ */
    GET_MY_GROUPS: (sessionId) => 
      `/api/faculty/groups/my-groups${sessionId ? `?sessionId=${sessionId}` : ""}`,

    GET_MTECH_STUDENT: (sessionId) => 
      `/api/faculty/mtech-students${sessionId ? `?sessionId=${sessionId}` : ""}`,
    GET_GROUP_DETAILS: (groupId) => `/api/faculty/groups/group-details/${groupId}`,
    

    /* ============== PROJECTS ============ */
    GET_PROJECT_BY_ID: (projectId) =>
      `/api/faculty/projects/${projectId}`,
    EDIT_PROJECT_DETAILS: (projectId) =>
      `/api/faculty/projects/${projectId}`,

    /* ============== TASKS ============ */
    CREATE_TASK: (projectId) =>
      `/api/faculty/projects/${projectId}/tasks`,
    EDIT_TASK: (projectId, itemId) =>
      `/api/faculty/projects/${projectId}/tasks/${itemId}`,
    DELETE_TASK: (projectId, itemId) =>
      `/api/faculty/projects/${projectId}/tasks/${itemId}`,

    /* ============== WORK ITEMS ============ */
    GET_WORK_ITEMS: (projectId) =>
      `/api/faculty/projects/${projectId}/work-items`,
  
    ADD_FEEDBACK: (projectId, itemId) =>
      `/api/faculty/projects/${projectId}/work-items/${itemId}/feedback`,
 
    UPDATE_WORK_ITEM_STATUS: (projectId, itemId) =>
      `/api/faculty/projects/${projectId}/work-items/${itemId}/status`,

    /* ============== PUBLICATIONS ============ */
    LIST_PUBLICATIONS:    (projectId) => `/api/faculty/projects/${projectId}/publications`,
    GET_PUBLICATION:      (projectId, pubId) => `/api/faculty/projects/${projectId}/publications/${pubId}`,
    CREATE_PUBLICATION:   (projectId) => `/api/faculty/projects/${projectId}/publications`,
    UPDATE_PUBLICATION:   (projectId, pubId) => `/api/faculty/projects/${projectId}/publications/${pubId}`,
    DELETE_PUBLICATION:   (projectId, pubId) => `/api/faculty/projects/${projectId}/publications/${pubId}`,
    ADD_REMARK:           (projectId, pubId) => `/api/faculty/projects/${projectId}/publications/${pubId}/remarks`,
  },
  STUDENT : {

    /* ============== Personal Info and Security ============ */
    GET_PROFILE: "/api/student/profile",
    UPDATE_PASSWORD: "/api/student/updatePassword",

    /* ============== NOTIFICATIONS ============ */
    GET_NOTIFICATIONS: "/api/student/notifications",

    /* ============== CONFIG ============ */
    GET_BTP_CONFIG: "/api/student/btpconfig",

    /* ============== GROUP FORMATION AND RESPONSE ============ */
    GET_GROUP_DETAILS: "/api/student/group",
    CREATE_GROUP: "/api/student/create-group",

    GET_GROUP_INVITES: "/api/student/group/invites",
    GET_MY_INVITES: "/api/student/group/my-invites",

    SEND_INVITE: "/api/student/group/send-invite",

    RESPOND_INVITE: (inviteId) =>
      `/api/student/group/respond-invite/${inviteId}`,

    WITHDRAW_INVITE: (inviteId) =>
      `/api/student/group/withdraw-invite/${inviteId}`,

    REGISTER_GROUP: "/api/student/group/register",

    /* ============== PROJECT PROPOSALS ============ */
    GET_DEPARTMENTS: "/api/student/project-proposal/departments",

    GET_AVAILABLE_PROF: (departmentId) =>
      `/api/student/project-proposal/available-professors/${departmentId}`,

    CREATE_REQUEST: "/api/student/project-proposal/create-request",

    GET_MY_REQUESTS: "/api/student/project-proposal/my-requests",

    GET_REQUEST_DETAILS: (inviteId) =>
      `/api/student/project-proposal/my-requests/${inviteId}`,

    WITHDRAW_REQUEST: (inviteId) =>
      `/api/student/project-proposal/${inviteId}`,

    /* ============== PROJECTS & WORK (NEW SECTION) ============ */

    GET_MY_PROJECTS: "/api/student/projects/my-projects",
    GET_PROJECT_DETAILS: (projectId) =>
      `/api/student/projects/${projectId}`,

    EDIT_PROJECT_DETAILS: (projectId) =>
      `/api/student/projects/${projectId}`,

    /* Weekly Updates */
    SUBMIT_WEEKLY_UPDATE: (projectId) =>
      `/api/student/projects/${projectId}/weekly-updates`,

    EDIT_WEEKLY_UPDATE: (projectId, itemId) =>
      `/api/student/projects/${projectId}/weekly-updates/${itemId}`,

    GET_WEEKLY_UPDATES: (projectId) =>
      `/api/student/projects/${projectId}/weekly-updates`,

    /* Tasks */
    GET_PROJECT_TASKS: (projectId) =>
      `/api/student/projects/${projectId}/tasks`,

    SUBMIT_TASK: (projectId, itemId) =>
      `/api/student/projects/${projectId}/tasks/${itemId}/submit`,

    EDIT_TASK_SUBMISSION: (projectId, itemId) =>
      `/api/student/projects/${projectId}/tasks/${itemId}/submission`,

    UPLOAD_DOCUMENT: (projectId) =>
      `/api/student/projects/${projectId}/upload-document`,

    GET_DOCUMENTS: (projectId) =>
      `/api/student/projects/${projectId}/get-documents`,

    DELETE_DOCUMENT: (projectId, documentId) =>
      `/api/student/projects/${projectId}/delete-report/${documentId}`,

    /* ============== PUBLICATIONS ============ */
    LIST_PUBLICATIONS:    (projectId) => `/api/student/projects/${projectId}/publications`,
    GET_PUBLICATION:      (projectId, pubId) => `/api/student/projects/${projectId}/publications/${pubId}`,
    CREATE_PUBLICATION:   (projectId) => `/api/student/projects/${projectId}/publications`,
    UPDATE_PUBLICATION:   (projectId, pubId) => `/api/student/projects/${projectId}/publications/${pubId}`,
    DELETE_PUBLICATION:   (projectId, pubId) => `/api/student/projects/${projectId}/publications/${pubId}`,
    ADD_REMARK:           (projectId, pubId) => `/api/student/projects/${projectId}/publications/${pubId}/remarks`,

    /* ================ EXCLUSIVE TO MTECH STUDENTS=============== */
    SEND_SUPERVISOR_INVITE: "/api/student/mtp/supervisor-request",

  },

  
};