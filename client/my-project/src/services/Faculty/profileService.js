import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const profileService = {

    getProfile : async () => {
        const res = await axiosInstance.get(API_PATHS.FACULTY.GET_PROFILE);
        return res.data;
    },

    updatePassword: async (updateData) => {
        const res = await axiosInstance.put(
            API_PATHS.FACULTY.UPDATE_PASSWORD,
            updateData
        );
        return res.data;
    }
}

export default profileService;