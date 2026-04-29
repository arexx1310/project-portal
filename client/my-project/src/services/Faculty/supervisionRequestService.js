import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const supervisionRequestService = {

    /* ============== GROUP INVITES ============ */

    getAllRequests: async () => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_ALL_REQUESTS
        );
        return response.data;
    },

    getRequestDetails: async (id) => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_REQUEST_DETAILS(id)
        );
        return response.data;
    },

    responseRequest: async (id, payload) => {
        const response = await axiosInstance.patch(
            API_PATHS.FACULTY.RESPONSE_REQUEST(id),payload
        );
        return response.data;
    }
    
};

export default supervisionRequestService;