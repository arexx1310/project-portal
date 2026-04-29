import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 403) console.error("Access denied.");
      if (status >= 500) console.error("Server error. Try again later.");

      return Promise.reject(
        new Error(data?.message || "Something went wrong. Please try again.")
      );
    }

    if (error.code === "ECONNABORTED") console.error("Request timeout.");

    return Promise.reject(
      new Error(error.message || "Something went wrong. Please try again.")
    );
  }
);

export default axiosInstance;