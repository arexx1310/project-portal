import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const proposalService = {
  /* ============== PROJECT PROPOSAL REQUESTS ============ */

  getMyRequests: async (isPG) => {
    const type = isPG ? "PG" : "UG";
    const res = await axiosInstance.get(
      `${API_PATHS.FACULTY.GET_MY_REQUESTS}?type=${type}`
    );
    return res.data;
  },

  getRequestDetails: async (inviteId) => {
    const res = await axiosInstance.get(
      API_PATHS.FACULTY.GET_REQUEST_DETAILS(inviteId)
    );
    return res.data;
  },

  respondToRequest: async (requestId, responseData) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.RESPOND_TO_REQUEST(requestId),
      responseData
    );

    return res.data;
  },

  respondToMTPRequest: async (requestId, responseData) => {
    const res = await axiosInstance.post(
      API_PATHS.FACULTY.RESPOND_TO_MTP_REQUEST(requestId),
      responseData
    );

    return res.data;
  },
};

export default proposalService;