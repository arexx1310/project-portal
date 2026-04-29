import React, { useState } from "react";
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
    const userSubRoles = user.faculty?.roles || []; 
    return roles.some((role) => userSubRoles.includes(role));
  };

  const adminLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, text: "Dashboard" },
    {
      text: "Session Management",
      icon: Settings2,
      isDropdown: true,
      subLinks: [
        { to: "/admin/managedepartments", icon: ListChecks, text: "Manage Departments"},
        { to: "/admin/sessions/create", icon: CalendarPlus, text: "Create Session" },
        { to: "/admin/managesession", icon: ListChecks, text: "Manage Sessions" },
      ],
    },
    {
      text: "Users Management",
      icon: User,
      isDropdown: true,
      subLinks: [
        { to: "/admin/students/upload", icon: Upload, text: "Upload Students" },
        { to: "/admin/faculty/upload", icon: Upload, text: "Upload Faculty" },
        { to: "/admin/faculty/manage", icon: ListChecks, text: "Manage Faculty" },
        { to: "/admin/student/manage", icon: ListChecks, text: "Manage Student" },
      ],
    },
  ];

  const facultyLinks = [
    { to: "/faculty/dashboard", icon: LayoutDashboard, text: "Dashboard" },
    { to: "/faculty/profile", icon: User, text: "Profile"},
    { to: "/faculty/btpconfig",icon: Settings2,text: "BTP Configuration"},
    hasFacultyRole(["BTP_COMMITTEE_HEAD","BTP_COMMITTEE_MEMBER"]) && { to: "/faculty/btp/student-management", icon: Settings2, text: "Student Management" },
    
    {
      text: "Groups Management",
      icon: Settings2,
      isDropdown: true,
      subLinks: [
          { to: "/faculty/btp/supervision-requests", icon: ListChecks, text: "Project Proposals"},
          { to: "/faculty/btp/supervised-groups", icon: Users, text: "My Groups"},
      ], 
    },

  ].filter(Boolean);

  const studentLinks = [
    { to: "/student/dashboard", icon: LayoutDashboard, text: "Dashboard" },
    { to: "/student/profile", icon: User, text: "Profile"},
    {
      text: "BTP Registrations",
      icon: Settings2,
      isDropdown: true,
      subLinks: [
        { to: "/student/groups-invites", icon: ListChecks, text: "Group Invitations"},
        { to: "/student/project/proposals", icon: ListChecks, text: "Project Proposal"},

      ],
    },
    { 
      text: "Groups and Project",
      icon: FileText,
      isDropdown : true,
      subLinks: [
          { to: "/student/btp/mygroup", icon: Users, text: "My Group"},      
      ]

    }
  ].filter(Boolean);

  const menuLinks = user?.role === "admin" ? adminLinks : user?.role === "faculty" ? facultyLinks : studentLinks;

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