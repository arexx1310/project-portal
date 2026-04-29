import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Info,
  Layout,
  GraduationCap,
  MapPin
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import groupService from "../../services/Student/groupService";
import Header from "../../components/common/Header";

const MyGroupPage = () => {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await groupService.getMyGroupDetails();
        setGroup(res.group);
        setProjects(res.project || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load group details.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto mt-10 m-4 p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3">
      <Info className="w-5 h-5 flex-shrink-0" />
      <span className="font-semibold text-sm sm:text-base uppercase tracking-tight">{error}</span>
    </div>
  );

  // Empty State
  if (!group) return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <Header 
          title="Group Management" 
          subtitle="Overview of your team and project status" 
          icon={Layout} 
        />
        <div className="max-w-4xl mx-auto mt-6 p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-bold italic">No group found. Please join or create a group first.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        
        {/* ─── 1. TOP PAGE HEADER ─── */}
        <Header 
          title="Group Management" 
          subtitle="Overview of your team and project status" 
          icon={Layout} 
        />

        {/* ─── 2. ACTUAL GROUP DETAILS CARD ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-5 w-1 bg-blue-600 rounded-full"></div>
            <h2 className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-wider">Group Overview</h2>
          </div>
          <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 sm:opacity-10 pointer-events-none">
              <Users className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-3xl font-black text-blue-900 mb-4">{group.name}</h3>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-2">
                
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-slate-700">Session: {group.session}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-slate-700">Active Unit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. SUPERVISOR CARD ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-wider">Supervision Team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!group.supervisors?.length ? (
              <div className="md:col-span-2 bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center">
                <p className="text-slate-400 font-bold italic text-sm">No supervisors assigned yet.</p>
              </div>
            ) : (
              group.supervisors.map((supervisor) => (
                <div key={supervisor.email} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-emerald-300 transition-colors">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{supervisor.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 font-medium break-all">
                        <Mail size={12} className="flex-shrink-0" /> {supervisor.email}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 font-medium">
                        <Phone size={12} className="flex-shrink-0" /> {supervisor.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ─── 4. TEAM MEMBERS ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-5 w-1 bg-purple-500 rounded-full"></div>
            <h2 className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-wider">Team Members</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members?.map((member) => {
              const isCurrentUser = member.email?.toLowerCase() === user?.email?.toLowerCase();
              return (
                <div key={member.email} className={`p-5 rounded-2xl border-2 transition-all ${
                  isCurrentUser 
                  ? "bg-blue-50 border-blue-200 shadow-blue-100/50 shadow-md" 
                  : "bg-white border-slate-100 shadow-sm"
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Users size={18} />
                    </div>
                    {isCurrentUser && (
                      <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase">You</span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900 text-base leading-tight truncate">{member.name}</h4>
                  <p className="text-blue-600 text-[10px] font-bold font-mono mt-1 uppercase tracking-wider">{member.rollNumber}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Specialization</span>
                    <span className="text-xs font-bold text-slate-700 truncate block">{member.specialization}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 5. PROJECT DETAILS ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-5 w-1 bg-amber-500 rounded-full"></div>
            <h2 className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-wider">Project Submissions</h2>
          </div>
          <div className="space-y-4">
            {!projects.length ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-2xl text-center">
                <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-bold italic text-sm">No active projects found.</p>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project._id} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm border-t-4 sm:border-t-8 border-t-blue-600">
                  <div className="flex flex-col gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-3 uppercase break-words">{project.title}</h3>
                      <div className="flex flex-wrap gap-2">
                         <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-blue-100">
                          Sem {project.semester}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          {project.domain}
                        </span>
                      </div>
                    </div>
                    <div className={`self-start flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border ${
                      project.status === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                    }`}>
                      {project.status === 'Approved' ? <CheckCircle2 size={14} /> : <Calendar size={14} />}
                      {project.status}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Abstract / Scope</h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium italic">
                      "{project.description}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MyGroupPage;