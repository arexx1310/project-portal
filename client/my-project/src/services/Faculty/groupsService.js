import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Axios } from "axios";

const groupsService = {

    /* ============== GROUP INVITES ============ */

    getAllGroups: async (sessionId) => {  // ← accept it
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_MY_GROUPS(sessionId)
        );
        return response.data;
    },


    getMTechStudents: async (sessionId) => {
        const response = await axiosInstance.get(
            API_PATHS.FACULTY.GET_MTECH_STUDENT(sessionId)
        );

        return response.data;
    },

    getGroupDetails: async (id) => {
        const response = await axiosInstance.get(API_PATHS.FACULTY.GET_GROUP_DETAILS(id));
        return response.data;
    },
    
};

export default groupsService;