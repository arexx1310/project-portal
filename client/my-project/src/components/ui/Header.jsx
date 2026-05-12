import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Header = ({ 
  title, 
  subtitle, 
  icon: Icon,
 }) => {
  return (

      <div className="w-full mx-auto px-2 sm:px-5 h-24 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Icon & Titles */}
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="flex w-10 h-10 items-center justify-center bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-200 shrink-0">
                <Icon size={20} />
              </div>
            )}
            <div className="truncate">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  
  );
};

export default Header;