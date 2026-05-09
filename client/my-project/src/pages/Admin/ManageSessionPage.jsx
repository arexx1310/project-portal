import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import sessionService from "../../services/Admin/sessionService";
import {
  CheckCircle2, Loader2, Calendar, PlayCircle, Clock,
  ShieldCheck, Trash2, Plus
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import Header from "../../components/ui/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

const ManageSessionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionsList, setSessionList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "base", // green, red, base
    title: "",
    message: "",
    actionLabel: "",
    onConfirm: () => {},
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await sessionService.getSessions();
      setSessionList(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ─── Modal Triggers ────────────────────────────────────────────────────────

  const openActivateModal = (session) => {
    setModalConfig({
      isOpen: true,
      type: "green",
      title: "Activate Session?",
      message: `Are you sure you want to activate "${session.name}"? This will set the system context for all users.`,
      actionLabel: "Activate Now",
      onConfirm: () => handleAction(session._id, "activate"),
    });
  };

  const openDeleteModal = (session) => {
    setModalConfig({
      isOpen: true,
      type: "red",
      title: "Permanent Delete?",
      message: `This action cannot be undone. All student data for "${session.name}" will be removed as well.`,
      actionLabel: "Delete Forever",
      onConfirm: () => handleAction(session._id, "delete"),
    });
  };

  // ─── Action Handler ────────────────────────────────────────────────────────

  const handleAction = async (id, actionType) => {
    try {
      setActionLoading(true);
      let res;
      if (actionType === "activate") res = await sessionService.activateSession(id);
      if (actionType === "delete") res = await sessionService.deleteSession(id);

      if (res.success) {
        toast.success(res.message || `Session ${actionType}d successfully`);
        fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || "Action failed");
    } finally {
      setActionLoading(false);
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-slate-900" size={48} />
        <p className="font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">
          Syncing Academic Data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
        <Header
          title="Academic Session Control Hub"
          subtitle="Manage live and standby sessions"
          icon={ShieldCheck}
          actions={
            <button
              onClick={() => navigate("/admin/sessions/create")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              <Plus size={18} strokeWidth={3} />
              <span className="hidden sm:inline">New Session</span>
            </button>
          }
        />
        
        {sessionsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6">
              <Calendar size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No sessions found</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
              Initialize your first academic year to begin managing projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sessionsList.map((session) => (
              <div
                key={session._id}
                className={`group relative bg-white border-2 transition-all duration-500 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8
                  ${session.isActive 
                    ? "border-emerald-500 shadow-2xl shadow-emerald-100 ring-4 ring-emerald-50/50" 
                    : "border-slate-100 hover:border-slate-200 shadow-sm"}`}
              >
                {/* Info Section */}
                <div className="flex items-start sm:items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
                    ${session.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <Clock size={32} />
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-black text-slate-900 text-xl truncate">{session.name}</h3>
                      {session.isActive ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Live
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                          Standby
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                        <Calendar size={14} /> AY {session.academicYear}
                      </div>
                      <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                      <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        Odd Sem: <span className="text-slate-900 ml-1 font-mono">{new Date(session.oddSemester.startDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        Even Sem: <span className="text-slate-900 ml-1 font-mono">{new Date(session.evenSemester.startDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-3 lg:shrink-0">
                  {!session.isActive && (
                    <>
                      <button
                        onClick={() => openActivateModal(session)}
                        className="flex-1 lg:flex-none px-8 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-100 flex items-center justify-center gap-2 group/btn"
                      >
                        <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" /> 
                        Activate
                      </button>
                      <button
                        onClick={() => openDeleteModal(session)}
                        className="p-4 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                  
                  {session.isActive && (
                    <div className="text-emerald-600 font-black text-sm px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      Currently Active Session
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        theme={modalConfig.type}
        loading={actionLoading}
      >
        {modalConfig.actionLabel}
      </ConfirmModal>
    </div>
  );
};

export default ManageSessionPage;