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

const studentsManagement = {
  getExcelUngrouped: async (payload) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.GET_UNGROUPED_DATA,
      payload,
      { responseType: "blob" }
    );
    downloadBlob(res.data, "Ungrouped_Students.xlsx");
  },

  getExcelUnsupervisedGroups: async (payload) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.GET_UNSUPERVISED_DATA,
      payload,
      { responseType: "blob" }
    );
    downloadBlob(res.data, "Unsupervised_Groups.xlsx");
  },

  getExcelGroupsWithProjects: async (payload) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.GET_GROUPS_DATA,
      payload,
      { responseType: "blob" }
    );
    downloadBlob(res.data, `Groups_Semester${payload.semester}.xlsx`);
  },
};

export default studentsManagement;