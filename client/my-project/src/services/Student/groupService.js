import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const groupService = {

    getMyGroupDetails: async () => {
        const response = await axiosInstance.get(API_PATHS.STUDENT.GET_MY_GROUP);
        return response.data;
    }

}

export default groupService;

