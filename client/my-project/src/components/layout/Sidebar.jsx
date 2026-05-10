import React, { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  CalendarPlus,
  User,
  Users,
  Upload,
  Info,
  LogOut,
  ChevronDown,
  Settings2,
  ListChecks,
  FileText,
  GraduationCap,
} from "lucide-react";
import nsutlogo from "../../assets/nsut-logo.png";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hasFacultyRole = (roles) => {
    if (!user || user.role !== "faculty") return false;
    const userSubRoles = user.roles || []; 
    return roles.some((role) => userSubRoles.includes(role));
  };

  const menuLinks = useMemo(() => {
    if (!user) return [];

    if (user.role === "admin") {
      return [
        { to: "/admin/dashboard", icon: LayoutDashboard, text: "Dashboard" },
        {
          text: "Sessions",
          icon: Settings2,
          isDropdown: true,
          subLinks: [
            { to: "/admin/managedepartments", icon: ListChecks, text: "Departments" },
            { to: "/admin/sessions/create", icon: CalendarPlus, text: "Create Session" },
            { to: "/admin/managesession", icon: ListChecks, text: "Manage Sessions" },
          ],
        },
        {
          text: "Users",
          icon: User,
          isDropdown: true,
          subLinks: [
            { to: "/admin/students/upload", icon: Upload, text: "Upload Students" },
            { to: "/admin/faculty/upload", icon: Upload, text: "Upload Faculty" },
            { to: "/admin/faculty/manage", icon: ListChecks, text: "Manage Faculty" },
            { to: "/admin/student/manage", icon: ListChecks, text: "Manage Students" },
          ],
        },
      ];
    }

    if (user.role === "faculty") {
      return [
        { to: "/faculty/dashboard", icon: LayoutDashboard, text: "Dashboard" },
        { to: "/faculty/profile", icon: User, text: "Profile" },

        {
          text: "Department",
          icon: Settings2,
          isDropdown: true,
          subLinks: [
            {
              to: "/faculty/config",
              icon: Settings2,
              text: "Department Config",
            },

            hasFacultyRole([
              "BTP_COMMITTEE_HEAD",
              "BTP_COMMITTEE_MEMBER",
              "HOD",
            ]) && {
              to: "/faculty/department-overview",
              icon: ListChecks,
              text: "Department Overview",
            },

            hasFacultyRole([
              "BTP_COMMITTEE_HEAD",
              "BTP_COMMITTEE_MEMBER",
              "HOD",
            ]) && {
              to: "/faculty/student-management",
              icon: FileText,
              text: "Reports",
            },
          ].filter(Boolean),
        },

        {
          text: "B.Tech Groups",
          icon: ListChecks,
          isDropdown: true,
          subLinks: [
            { to: "/faculty/my-groups", icon: ListChecks, text: "My Groups" },
            {
              to: "/faculty/project-proposals/ug",
              icon: FileText,
              text: "Proposals",
            },
          ],
        },

        {
          text: "M.Tech Projects",
          icon: ListChecks,
          isDropdown: true,
          subLinks: [
            { to: "/faculty/pg/students", icon: ListChecks, text: "My Scholars" },
            {
              to: "/faculty/project-proposals/pg",
              icon: FileText,
              text: "Proposals",
            },
          ],
        },
      ].filter(Boolean);
    }

    // Student Links
    return [
      { to: "/student/dashboard", icon: LayoutDashboard, text: "Dashboard" },
      { to: "/student/profile", icon: User, text: "Profile"},
      { 
        text: "Project Management",
        icon: FileText,
        isDropdown: true,
        subLinks: [
          { to: "/student/project-proposals", icon: ListChecks, text: "Project Proposal" },
          { to: "/student/btp/projects", icon: GraduationCap, text: "My Projects" }
        ].filter(Boolean)
      }
    ];
  }, [user]);
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />
      <aside
        className={`fixed top-0 left-0 h-[100dvh] w-72 bg-slate-900 border-r border-slate-800 z-50 flex flex-col md:sticky transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-4">
          <div className="w-13 h-13 flex-shrink-0 flex items-center justify-center bg-white rounded-full p-1">
            <img src={nsutlogo} alt="NSUT Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">
              BTP Portal
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuLinks.map((link, index) => {
            if (link.isDropdown) {
              const isOpen = openDropdown === link.text;
              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={() => toggleDropdown(link.text)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-semibold transition ${
                      isOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon size={20} />
                      {link.text}
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100 py-1" : "max-h-0 opacity-0"}`}>
                    {link.subLinks.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                            isActive 
                              ? "bg-blue-600 text-white" 
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`
                        }
                      >
                        <sub.icon size={18} />
                        {sub.text}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    isActive 
                      ? "bg-slate-600 text-white shadow-lg shadow-slate-900/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <link.icon size={20} />
                {link.text}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold transition group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;