import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const deptConfigService = {
  /**
   * Fetches the full department config (BTP + MTP) for the faculty's department.
   */
  getDepartmentConfig: async () => {
    const response = await axiosInstance.get(API_PATHS.FACULTY.GET_DEPT_CONFIG);
    return response.data;
  },

  /**
   * Updates the BTP configuration.
   * @param {string} departmentId - The department _id.
   * @param {Object} updateData - Should be { btpConfig: { ...fields } }
   */
  updateBTPConfig: async (departmentId, updateData) => {
    const response = await axiosInstance.patch(
      API_PATHS.FACULTY.UPDATE_BTP_CONFIG(departmentId),
      updateData
    );
    return response.data;
  },

  /**
   * Updates the MTP configuration.
   * @param {string} departmentId - The department _id.
   * @param {Object} updateData - Should be { mtpConfig: { ...fields } }
   */
  updateMTPConfig: async (departmentId, updateData) => {
    const response = await axiosInstance.patch(
      API_PATHS.FACULTY.UPDATE_MTP_CONFIG(departmentId),
      updateData
    );
    return response.data;
  },
};

export default deptConfigService;