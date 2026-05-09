import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const projectServices = {

  /* ============== PROJECT DETAILS ============ */
  getMyProjects: async () => {
    const response = await axiosInstance.get(
      API_PATHS.STUDENT.GET_MY_PROJECTS
    );
    return response.data;
  },

  getProjectDetails: async (projectId) => {
    const response = await axiosInstance.get(
      API_PATHS.STUDENT.GET_PROJECT_DETAILS(projectId)
    );
    return response.data;
  },

  editProjectDetails: async (projectId,updateData) => {
      const response = await axiosInstance.patch(
      API_PATHS.STUDENT.EDIT_PROJECT_DETAILS(projectId),
      updateData
    );
    return response.data;
  },

  /* ============== WEEKLY UPDATES ============ */

  // Submit weekly update
  submitWeeklyUpdate: async (projectId, payload) => {
    // payload: { weekNumber, updateText, links }
    const response = await axiosInstance.post(
      API_PATHS.STUDENT.SUBMIT_WEEKLY_UPDATE(projectId),
      payload
    );
    return response.data;
  },

  // Edit weekly update
  editWeeklyUpdate: async (projectId, itemId, payload) => {
    // payload: { updateText, links }
    const response = await axiosInstance.put(
      API_PATHS.STUDENT.EDIT_WEEKLY_UPDATE(projectId, itemId),
      payload
    );
    return response.data;
  },

  // Get all weekly updates
  getWeeklyUpdates: async (projectId, page = 1, limit = 4) => {
    const response = await axiosInstance.get(
      API_PATHS.STUDENT.GET_WEEKLY_UPDATES(projectId),
      { params: { page, limit } }
    );
    return response.data; // { success, data, pagination }
  },

  /* ============== TASKS ============ */

  // Get all tasks (optional status filter)
  getProjectTasks: async (projectId, page = 1, limit = 4, status) => {
    const response = await axiosInstance.get(
      API_PATHS.STUDENT.GET_PROJECT_TASKS(projectId),
      {
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }
    );
    return response.data; // { success, data, pagination }
  },

  // Submit task
  submitTask: async (projectId, itemId, payload) => {
    // payload: { text, links }
    const response = await axiosInstance.post(
      API_PATHS.STUDENT.SUBMIT_TASK(projectId, itemId),
      payload
    );
    return response.data;
  },

  // Edit task submission
  editTaskSubmission: async (projectId, itemId, payload) => {
    // payload: { text, links: [ "label" , "url"] }
    const response = await axiosInstance.put(
      API_PATHS.STUDENT.EDIT_TASK_SUBMISSION(projectId, itemId),
      payload
    );
    return response.data;
  },

};

export default projectServices;