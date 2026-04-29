// service/Student/projectProposalService.js

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const projectProposalService = {

    getAvailableProfessors: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_AVAILABLE_PROFESSORS);
        return response.data;
    },

    createProjectProposal : async (proposalData) => {
        const response = await axiosInstance.post(API_PATHS.STUDENT.CREATE_PROJECT_PROPOSAL,proposalData);
        return response.data;
    },

    getProjectProposals: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_PROJECT_PROPOSALS);
        return response.data;
    },

    projectProposalDetails : async (id) => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.PROJECT_PROPOSAL_DETAIL(id));
        return response.data;
    },

    deleteProjectProposal : async (id) => {
        const response = await axiosInstance.delete(API_PATHS.STUDENT.DELETE_PROJECT_PROPOSAL(id));
    }
} 

export default projectProposalService;