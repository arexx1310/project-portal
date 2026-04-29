import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const btpInviteService = {
    
    getBTPConfig: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_BTP_CONFIG);
        return response.data;
    },

    searchMemberByRoll: async (rollNumber) => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.SEARCH_MEMBER(rollNumber));
        return response.data;
    },

    createGroupInvite: async (inviteData) => {
        const response = await axiosInstance.post(API_PATHS.STUDENT.CREATE_INVITE, inviteData);
        return response.data;
    },

    getMyInvites: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_INVITES);
        return response.data;
    },

    getInviteById: async (id) => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_INVITE_BY_ID(id));
        return response.data;
    },

    memberResponse: async (id, updateData) => {
        const response = await axiosInstance.patch(
            API_PATHS.STUDENT.UPDATE_RESPONSE_INVITE(id),
            updateData
        );
        return response.data;
    },

    cancelInvite: async (id) => {
        const response = await axiosInstance.patch(API_PATHS.STUDENT.CANCEL_INVITE(id));
        return response.data;
    },

};

export default btpInviteService;