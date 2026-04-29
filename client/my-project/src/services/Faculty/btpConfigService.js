import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const btpService = {
  /**
   * Fetches the BTP configuration for the faculty's department.
   * No ID required because the backend uses the user's session.
   */
  getDepartmentConfig: async () => {
      const response = await axiosInstance.get(API_PATHS.FACULTY.GET_BTP_CONFIG);
      return response.data; 
  },

  /**
   * Updates the BTP configuration.
   * @param {string} id - The _id of the BTPConfig document.
   * @param {Object} updateData - The fields to update.
   */
  updateDepartmentConfig: async (departmentId, updateData) => {
      const response = await axiosInstance.patch(
        API_PATHS.FACULTY.UPDATE_BTP_CONFIG(departmentId),
        updateData
      );
      return response.data;
  },
};

export default btpService;