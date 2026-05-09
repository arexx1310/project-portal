// service/Student/projectProposalService.js

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const projectProposalService = {

    // Get all departments
    getDepartments: async () => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_DEPARTMENTS
        );
        return response.data;
    },

    // Get available professors by department ID
    getAvailableProfessors: async (departmentId) => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_AVAILABLE_PROF(departmentId)
        );
        
        return response.data;
    },

    // Create new project proposal request
    createRequest: async (proposalData) => { // For BTECH STUDENTS
        const response = await axiosInstance.post(
            API_PATHS.STUDENT.CREATE_REQUEST,
            proposalData
        );
        return response.data;
    },

    createMTPRequest: async (proposalData) => { // For MTECH STUDENTS
        const response = await axiosInstance.post(
            API_PATHS.STUDENT.SEND_SUPERVISOR_INVITE,
            proposalData
        )
        return response.data;
    },

    // Get all requests of current student
    getMyRequests: async () => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_MY_REQUESTS
        );
        return response.data;
    },

    // Get details of a specific request
    getRequestDetails: async (id) => {
        const response = await axiosInstance.get(
            API_PATHS.STUDENT.GET_REQUEST_DETAILS(id)
        );
        return response.data;
    },

    // Withdraw (delete) a request
    withdrawRequest: async (id) => {
        const response = await axiosInstance.delete(
            API_PATHS.STUDENT.WITHDRAW_REQUEST(id)
        );
        return response.data;
    }
};

export default projectProposalService;