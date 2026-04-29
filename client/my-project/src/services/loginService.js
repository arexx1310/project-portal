import axiosInstance from "../utils/axiosInstance.js";
import { API_PATHS } from "../utils/apiPaths.js";

/**
 * Admin Login
 */
const adminLogin = async (email, password) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AUTH.ADMIN_LOGIN,
      { email, password }
    );

    // Save token
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Admin login failed",
    };
  }
};

/**
 * Student / Faculty Login
 * @desc For general portal login
 */
const login = async (email, password) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AUTH.LOGIN, 
      { email, password }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout frontend par AuthContext handle kar raha hai, 
// par agar backend par session kill karna ho toh yahan add kar sakte hain.

const authService = {
  adminLogin,
  login,
};

export default authService;
