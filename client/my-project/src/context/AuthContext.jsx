import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ─── Session Restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.AUTH.ME);
        setUser(data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ─── Auth Actions ─────────────────────────────────────────────────────────
  const login = useCallback(async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    } catch {
      // ignore error
    }
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    window.location.href = "/";
  }, []);

  // ─── Context Value ────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
