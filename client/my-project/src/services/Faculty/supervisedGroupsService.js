import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const supervisedGroupService = {

    /* ============== GROUP INVITES ============ */

    getAllGroups: async (sessionId) => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_MY_GROUPS(sessionId)
        );
        return response.data;
    },

    getAllProject: async () => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_MY_PROJECTS
        );
        return response.data;
    },

    getGroupDetails: async (id) => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_GROUP_DETAILS(id)
        );
        return response.data;
    },
    
};

export default supervisedGroupService;