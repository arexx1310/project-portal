import { useState, useEffect, useCallback } from "react";
import { 
  Users, Layers, ArrowLeft, ChevronRight, Mail, 
  Phone, GraduationCap, Calendar, BookOpen,
  Clock, IdCard, Trophy, LayoutGrid, Filter, UserCheck
} from "lucide-react";
import supervisedGroupService from "../../services/Faculty/supervisedGroupsService";
import generalServices from "../../services/Faculty/generalService";
import Header from "../../components/common/Header";

// ─── Constants ─────────────────────────────────────────────────────────────
const GROUP_STATUS_LABELS = {
  Formed: "Formed",
  SupervisorRequested: "Requested",
  Active: "Active",
  Closed: "Closed",
};

const getStatusStyles = (status) => {
  switch (status) {
    case "Active":
    case "Approved":
    case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Closed": return "bg-slate-100 text-slate-600 border-slate-200";
    default: return "bg-blue-50 text-blue-700 border-blue-100";
  }
};

// ─── Loader Component ──────────────────────────────────────────────────────
const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-[50vh] md:h-[60vh] gap-4 p-6 text-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    <p className="text-slate-400 font-black italic uppercase animate-pulse text-[9px] md:text-[10px] tracking-[0.2em]">{message}</p>
  </div>
);

// ─── GroupCard (UPDATED to show student names) ─────────────────────────────
function GroupCard({ group, onView }) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-500 group relative flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 md:p-4 bg-slate-900 text-white rounded-xl md:rounded-2xl shadow-lg group-hover:bg-blue-600 transition-colors">
          <Users size={20} className="md:w-6 md:h-6" />
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider border ${getStatusStyles(group.status)}`}>
          {GROUP_STATUS_LABELS[group.status] || group.status}
        </span>
      </div>
      
      <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">
        {group.name}
      </h3>
      
      {/* Students List Section */}
      <div className="mb-6 flex-1">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <UserCheck size={12} className="text-blue-500" /> Team Members
        </p>
        <div className="flex flex-wrap gap-1.5">
          {group.students?.map((student, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded-lg group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all"
            >
              {student.name}
            </span>
          ))}
          {!group.students?.length && <span className="text-[10px] text-slate-400 italic">No members assigned</span>}
        </div>
      </div>

      <div className="pt-4 md:pt-6 border-t border-slate-50 mt-auto">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Supervisory Panel</p>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
             {group.supervisors?.map((s, i) => (
                <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-blue-600 uppercase">
                  {s.name.charAt(0)}
                </div>
             ))}
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-700 truncate italic max-w-[120px]">
            {group.supervisors?.[0]?.name}{group.supervisors?.length > 1 ? " + others" : ""}
          </p>
        </div>
      </div>

      <button 
        onClick={() => onView(group._id)}
        className="w-full mt-6 md:mt-8 py-3 md:py-4 bg-slate-50 text-slate-900 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
      >
        View Full Profile <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── GroupDetail ───────────────────────────────────────────────────────────
function GroupDetail({ data, onBack }) {
  if (!data) return null;
  const { group, students, project: projects, supervisors } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-all py-2"
      >
        <ArrowLeft size={14} /> Back to Directory
      </button>

      <div className="bg-white rounded-3xl md:rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        {/* Header Section */}
        <div className="relative bg-slate-900 p-8 md:p-16 text-white">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
              {/* Mapping Departments Array */}
              {group.departments?.map((dept, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5">
                  {dept}
                </span>
              ))}
              <span className={`px-3 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(group.status)}`}>
                {group.status}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-4 md:mb-6">
              {group.name || projects[0]?.title || "Research Group"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
              <span className="flex items-center gap-2 border-r border-white/10 pr-4 md:pr-6 shrink-0">
                 <Calendar size={14} className="text-blue-500" /> {group.session?.name}
              </span>
              <span className="flex items-center gap-2">
                <Trophy size={14} className="text-blue-500" /> {students?.length} MEMBERS
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10 md:space-y-12">
            
            {/* Project Section */}
            <section>
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <LayoutGrid size={16} className="text-blue-600" /> Research Roadmap
              </h3>
              
              {(!projects || projects.length === 0) ? (
                <div className="p-8 md:p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs font-bold">
                  No active projects documented.
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {projects.map((p) => (
                    <div key={p._id} className="p-6 md:p-8 bg-slate-50/50 rounded-2xl md:rounded-[2rem] border border-slate-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                        <div>
                          <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{p.title}</h4>
                          <span className="text-blue-600 font-black text-[8px] md:text-[9px] uppercase tracking-widest">{p.domain}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-white ${getStatusStyles(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed mb-6 font-medium text-xs md:text-sm italic">
                        "{p.description}"
                      </p>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                         Semester {p.semester} • {p.session.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Team Roster */}
            <section>
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <Users size={16} className="text-blue-600" /> Team Roster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {students?.map((s, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-black text-slate-900 uppercase text-sm">{s.username}</p>
                      <span className="text-blue-600 text-[8px] font-black px-1.5 py-0.5 bg-blue-50 rounded border border-blue-100">
                        #{s.rollNumber}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold truncate mb-1">
                      {s.email}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold mb-2">
                      <Phone size={10} className="inline mr-1" /> {s.phoneNumber}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      SEM {s.semester} • {s.specialization}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              <section>
                <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <IdCard size={16} className="text-emerald-600" /> Supervisors
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {supervisors?.map((s, i) => (
                    <div key={i} className="p-5 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
                      <p className="font-black text-slate-900 text-sm uppercase">PROF. {s.name}</p>
                    
                      <div className="mt-4 pt-4 border-t border-emerald-100/60 space-y-2">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase">
                          <Mail size={12} className="text-emerald-500" /> 
                          {s.email}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase">
                          <Phone size={12} className="text-emerald-500" /> 
                          {s.phoneNumber}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const SupervisedGroupsPage = () => {
  const [view, setView] = useState("list");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(""); 
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await generalServices.getSessions();
        setSessions(res.data || []);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };
    fetchSessions();
  }, []);

  const fetchGroups = useCallback(async (sessionId) => {
    try {
      setGroupsLoading(true);
      const res = await supervisedGroupService.getAllGroups(sessionId);
      setGroups(res.data || []);
      setGroupsError(null);
    } catch (err) {
      setGroupsError("Service unavailable.");
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchGroups(selectedSession); 
  }, [selectedSession, fetchGroups]);

  const handleViewGroup = async (id) => {
    setView("detail");
    setDetailLoading(true);
    try {
      const res = await supervisedGroupService.getGroupDetails(id);
      setSelectedDetail(res.data);
    } catch (err) {
      setDetailError("Unable to retrieve group profile.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => { setView("list"); setSelectedDetail(null); setDetailError(null); };

  if (view === "detail") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
        {detailLoading ? (
          <Loader message="Syncing Profile..." />
        ) : detailError ? (
          <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-rose-100 text-center shadow-lg">
            <p className="text-rose-500 font-black uppercase tracking-widest text-[10px] mb-8">{detailError}</p>
            <button onClick={handleBack} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Return to List</button>
          </div>
        ) : (
          <GroupDetail data={selectedDetail} onBack={handleBack} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 md:pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        
        <Header 
          title="Mentor Dashboard" 
          subtitle="Real-time oversight of supervised groups" 
          icon={Layers} 
        />

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="w-full md:w-72 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
              <Filter size={14} />
            </div>
            <select 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="">Current Session (Active)</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  Session: {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {groupsLoading ? (
                <div className="col-span-full"><Loader message="Fetching Directory..." /></div>
              ) : groupsError ? (
                <div className="col-span-full p-8 bg-rose-50 text-rose-500 rounded-3xl font-black uppercase text-[10px] text-center">{groupsError}</div>
              ) : groups.length === 0 ? (
                <div className="col-span-full p-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                  No groups found for this session.
                </div>
              ) : (
                groups.map((group) => <GroupCard key={group._id} group={group} onView={handleViewGroup} />)
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisedGroupsPage;