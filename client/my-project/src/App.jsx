import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoutes";
import AppLayout from "./components/layout/AppLayout";
import Loader from "./components/ui/Loader";
import LandingPage from "./pages/LandingPage";
// Auth pages
import AdminLoginPage from "./pages/Auth/AdminLoginPage";
import LoginPage from "./pages/Auth/LoginPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPassword";
import VerifyOtpPage from "./pages/Auth/VerifyOTP";

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
import DeptConfigPage from "./pages/Faculty/DeptConfigPage";
import MyGroupsPage from "./pages/Faculty/MyGroupsPage";
import GroupDetailsPage from "./pages/Faculty/GroupDetailsPage";
import SupervisionRequestsPage from "./pages/Faculty/SupervisionRequestPage";
import StudentsManagementPage from "./pages/Faculty/ReportPage";

import DepartmentHub from "./pages/Faculty/DepartmentOveview";

// Student pages
// ====================== UG (BTECH) ======================= 
import StudentDashboard from "./pages/Student/DashboardPage";
import StudentProfilePage from "./pages/Student/ProfilePage";
import ProjectsPage from "./pages/Student/ProjectPage";
import GroupFormationPage from "./pages/Student/InvitesPage";
import MyProposals from "./pages/Student/ProposalList";
import CreateProposal from "./pages/Student/CreateProposal";

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
              : <LandingPage />   // ← was <Navigate to="/login" replace />
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp"      element={<VerifyOtpPage />} />

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
            <Route path="/faculty/config" element={<DeptConfigPage/>} />
            <Route path="/faculty/department-overview" element={<DepartmentHub/>}/>
            <Route path="/faculty/project-proposals/ug" element={<SupervisionRequestsPage />}/>
            <Route path="/faculty/project-proposals/pg" element={<SupervisionRequestsPage isPG={true}/>}/>
            <Route path="/faculty/my-groups" element={<MyGroupsPage/>}/>
            <Route path="/faculty/pg/students" element={<MyGroupsPage isPG={true}/>}/>
            <Route path="/faculty/my-groups/:groupId" element={<GroupDetailsPage/>}/>
          </Route>
        </Route>

        {/* STUDENT */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/login" />}>
          <Route element={<AppLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/group-formation" element={<GroupFormationPage/>}/>
            <Route path="/student/project-proposals" element={<MyProposals/>}/>
            <Route path="/student/create-proposal" element={<CreateProposal/>}/>
            <Route path="/student/btp/projects" element={<ProjectsPage/>}/>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;