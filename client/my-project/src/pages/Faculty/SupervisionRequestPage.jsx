import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Users, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Calendar,
  ChevronRight,
  Mail,
  GraduationCap,
  MessageSquare,
  Filter,
  Info
} from "lucide-react";
import supervisionRequestService from "../../services/Faculty/supervisionRequestService";
import { toast } from "react-hot-toast";

// UI Components
import Header from "../../components/common/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

// ─── Constants & Styles ────────────────────────────────────────────────────
const STATUS_STYLES = {
  PendingSupervisorApproval: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  Approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Rejected: { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  Pending: { label: "Action Required", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Info },
  Accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

const getBadge = (status) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.color}`}>
      <Icon size={14} />
      {style.label}
    </span>
  );
};

// ─── RequestRow ────────────────────────────────────────────────────────────
function RequestRow({ request, onView }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-300 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3.5 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <FileText size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
            {request.project?.title || "Untitled Project"}
          </h4>
          <div className="flex flex-wrap items-center gap-3 mt-1">
             <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded">
               {request.group?.name}
             </span>
            {getBadge(request.myStatus)}
            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
              <Calendar size={13} /> {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => onView(request._id)}
        className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
      >
        Review <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── RequestDetail ─────────────────────────────────────────────────────────
function RequestDetail({ request, onBack, onRespond, responding }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!request) return null;

  const canRespond = request.myStatus === "Pending" && request.overallStatus === "PendingSupervisorApproval";

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) return toast.error("Please provide a reason.");
    onRespond(request._id, "reject", rejectionReason);
    setShowRejectModal(false);
  };

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group">
        <ArrowLeft size={18} /> Back to Requests
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header Section */}
        <div className="bg-slate-900 p-8 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Request Details
                </span>
                {getBadge(request.overallStatus)}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {request.project?.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-medium">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-white/80">{request.project?.domain}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} /> Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {canRespond && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => onRespond(request._id, "accept", null)}
                  disabled={responding}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {responding === "accept" ? "Processing..." : "Accept Request"}
                </button>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  disabled={responding}
                  className="px-8 py-3.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all border border-white/10"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Project Description
              </h3>
              <div className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-xl border border-slate-100">
                {request.project?.description}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={18} className="text-blue-600" /> Student Group: {request.group?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.students?.map((s, i) => (
                  <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-all shadow-sm">
                    <p className="font-bold text-slate-900 text-base">{s.name}</p>
                    <p className="text-blue-600 font-mono text-xs font-bold mt-0.5">{s.rollNumber}</p>
                    <div className="mt-4 space-y-2">
                      <div className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                        <Mail size={14} className="text-slate-400" /> {s.email}
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                        <GraduationCap size={14} className="text-slate-400" /> Sem {s.semester} • {s.specialization || "General"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Review Status</h3>
              <div className="space-y-4">
                {request.supervisors?.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' : 
                      s.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>

              {request.myRejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl mt-6">
                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Your Rejection Reason</p>
                  <p className="text-xs text-rose-700 font-medium italic">{request.myRejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectConfirm}
        title="Reason for Decline"
        message="Please provide a brief reason for rejecting this request. This helps students understand why and improve their next proposal."
        theme="red"
        loading={responding === "reject"}
      >
        <textarea
          className="w-full mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
          rows={3}
          placeholder="e.g., Domain mismatch, too many active projects..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const SupervisionRequestsPage = () => {
  const [view, setView] = useState("list");
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [responding, setResponding] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await supervisionRequestService.getAllRequests();
      setRequests(res.data || []);
    } catch (err) {
      toast.error("Failed to load requests.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleView = async (id) => {
    setView("detail");
    setDetailLoading(true);
    try {
      const res = await supervisionRequestService.getRequestDetails(id);
      setSelected(res.data);
    } catch (err) {
      toast.error("Could not load details.");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRespond = async (id, action, rejectionReason) => {
    try {
      setResponding(action);
      const payload = { action, ...(rejectionReason && { rejectionReason }) };
      await supervisionRequestService.responseRequest(id, payload);
      toast.success(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
      const res = await supervisionRequestService.getRequestDetails(id);
      setSelected(res.data);
      fetchRequests();
    } catch (err) {
      toast.error(err?.message || "Operation failed.");
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Supervision Requests" 
          subtitle="Review and respond to new project mentorship proposals" 
          icon={GraduationCap} 
        />

        {view === "list" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Request Inbox</h2>
                  <p className="text-slate-500 font-medium text-xs">
                    {requests.filter(r => r.myStatus === "Pending").length} pending requests
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-4">
              {listLoading ? (
                <div className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
              ) : requests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
                  <ShieldAlert size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-bold">No mentorship requests found.</p>
                </div>
              ) : (
                requests.map((request) => (
                  <RequestRow key={request._id} request={request} onView={handleView} />
                ))
              )}
            </div>
          </div>
        )}

        {view === "detail" && (
          detailLoading ? (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : (
            <RequestDetail
              request={selected}
              onBack={() => setView("list")}
              onRespond={handleRespond}
              responding={responding}
            />
          )
        )}
      </div>
    </div>
  );
};

export default SupervisionRequestsPage;