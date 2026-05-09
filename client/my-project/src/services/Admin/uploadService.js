import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

/**
 * @description Service to handle Bulk Excel Uploads for Users.
 * Security: Uses FormData to prevent payload tampering and relies on multipart/form-data headers.
 */
const uploadService = {
  /**
   * Upload Faculty Excel File
   * @param {File} file - The .xlsx or .xls file object
   */
  uploadFaculty: async (file, departmentId) => {
        if (!file) throw new Error("No file selected for faculty upload.");

        const formData = new FormData();
        formData.append("file", file);

        const response = await axiosInstance.post(
          API_PATHS.ADMIN.UPLOAD_FACULTY(departmentId),
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 100000, 
          }
        );
 
        return response.data;  // err => error.message
  },

  /**
   * Upload Students Excel File
   * @param {File} file - The .xlsx or .xls file object
   */
  uploadStudents: async (file, departmentId, specialization, programType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("specialization", specialization);
    formData.append("programType",programType);

    const response = await axiosInstance.post(
      API_PATHS.ADMIN.UPLOAD_STUDENTS(departmentId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 150000,
      }
    );

    return response.data;
  },

  /**
   * Internal error handler to mask sensitive backend info while providing clear feedback
   * @private
   */
  _handleUploadError: (error, type) => {
    const message = error.response?.data?.message || `Bulk ${type} upload failed. Please verify file format.`;
    console.error(`[Upload Service Error]: ${message}`);
    throw message;
  }
};

export default uploadService;