import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import Loader from "../ui/Loader";
const ProtectedRoute = ({
  allowedRoles = [],     // e.g. ["admin"], ["student"], ["faculty"]
  redirectTo = "/login", // fallback route
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // While checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader/>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Role-based check (only if roles provided)
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
