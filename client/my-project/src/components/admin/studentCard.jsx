import React from "react";
import { UserCog, Mail, Phone, Trash2, ShieldCheck } from "lucide-react";

const StudentCard = ({ member, onDelete }) => {
  const { user, rollNumber, department, phoneNumber, _id } = member;

  return (
    <div className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
      
      {/* 1. Top Header: Icon & Admin Badge Only */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
          <UserCog size={24} />
        </div>
        
        {/* Sirf Admin Badge upar rakha hai, agar hai toh */}
        {user?.role === "admin" && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wider">
            <ShieldCheck size={10} /> System Admin
          </span>
        )}
      </div>

      {/* 2. Identity Section */}
      <div className="mb-6 relative z-10">
        <h3 className="text-xl font-black text-slate-900 truncate leading-none mb-3" title={user?.name}>
          {user?.name || "Unknown Member"}
        </h3>
        
        {/* Department & ID Niche Ek Saath */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md uppercase tracking-widest">
            {department || "General"}
          </span>
          <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md border border-slate-100">
            ID: {rollNumber}
          </span>
        </div>
      </div>

      {/* 3. Details Box (Expandable) */}
      <div className="space-y-3 mb-8 flex-grow relative z-10">
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-200 transition-colors">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <Mail size={14} className="text-blue-500" />
          </div>
          <span className="text-xs font-bold text-slate-600 truncate">{user?.email || "N/A"}</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-200 transition-colors">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <Phone size={14} className="text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-600">{phoneNumber || "No Contact"}</span>
        </div>
      </div>

      {/* 4. Action Button */}
      <div className="pt-4 border-t border-slate-50 relative z-10">
        <button 
          onClick={() => onDelete(_id)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
        >
          <Trash2 size={16} /> Revoke Access
        </button>
      </div>
    </div>
  );
};
export default StudentCard;