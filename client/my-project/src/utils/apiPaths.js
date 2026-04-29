export const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_PATHS = {
  AUTH: {
    ADMIN_LOGIN: "/api/auth/admin/login",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    SOCKET_TOKEN: "/api/auth/socket-token",
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
    DEACTIVATE_SESSION: (id) => `/api/admin/sessions/${id}/deactivate`,
    DELETE_SESSION: (id) => `/api/admin/sessions/${id}/delete`,

    // Students
    UPLOAD_STUDENTS: (id) =>  `/api/admin/upload/students/${id}`,
    GET_STUDENTS: "/api/admin/students",
    UPDATE_STUDENT: (id) => `/api/admin/students/${id}`,
    GET_STUDENT_STATS: "/api/admin/students/stats",
    DELETE_STUDENT: (id) => `/api/admin/students/${id}`,
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
    GET_PROFILE: "/api/faculty/profile",
    UPDATE_PASSWORD: "/api/faculty/updatepassword",

    /* ============== NOTIFICATIONS ============ */
    GET_NOTIFICATIONS: "/api/faculty/notifications",

    /* ============== BTP CONFIGS ============ */
    GET_BTP_CONFIG: "/api/faculty/btpconfig",
    UPDATE_BTP_CONFIG: (departmentId) => `/api/faculty/btpconfig/${departmentId}`,

    GET_SESSIONS: "/api/faculty/sessions",

    /* ============== GROUP INVITES ============ */
    GET_PENDING_SUPERVISION_REQUEST: "/api/faculty/project-approvals/pending",
    GET_ALL_REQUESTS: "/api/faculty/project-approvals",
    GET_REQUEST_DETAILS: (id) =>  `/api/faculty/project-approvals/${id}`,
    RESPONSE_REQUEST: (id) => `/api/faculty/project-approvals/${id}/respond`,

    /* ============== GROUPS ============ */
    GET_MY_GROUPS: (sessionId) => sessionId ? `/api/faculty/groups?sessionId=${sessionId}` : `/api/faculty/groups`,
    GET_MY_PROJECTS: "/api/faculty/projects",
    GET_GROUP_DETAILS: (id) => `/api/faculty/managegroup/groups/${id}`,

    /* ============== REPORTS ============ */
    GET_UNGROUPED_DATA: "/api/faculty/ungrouped-students/excel",
    GET_UNSUPERVISED_DATA: "/api/faculty/unsupervised-groups/excel",
    GET_GROUPS_DATA: "/api/faculty/department/groups",
    
  },
  STUDENT: {
    /* ============== Personal Info and Security ============ */
    GET_PROFILE: "/api/student/profile",
    UPDATE_PASSWORD:"/api/student/updatePassword",

    /* ============== NOTIFICATIONS ============ */
    GET_NOTIFICATIONS: "/api/student/notifications",
    
    /* ============== GROUP FORMATION AND RESPONSE ============ */
    GET_BTP_CONFIG: "/api/student/btpconfig",
    GET_AVAILABLE_PROFESSORS: "/api/student/available-professors",
    SEARCH_MEMBER: (rollNumber) => `/api/student/group-invites/addmember/${rollNumber}`,
    CREATE_INVITE: "/api/student/group-invites/",
    GET_INVITES: "/api/student/group-invites/mine",
    GET_INVITE_BY_ID: (id) => `/api/student/group-invites/${id}`,
    UPDATE_RESPONSE_INVITE: (id) => `/api/student/group-invites/${id}/member-response`,
    CANCEL_INVITE: (id) => `/api/student/group-invites/${id}`,

    /* ============== SUPERVISOR SELECTION AND PROJECT PROPOSAL ============ */
    CREATE_PROJECT_PROPOSAL: "/api/student/project-approval/", // POST
    GET_PROJECT_PROPOSALS: "/api/student/project-approval/mine", // GET
    PROJECT_PROPOSAL_DETAIL: (id) => `/api/student/project-approval/${id}`, // GET
    DELETE_PROJECT_PROPOSAL: (id) => `/api/student/project-approval/${id}`, // DELETE

    /* ============== GROUP INFORMATION ============ */
    GET_MY_GROUP: "/api/student/group"

  },
};
