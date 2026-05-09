import React from 'react';
import { 
  FileText, Users, UserCheck, Calendar, 
  Mail, BookOpen, BadgeCheck, Clock, Layers, Globe,
  ArrowRight, Building2
} from 'lucide-react';

const ProposalDetail = ({ data }) => {
  if (!data) return null;

  const { 
    groupName, 
    departments, 
    members, 
    semester, 
    project, 
    supervisors, 
    status 
  } = data;

  const getStatusStyle = (currentStatus) => {
    const map = {
      PendingSupervisorApproval: { 
        label: "Awaiting Faculty", 
        color: "text-amber-600", 
        bg: "bg-amber-50", 
        border: "border-amber-200", 
        icon: <Clock size={16} /> 
      },
      Approved: { 
        label: "Approved", 
        color: "text-emerald-600", 
        bg: "bg-emerald-50", 
        border: "border-emerald-200", 
        icon: <BadgeCheck size={16} /> 
      },
      Rejected: { 
        label: "Rejected", 
        color: "text-rose-600", 
        bg: "bg-rose-50", 
        border: "border-rose-200", 
        icon: <BadgeCheck size={16} /> 
      },
      Accepted: { 
        label: "Accepted", 
        color: "text-emerald-600", 
        bg: "bg-emerald-50", 
        border: "border-emerald-200", 
        icon: <BadgeCheck size={14} /> 
      },
      Pending: { 
        label: "Pending", 
        color: "text-slate-400", 
        bg: "bg-slate-100", 
        border: "border-slate-200", 
        icon: <Clock size={14} /> 
      }
    };
    return map[currentStatus] || map.Pending;
  };

  const overall = getStatusStyle(status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ─── COMPACT HERO HEADER ─── */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 p-5 sm:p-8 shadow-lg shadow-slate-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-40" />
        
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-indigo-600">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Globe size={14} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {groupName} • Proposal Detail
              </span>
            </div>

            <div className={`flex items-center w-fit gap-1.5 px-3 py-1.5 rounded-xl border-2 shadow-sm ${overall.bg} ${overall.color} ${overall.border}`}>
              {overall.icon}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {overall.label}
              </span>
            </div>
          </div>

          {/* Smaller Title Font */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight max-w-4xl">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-4 border-t-2 border-slate-50">
            <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
              <Layers className="text-violet-600" size={14} />
              <span className="text-[11px] font-black text-violet-700 uppercase tracking-tight">{project.domain}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <BookOpen className="text-amber-600" size={14} />
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-tight">Sem {semester}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* ─── LEFT CONTENT ─── */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Project Abstract */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-50 p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
                <FileText size={24} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-widest underline decoration-indigo-500 decoration-4 underline-offset-8">
                Abstract
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg font-medium">
              {project.description}
            </p>
          </section>

          {/* Team Members */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-50 p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-2xl text-indigo-600">
                <Users size={24} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-widest underline decoration-indigo-500 decoration-4 underline-offset-8">
                Research Team
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((member, idx) => (
                <div key={idx} className="group p-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 uppercase text-sm tracking-tight truncate">{member.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-slate-500 truncate">
                        <Mail size={12} className="shrink-0" />
                        <span className="text-xs font-bold truncate">{member.email}</span>
                      </div>
                      <div className="mt-3 inline-block px-2 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 uppercase">
                        {member.specialization}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ─── RIGHT CONTENT ─── */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Review Progress */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="flex items-center gap-3 mb-10 relative">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <UserCheck size={20} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Review Timeline</h2>
            </div>
            
            <div className="space-y-10 relative">
              {supervisors.map((sv, idx) => {
                const svStyle = getStatusStyle(sv.status);
                return (
                  <div key={idx} className="relative pl-10">
                    {idx !== supervisors.length - 1 && (
                      <div className="absolute left-[11px] top-[24px] bottom-[-40px] w-0.5 bg-slate-100" />
                    )}
                    
                    <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 ${sv.status === 'Accepted' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    
                    <div className="group">
                      <p className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{sv.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{sv.email}</p>
                      
                      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 shadow-sm ${svStyle.bg} ${svStyle.color} ${svStyle.border}`}>
                        {svStyle.icon}
                        <span className="text-[10px] font-black uppercase tracking-tighter">{svStyle.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Affiliated Department (Converted to Light Theme) */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                <Building2 size={18} />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Affiliated Departments</h3>
            </div>
            <div className="space-y-3">
              {departments.map((dept, idx) => (
                <div key={idx} className="flex items-center gap-3 group cursor-default p-3 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                  
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">
                    {dept}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;