import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, User, Menu } from "lucide-react";

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu */}
        <button
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-600 lg:hidden transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 hidden lg:flex" />

        <div className="flex items-center gap-4">
          {/* Notifications (future use) */}
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={()=> navigate(`/${user.role}/dashboard`)}>
            <Bell size={20} strokeWidth={2} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" />
          </button>

          {/* User Info */}
          <div className="pl-4 border-l border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-600 flex items-center justify-center text-white shadow-lg">
                <User size={18} strokeWidth={2.5} />
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-500 mt-1 leading-none">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
