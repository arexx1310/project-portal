import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const studentService = {
  /**
   * Fetches students with optional filters and pagination.
   * @param {string|null} session - Session ID (null = active session)
   * @param {string|null} departmentConfig - DepartmentConfig ObjectId
   * @param {number} page
   * @param {number} limit
   * @param {string|null} search - Name, email, or roll number
   */
  getStudentsByFilter: async (session = null, departmentConfig = null, page = 1, limit = 20, search = null) => {
    let url = `${API_PATHS.ADMIN.GET_STUDENTS}?page=${page}&limit=${limit}`;
    if (session) url += `&session=${session}`;
    if (departmentConfig && departmentConfig !== "All") url += `&departmentConfig=${departmentConfig}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getStudentStats: async (session = null) => {
    let url = API_PATHS.ADMIN.GET_STUDENT_STATS;
    if (session) url += `?session=${session}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  updateStudent: async (id, updateData) => {
    const response = await axiosInstance.put(API_PATHS.ADMIN.UPDATE_STUDENT(id), updateData);
    return response.data;
  },

  bulkDeleteStudents: async (departmentId, sessionId) => {
    if (!departmentId || !sessionId) throw new Error("departmentId and sessionId is required");

    const response = await axiosInstance.delete(API_PATHS.ADMIN.BULK_DELETE_STUDENT(departmentId,sessionId));
    return response.data;
  },
};

export default studentService;