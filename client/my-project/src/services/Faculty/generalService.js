import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// sessionService.js
const generalServices = {
  getSessions: async () => {
    const res = await axiosInstance.get(API_PATHS.FACULTY.GET_SESSIONS);
    return res.data;
  },
}

export default generalServices;