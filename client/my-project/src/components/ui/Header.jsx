import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Header = ({ 
  title, 
  subtitle, 
  icon: Icon,
}) => {
  return (
    <div className="w-full mx-auto px-4 sm:px-5 h-auto min-h-[6rem] py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full">
        {/* Icon: shrink-0 ensures it never gets smaller than 40px */}
        {Icon && (
          <div className="flex w-10 h-10 items-center justify-center bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-200 shrink-0">
            <Icon size={20} />
          </div>
        )}

        {/* Text Container */}
        <div className="min-w-0 flex-1"> 
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            /* Removed truncate so the full subtitle is visible */
            <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mt-1 break-words">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;