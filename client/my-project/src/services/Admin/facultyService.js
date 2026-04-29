import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
// services/Admin/facultyService.js
/**
 * @description Faculty management service for Admin with focus on security and data integrity.
 */
const facultyService = {
  /**
   * Fetches all faculty members with populated user details.
   * Security: Relies on Admin JWT verification via axiosInstance.
   */
  getAllFaculty: async () => {
      const response = await axiosInstance.get(API_PATHS.ADMIN.GET_FACULTY);
      return response.data; 
  },

  /**
   * Fetches faculty statistics.
   * Returns: totalFaculty, byDepartment, byRole, withSpecialRoles, incompleteProfiles
   */
  getFacultyStats: async () => {
      const response = await axiosInstance.get(API_PATHS.ADMIN.GET_FACULTY_STATS);
      return response.data;
  },

  /**
   * Updates specific faculty fields.
   * @param {string} id - Faculty Document ID
   * @param {Object} updateData - { roles }
   */
  updateFaculty: async (id, updateData) => {
      const response = await axiosInstance.put(
        API_PATHS.ADMIN.UPDATE_FACULTY(id),
        updateData
      );
      return response.data;
  },

  /**
   * Performs an atomic-like deletion of Faculty and linked User records.
   * @param {string} id - Faculty Document ID
   * Security Note: This is a permanent destructive action.
   */
  deleteFaculty: async (id) => {
      if (!id) throw new Error("Faculty ID is required");
      const response = await axiosInstance.delete(API_PATHS.ADMIN.DELETE_FACULTY(id));
      return response.data;
  },

  bulkDeleteByDepartment: async (departmentId) => {
        const response = await axiosInstance.delete(API_PATHS.ADMIN.BULK_DELETE_FACULTY(departmentId));
        return response.data;
    },
  /**
   * Helper to validate faculty roles on frontend before submission
   * Security: Syncs with Backend Enum
   */
  getValidRoles: () => ["HOD", "BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER"]
};

export default facultyService;