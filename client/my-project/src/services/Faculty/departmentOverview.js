import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const departmentOverviewService = {
  /**
   * Fetches a paginated list of UG students in the faculty's department.
   *
   * @param {string} sessionId - Required. The session _id to filter by.
   * @param {Object} [params]
   * @param {7|8}    [params.semester]  - Optional semester filter (7 or 8).
   * @param {number} [params.page]      - Page number (default 1).
   * @param {number} [params.limit]     - Page size (default 20, max 100).
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data: Array<{
   *     sNo: number,
   *     studentName: string,
   *     rollNumber: string,
   *     semester: number,
   *     specialization: string,
   *     groupName: string,
   *     supervisorNames: string[],
   *     projectTitle: string,
   *     publicationStatuses: Array<{ title: string, status: string }>,
   *     projectDocuments: Array<{ label: string, url: string }>,
   *   }>,
   *   pagination: { total: number, page: number, limit: number, totalPages: number }
   * }>}
   */
  getUGStudents: async (sessionId, { semester, page = 1, limit = 50 } = {}) => {
    const params = { sessionId, page, limit };
    if (semester !== undefined) params.semester = semester;

    const response = await axiosInstance.get(
      API_PATHS.FACULTY.GET_UG_STUDENTS,
      { params }
    );
    return response.data;
  },

  /**
   * Fetches a paginated list of PG (MTech) students in the faculty's department.
   *
   * @param {string} sessionId - Required. The session _id to filter by.
   * @param {Object} [params]
   * @param {1|2|3|4} [params.semester] - Optional semester filter (1–4).
   * @param {number}  [params.page]     - Page number (default 1).
   * @param {number}  [params.limit]    - Page size (default 20, max 100).
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data: Array<{
   *     sNo: number,
   *     studentName: string,
   *     rollNumber: string,
   *     semester: number,
   *     groupName: string,
   *     supervisorNames: string[],
   *     projectTitle: string,
   *     publicationStatuses: Array<{ title: string, status: string }>,
   *     projectDocuments: Array<{ label: string, url: string }>,
   *   }>,
   *   pagination: { total: number, page: number, limit: number, totalPages: number }
   * }>}
   */
  getPGStudents: async (sessionId, { semester, page = 1, limit = 40 } = {}) => {
    const params = { sessionId, page, limit };
    if (semester !== undefined) params.semester = semester;

    const response = await axiosInstance.get(
      API_PATHS.FACULTY.GET_PG_STUDENTS,
      { params }
    );
    return response.data;
  },
};

export default departmentOverviewService;