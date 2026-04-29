import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const notificationService = {
  getNotifications: async () => {
    const res = await axiosInstance.get(API_PATHS.STUDENT.GET_NOTIFICATIONS);
    return res.data;
  },
};

export default notificationService;