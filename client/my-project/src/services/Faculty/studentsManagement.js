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

  getExcelUngrouped: async () => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_UNGROUPED_DATA,
      { responseType: "blob" }
    );
    downloadBlob(res.data, "Ungrouped_Students.xlsx");
  },

  getExcelUnsupervisedGroups: async () => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_UNSUPERVISED_DATA,
      { responseType: "blob" }
    );
    downloadBlob(res.data, "Unsupervised_Groups.xlsx");
  },

  getExcelFullGroupsData: async () => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_GROUPS_DATA,
      { responseType: "blob" }
    );
    downloadBlob(res.data, "Full_Groups_Data.xlsx");
  },

};

export default studentsManagement;