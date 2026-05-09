import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const groupService = {

    getBTPConfig: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_BTP_CONFIG);
        return response.data;
    },

    // Get group details
    getGroupDetails: async () => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_GROUP_DETAILS
        );
        return response.data;
    },

    // Create group
    createGroup: async (groupName) => {
        const response = await axiosInstance.post(
            API_PATHS.STUDENT.CREATE_GROUP,
            { groupName }
        );
        return response.data;
    },

    // Get all group invites
    getGroupInvites: async () => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_GROUP_INVITES
        );
        return response.data;
    },

    // Send invite
    sendInvite: async (payload) => {
        // payload contain { rollNumber }
        const response = await axiosInstance.post(
            API_PATHS.STUDENT.SEND_INVITE,
            payload
        );
        return response.data;
    },

    getMyInvites: async () => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_MY_INVITES
        );
        return response.data;
    },

    // Respond to invite (Accept / Reject)
    respondToInvite: async (inviteId, action) => {
        const response = await axiosInstance.patch(
            API_PATHS.STUDENT.RESPOND_INVITE(inviteId),
            { action } // "Accept" or "Reject"
        );
        return response.data;
    },

    // Withdraw invite
    withdrawInvite: async (inviteId) => {
        const response = await axiosInstance.delete(
            API_PATHS.STUDENT.WITHDRAW_INVITE(inviteId)
        );
        return response.data;
    },

    // Register group
    registerGroup: async () => {   
        const response = await axiosInstance.patch(
            API_PATHS.STUDENT.REGISTER_GROUP
        );
        return response.data;
    }

};

export default groupService;