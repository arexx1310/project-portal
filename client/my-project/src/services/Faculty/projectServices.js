import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const facultyProjectService = {

  /* ============== PROJECTS ============ */

  getProjectById: async (projectId) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_PROJECT_BY_ID(projectId)
    );
    return res.data;
  },

  editProjectDetails: async (projectId,updateData) => {
      const response = await axiosInstance.patch(
      API_PATHS.FACULTY.EDIT_PROJECT_DETAILS(projectId),
      updateData
    );
    return response.data;
  },

  /* ============== TASKS ============ */

  createTask: async (projectId, taskData) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.CREATE_TASK(projectId),
      taskData
    );
    return res.data;
  },

  editTask: async (projectId, itemId, taskData) => {
    const res = await axiosInstance.put(
      API_PATHS.FACULTY.EDIT_TASK(projectId, itemId),
      taskData
    );
    return res.data;
  },

  deleteTask: async (projectId, itemId) => {
    const res = await axiosInstance.delete(
      API_PATHS.FACULTY.DELETE_TASK(projectId, itemId)
    );
    return res.data;
  },

  /* ============== WORK ITEMS ============ */

   getWorkItems: async (projectId, page = 1, limit = 4, queryParams = {}) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_WORK_ITEMS(projectId),
      {
        params: {
          page,
          limit,
          ...queryParams, // supports ?status=&type=
        },
      }
    );
    return res.data; // { success, data, pagination }
  },

  /* ============== FEEDBACK ============ */

  addFeedback: async (projectId, itemId, feedbackData) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.ADD_FEEDBACK(projectId, itemId),
      feedbackData
    );
    return res.data;
  },

  /* ============== STATUS ============ */

  updateWorkItemStatus: async (projectId, itemId, statusData) => {
    const res = await axiosInstance.patch(
      API_PATHS.FACULTY.UPDATE_WORK_ITEM_STATUS(projectId, itemId),
      statusData
    );
    return res.data;
  },
};

export default facultyProjectService;