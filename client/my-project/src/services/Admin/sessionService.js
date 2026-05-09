import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// sessionService.js
const sessionService = {
  getSessions: async () => {
    const res = await axiosInstance.get(API_PATHS.ADMIN.GET_SESSIONS);
    return res.data;
  },

  getActiveSession: async () => {
    const res = await axiosInstance.get(API_PATHS.ADMIN.GET_ACTIVE_SESSION);
    return res.data;
  },

  createSession: async (payload) => {
    if (new Date(payload.oddSemester.startDate) >= new Date(payload.oddSemester.endDate))
      throw new Error("Odd semester end date must be after start date.");
    if (new Date(payload.oddSemester.endDate) >= new Date(payload.evenSemester.startDate))
      throw new Error("Even semester should start after odd semester ends.");
    if (new Date(payload.evenSemester.startDate) >= new Date(payload.evenSemester.endDate))
      throw new Error("Even semester end date must be after start date.");

    const res = await axiosInstance.post(API_PATHS.ADMIN.CREATE_SESSION, payload);
    return res.data; // err => err.message
  },

  activateSession: async (id) => {
    const res = await axiosInstance.patch(API_PATHS.ADMIN.ACTIVATE_SESSION(id));
    return res.data;
  },
  
  deleteSession: async (id) => {
    const res = await axiosInstance.delete(API_PATHS.ADMIN.DELETE_SESSION(id));
    return res.data;
  },
};

export default sessionService;