import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";


const departmentService = {
  /**
   * Create department with specialization data
   * @param {Object} payload : {department(string), specialization(array[string])}
   */
  createDepartments: async (payload) => {
    const response = await axiosInstance.post(API_PATHS.ADMIN.CREATE_DEPARTMENTS,payload);
    return response.data; //err => err.message 
  },

  /**
   * Fetches the list of all valid departments from the backend.
   * Note: This is usually used for populating dropdowns in the UI.
   */
  getAllDepartments: async () => {
      const response = await axiosInstance.get(API_PATHS.ADMIN.GET_DEPARTMENTS);
      return response.data.data;
  },

    /**
   * Edit department (name and/or specializations)
   * @param {string} id
   * @param {Object} payload : { department?, specializations? }
   */
  updateDepartment: async (id, payload) => {
    const response = await axiosInstance.put(
      API_PATHS.ADMIN.UPDATE_DEPARTMENT(id),
      payload
    );
    return response.data;
  }

};

export default departmentService;