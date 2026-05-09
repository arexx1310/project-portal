import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const downloadBlob = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const reportService = {
  /**
   * UG status report — 3 sheets (no semester needed).
   * Sheet 1: Students Not In a Group
   * Sheet 2: Groups Not Registered (Draft)
   * Sheet 3: Groups With No Supervisors
   */
  generateUGStatusReport: async (sessionId, sessionName) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GENERATE_UG_STATUS_REPORT(sessionId),
      { responseType: "blob" }
    );
    downloadBlob(res.data, `BTP_Status_Report_${sessionName}.xlsx`);
  },

  /**
   * UG project + publication report — 2 sheets (semester required).
   * Sheet 1: BTP Phase 1/2 Projects
   * Sheet 2: Publications per project
   * @param {number} semester - 7 or 8
   */
  generateUGProjectReport: async (sessionId, sessionName, semester) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GENERATE_UG_PROJECT_REPORT(sessionId, semester),
      { responseType: "blob" }
    );
    downloadBlob(res.data, `BTP_Project_Report_${sessionName}_Sem${semester}.xlsx`);
  },

  /**
   * PG status report — 2 sheets (no semester needed).
   * Sheet 1: Students Not Registered (no group)
   * Sheet 2: Students With No Supervisors
   */
  generatePGStatusReport: async (sessionId, sessionName) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GENERATE_PG_STATUS_REPORT(sessionId),
      { responseType: "blob" }
    );
    downloadBlob(res.data, `MTP_Status_Report_${sessionName}.xlsx`);
  },

  /**
   * PG project + publication report — 2 sheets (semester required).
   * Sheet 1: MTP Sem N Projects
   * Sheet 2: Publications per project
   * @param {number} semester - 1, 2, 3, or 4
   */
  generatePGProjectReport: async (sessionId, sessionName, semester) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GENERATE_PG_PROJECT_REPORT(sessionId, semester),
      { responseType: "blob" }
    );
    downloadBlob(res.data, `MTP_Project_Report_${sessionName}_Sem${semester}.xlsx`);
  },
};

export default reportService;