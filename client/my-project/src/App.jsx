import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoutes";
import AppLayout from "./components/layout/AppLayout";

// Auth pages
import AdminLoginPage from "./pages/Auth/AdminLoginPage";
import LoginPage from "./pages/Auth/LoginPage";

// Admin pages
import AdminDashboard from "./pages/Admin/DashboardPage";
import CreateDepartmentPage from "./pages/Admin/DepartmentManagementPage";
import CreateSessionPage from "./pages/Admin/CreateSessionPage";
import ManageSessionPage from "./pages/Admin/ManageSessionPage";
import UploadStudentsPage from "./pages/Admin/UploadStudentPage";
import UploadFacultyPage from "./pages/Admin/UploadFacultyPage";
import ManageFacultyPage from "./pages/Admin/ManageFacultyPage";
import ManageStudentPage from "./pages/Admin/ManageStudentPage";

// Faculty pages
import FacultyDashboard from "./pages/Faculty/DashboardPage";
import FacultyProfilePage from "./pages/Faculty/ProfilePage";
import ChangePasswordFaculty from "./pages/Faculty/Security";
import BTPConfigPage from "./pages/Faculty/BTPConfigPage";
import SupervisionRequestsPage from "./pages/Faculty/SupervisionRequestPage";
import SupervisedGroupsPage from "./pages/Faculty/SupervisedGroupsPage";
import StudentsManagementPage from "./pages/Faculty/ReportPage";

// Student pages
import StudentDashboard from "./pages/Student/DashboardPage";
import StudentProfilePage from "./pages/Student/ProfilePage";
import ChangePasswordStudent from "./pages/Student/Security";
import MyGroupPage from "./pages/Student/MyGroupPage";
import BTPInvitesPage from "./pages/Student/InvitesPage";
import ProjectProposalPage from "./pages/Student/ProjectProposalPage";

// Common
import NotFoundPage from "./pages/NotFoundPage";

const roleHome = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "faculty") return "/faculty/dashboard";
  if (role === "student") return "/student/dashboard";
  return "/login";
};

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to={roleHome(user?.role)} replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={roleHome(user?.role)} replace />
              : <LoginPage />
          }
        />
        <Route
          path="/admin/login"
          element={
            isAuthenticated && user?.role === "admin"
              ? <Navigate to="/admin/dashboard" replace />
              : <AdminLoginPage />
          }
        />

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} redirectTo="/login" />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/managedepartments" element={<CreateDepartmentPage />} />
            <Route path="/admin/managesession" element={<ManageSessionPage />} />
            <Route path="/admin/sessions/create" element={<CreateSessionPage />} />
            <Route path="/admin/students/upload" element={<UploadStudentsPage />} />
            <Route path="/admin/faculty/upload" element={<UploadFacultyPage />} />
            <Route path="/admin/faculty/manage" element={<ManageFacultyPage />} />
            <Route path="/admin/student/manage" element={<ManageStudentPage />} />
          </Route>
        </Route>

        {/* FACULTY */}
        <Route element={<ProtectedRoute allowedRoles={["faculty"]} redirectTo="/login" />}>
          <Route element={<AppLayout />}>
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/profile" element={<FacultyProfilePage />} />
            <Route path="/faculty/change-password" element={<ChangePasswordFaculty/>}/>
            <Route path="/faculty/btpconfig" element={<BTPConfigPage />} />
            <Route path="/faculty/btp/supervision-requests" element={<SupervisionRequestsPage />} />
            <Route path="/faculty/btp/supervised-groups" element={<SupervisedGroupsPage />} />
            <Route path="/faculty/btp/student-management" element={<StudentsManagementPage />} />
          </Route>
        </Route>

        {/* STUDENT */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/login" />}>
          <Route element={<AppLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/change-password" element={<ChangePasswordStudent/>}/>
            <Route path="/student/btp/mygroup" element={<MyGroupPage />} />
            <Route path="/student/project/proposals" element={<ProjectProposalPage />} />
            <Route path="/student/groups-invites" element={<BTPInvitesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;