import React from 'react';
import { 
  FileText, 
  UserCheck, 
  Layers, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight
} from 'lucide-react';

const ProposalCard = ({ proposal, onViewDetails }) => {
  const { 
    groupName, 
    projectTitle, 
    projectDomain, 
    semester, 
    status 
  } = proposal;

  const statusStyles = {
    Approved: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 size={16} strokeWidth={3} />,
      label: "Approved"
    },
    PendingSupervisorApproval: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <Clock size={16} strokeWidth={3} />,
      label: "Pending Review"
    },
    Rejected: {
      bg: "bg-rose-100",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <XCircle size={16} strokeWidth={3} />,
      label: "Rejected"
    }
  };

  const currentStatus = statusStyles[status] || statusStyles.PendingSupervisorApproval;

  return (
    <div className="flex flex-col h-full bg-white border-2 border-slate-100 rounded-[2rem] p-5 sm:p-7 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:border-indigo-200 transition-all duration-500 group relative overflow-hidden">
      
      {/* ─── VIBRANT TOP ACCENT ─── */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 group-hover:bg-violet-500 transition-colors" />

      {/* ─── TOP SECTION ─── */}
      <div className="flex flex-row justify-between items-start gap-4 mb-8">
        <div className="space-y-1.5 min-w-0 flex-1">
    
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight uppercase" title={groupName}>
             {groupName}
          </h3>
        </div>
        
        <div className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-2xl border-2 ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} shadow-sm`}>
          {currentStatus.icon}
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-grow flex flex-col">
        
        {/* Title Container: min-h ensures grid uniformity while allowing growth */}
        <div className="mb-8 min-h-[100px] sm:min-h-[120px] flex flex-col justify-start">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
              <FileText size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Title</p>
          </div>
          
          <p className="text-base sm:text-lg lg:text-xl font-black text-slate-800 leading-[1.3] group-hover:text-indigo-600 transition-colors">
            {projectTitle}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-amber-50/50 p-4 rounded-[1.5rem] border-2 border-amber-100/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Layers size={14} className="text-amber-500" />
              <p className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest">Domain</p>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate" title={projectDomain}>{projectDomain}</p>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-[1.5rem] border-2 border-indigo-100/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={14} className="text-indigo-500" />
              <p className="text-[9px] font-black text-indigo-600/70 uppercase tracking-widest">Semester</p>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700">{semester}</p>
          </div>
        </div>

       
      </div>

      {/* ─── ACTION BUTTON ─── */}
      <div className="mt-8">
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(proposal)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-xl shadow-indigo-100 group/btn"
          >
            <span className="text-xs font-black uppercase tracking-[0.15em]">Full Proposal</span>
            <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProposalCard;