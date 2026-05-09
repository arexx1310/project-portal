import React from "react";
import { 
  Users, ShieldCheck, BookOpen, Calendar, 
  Mail, Layers, CheckCircle2, Clock, 
  AlertCircle, Lock, FileText, Fingerprint
} from "lucide-react";

const GroupDetails = ({ group, isPG = false }) => {
  if (!group) return null;

  const getStatusStyles = (status) => {
    const map = {
      draft: { color: 'text-slate-500', bg: 'bg-slate-50', icon: FileText, label: 'Draft' },
      active: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Active' },
      'supervisor requested': { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, label: 'Pending' },
      closed: { color: 'text-rose-600', bg: 'bg-rose-50', icon: Lock, label: 'Closed' },
      default: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertCircle, label: 'Formed' }
    };
    return map[status?.toLowerCase()] || map.default;
  };

  const status = getStatusStyles(group.status);
  const StatusIcon = status.icon;
  isPG = group.isPG;
  
  return (
    <div className="w-full mx-auto p-4">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col lg:flex-row">
        
        {/* --- LEFT SIDEBAR: Group Info --- */}
        <div className="lg:w-1/3 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 p-8 lg:p-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.color} border border-current/10 mb-6`}>
            <StatusIcon size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">{status.label}</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
            {group.name}
          </h1>

          {/* Only show Session/Dept if NOT PG */}
          {!isPG && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-2xl border border-slate-100">
                <Calendar size={18} className="text-blue-500" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Session</p>
                  <p className="text-sm font-bold">{group.session?.name || group.session}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-2xl border border-slate-100">
                <Layers size={18} className="text-indigo-500" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Department</p>
                  <p className="text-sm font-bold">{group.departments?.[0] || "General"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Supervisors - Always shown */}
          <div className="mt-10">
            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">
              <ShieldCheck size={14} /> Faculty Supervisors
            </h3>
            <div className="space-y-4">
              {group.supervisors?.map((sup, i) => (
                <div key={i} className="group">
                  <p className="font-bold text-slate-800 text-sm">{sup.name}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <a href={`mailto:${sup.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                      <Mail size={12} /> {sup.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT: Projects & Team --- */}
        <div className="lg:w-2/3 p-8 lg:p-10 space-y-10">
          
          {/* Projects Section - Always shown */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={20} className="text-blue-600" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {isPG ? "Research Projects" : "Active Projects"}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {group.projects?.map((project, idx) => (
                <div key={idx} className="relative group p-5 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Sem {project.semester}</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">{project.title}</h3>
                      <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-tight">{project.domain}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team Members Section - Hidden if isPG is true */}
          {!isPG && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Users size={20} className="text-purple-600" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Team Roster</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.members?.map((member, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black text-sm shadow-sm border border-slate-100">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 text-sm truncate">{member.name}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Fingerprint size={10} className="text-blue-500" />
                        <p className="text-[9px] font-mono font-bold text-slate-500">{member.rollNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default GroupDetails;