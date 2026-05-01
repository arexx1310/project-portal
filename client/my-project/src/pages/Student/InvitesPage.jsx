import { useState, useEffect, useCallback } from "react";
import { 
  Users, Plus, ArrowLeft, Search, UserPlus, X, CheckCircle2, XCircle, 
  Clock, ShieldAlert, Calendar, ChevronRight, UserCheck, Send, Trash2, Info, Building2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import btpInviteService from "../../services/Student/btpInviteService";
import { toast } from "react-hot-toast";

// UI Components
import Header from "../../components/common/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

// ─── Constants ─────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  PendingMemberApproval: "Pending Approval",
  Approved: "Approved",
  Rejected: "Rejected",
};

const getStatusColor = (status) => {
  switch (status) {
    case "Approved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Rejected": return "bg-rose-50 text-rose-700 border-rose-100";
    default: return "bg-amber-50 text-amber-700 border-amber-100";
  }
};


// ─── Department Policy Banner ──────────────────────────────────────────────
const DepartmentPolicyBanner = ({ data }) => {
  if (!data) return null;
  const { department, btpConfig } = data;

  const infoItems = [
    { label: "Group Size", value: `${btpConfig.minStudentsPerGroup} - ${btpConfig.maxStudentsPerGroup} Students` },
    { label: "Supervisors", value: `${btpConfig.minSupervisors} - ${btpConfig.maxSupervisors} per Group` },
    { label: "Cross-Dept", value: btpConfig.crossDepartmentRules.isAllowed ? `Allowed (Min ${btpConfig.crossDepartmentRules.minSameDepartmentStudents} from ${department.split(' ')[0]})` : "Not Allowed" },
    { label: "Group Deadline", value: new Date(btpConfig.groupCreationDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }
  ];

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 overflow-hidden relative">
      {/* Aesthetic Background Element */}
      <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
        <ShieldAlert size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg text-white">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Departmental Protocol</h3>
            <p className="text-white font-bold text-sm leading-tight">{department}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {infoItems.map((item, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 p-3 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-xs font-bold text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Policy Box Component ──────────────────────────────────────────────────
const PolicyBanner = () => (
  <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm flex gap-4 items-start">
    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
      <Info size={20} />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Formation Policies</h3>
      <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside font-medium">
        <li>Groups are <span className="text-blue-600 font-bold">Automatically Approved</span> once all invited members accept.</li>
        <li>You can only have <span className="text-amber-600 font-bold">one active invitation</span> or approved group at a time.</li>
        <li>Withdrawing an invitation will notify all peers and clear your current slot.</li>
      </ul>
    </div>
  </div>
);

// ─── MemberSearchRow ───────────────────────────────────────────────────────
function MemberSearchRow({ member, onRemove }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-300 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
          {member.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 leading-tight">{member.name}</p>
          <p className="text-[10px] font-mono text-slate-500 uppercase">{member.rollNumber}</p>
        </div>
      </div>
      <button 
        type="button" 
        onClick={() => onRemove(member._id)}
        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── CreateInviteForm ──────────────────────────────────────────────────────
function CreateInviteForm({ config, onSubmit, onCancel, submitting, submitError }) {
  const [groupName, setGroupName]         = useState("");
  const [rollInput, setRollInput]         = useState("");
  const [addedMembers, setAddedMembers]   = useState([]); 
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [validationError, setValidationError] = useState(null);

  const min = config?.btpConfig?.minStudentsPerGroup ?? 1;
  const max = config?.btpConfig?.maxStudentsPerGroup ?? 4;
  const currentTotal = addedMembers.length + 1;
  const canAddMore   = currentTotal < max;

  const handleSearch = async () => {
    const roll = rollInput.trim().toUpperCase();
    if (!roll) return setSearchError("Enter a roll number.");
    if (addedMembers.some((m) => m.rollNumber === roll)) {
      return setSearchError("Member already added.");
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const res = await btpInviteService.searchMemberByRoll(roll);
      setAddedMembers((prev) => [...prev, res.data]);
      setRollInput("");
    } catch (err) {
      setSearchError(err?.message || "Member not found.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRemove = (id) => {
    setAddedMembers((prev) => prev.filter((m) => m._id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);
    if (!groupName.trim()) return setValidationError("Group name is required.");
    if (currentTotal < min) return setValidationError(`Add ${min - currentTotal} more member(s).`);
    
    onSubmit({
      groupName: groupName.trim(),
      membersIds: addedMembers.map((m) => m._id),
    });
  };

  return (
    <div className="w-full mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Create Group Invite</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Invite your peers to collaborate</p>
        </div>
        <div className="p-3 bg-slate-800 rounded-2xl text-blue-400">
          <UserPlus size={32} />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-8 space-y-8">
        {config && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
              <Users className="text-blue-500 shrink-0" size={24} />
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Required Size</p>
                <p className="text-sm font-bold text-blue-900">{min}–{max} Students</p>
              </div>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center gap-4">
              <Calendar className="text-amber-500 shrink-0" size={24} />
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Deadline</p>
                <p className="text-sm font-bold text-amber-900">
                  {new Date(config?.btpConfig?.groupCreationDeadline).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Group Name *</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
            placeholder="Enter a catchy group name..."
            disabled={submitting}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Team Members ({currentTotal}/{max})
            </label>
            <span className="text-[10px] font-bold text-slate-400">You are included automatically</span>
          </div>

          {canAddMore ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none transition-all font-mono text-sm uppercase"
                  placeholder="Student Roll Number"
                  disabled={submitting || searchLoading}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={submitting || searchLoading || !rollInput.trim()}
                className="px-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {searchLoading ? "..." : <Plus size={20} />}
                Add
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold flex items-center gap-2 justify-center">
              <CheckCircle2 size={16} /> Maximum capacity reached for this group.
            </div>
          )}

          {searchError && <p className="text-xs font-bold text-rose-500 ml-1 flex items-center gap-1"><XCircle size={12}/> {searchError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {addedMembers.length === 0 ? (
              <div className="sm:col-span-2 text-center py-10 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-3xl">
                No members added yet. Search by roll number above.
              </div>
            ) : (
              addedMembers.map((m) => (
                <MemberSearchRow key={m._id} member={m} onRemove={handleRemove} />
              ))
            )}
          </div>
        </div>

        {(validationError || submitError) && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2">
            <ShieldAlert size={16} /> {validationError || submitError}
          </div>
        )}

        <div className="flex gap-3 pt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? "Sending..." : <><Send size={18}/> Send Invites</>}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-8 border border-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── InviteRow ─────────────────────────────────────────────────────────────
function InviteRow({ invite, isInitiator, onView, onCancel }) {
  const status = STATUS_LABELS[invite.status] || invite.status;
  
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-lg hover:border-blue-300 transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${isInitiator ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white shadow-lg shadow-purple-100'}`}>
          <Users size={24} />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{invite.groupName}</h4>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invite.status)}`}>
              {status}
            </span>
            <span className="text-slate-400 text-[10px] flex items-center gap-1 font-bold">
              <Clock size={12} /> {new Date(invite.createdAt).toLocaleDateString()}
            </span>
            {isInitiator && (
              <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded font-black uppercase border border-slate-200">Initiator</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onView(invite._id)}
          className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          View Details <ChevronRight size={16} />
        </button>
        {isInitiator && invite.status === "PendingMemberApproval" && (
          <button
            onClick={() => onCancel(invite._id)}
            className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
            title="Cancel Invite"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── InviteDetail ──────────────────────────────────────────────────────────
function InviteDetail({
  invite,
  currentUserEmail,
  onBack,
  onCancel,
  onRespond,
  cancelling,
  responding,
  respondError,
}) {
  if (!invite) return null;

  const isInitiator = invite.initiator?.email?.toLowerCase() === currentUserEmail?.toLowerCase();
  const mySlot = invite.members?.find(m => m.email?.toLowerCase() === currentUserEmail?.toLowerCase());
  const canRespond = !isInitiator && mySlot?.status === "Pending" && invite.status === "PendingMemberApproval";
  const canCancel = isInitiator && invite.status === "PendingMemberApproval";

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group px-2">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Return to Dashboard
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black leading-tight uppercase italic tracking-tighter">{invite.groupName}</h2>
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invite.status)}`}>
                {STATUS_LABELS[invite.status]}
              </span>
              <p className="text-slate-400 text-xs font-bold flex items-center gap-2 italic">
                <Calendar size={14} /> Created on {new Date(invite.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          {canRespond && (
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Accept Invitation?</p>
               <div className="flex gap-2">
                 <button 
                  onClick={() => onRespond(invite._id, "accept")} 
                  disabled={responding} 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50"
                 >
                    {responding === "accept" ? "..." : "Accept"}
                 </button>
                 <button 
                  onClick={() => onRespond(invite._id, "reject")} 
                  disabled={responding} 
                  className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                 >
                    {responding === "reject" ? "..." : "Reject"}
                 </button>
               </div>
               {respondError && <p className="text-[9px] text-rose-400 mt-2 font-bold">{respondError}</p>}
            </div>
          )}
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserCheck size={16} className="text-blue-600" /> Initiator Profile
            </h3>
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 relative group">
               <p className="text-2xl font-black text-slate-900 leading-tight">{invite.initiator?.name} {isInitiator && "(You)"}</p>
               <p className="text-blue-600 font-mono text-sm mt-1 font-bold">{invite.initiator?.rollNumber}</p>
               <div className="mt-6 space-y-2">
                <p className="text-slate-500 text-xs font-medium flex items-center gap-2 italic underline underline-offset-4">
                  {invite.initiator?.email}
                </p>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users size={16} className="text-purple-600" /> Peer Invitations
            </h3>
            <div className="space-y-3">
              {invite.members?.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-purple-200 transition-all">
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{m.name} {m.email?.toLowerCase() === currentUserEmail?.toLowerCase() && "(You)"}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5">{m.rollNumber}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    m.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    m.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-slate-50 text-slate-400 border-slate-200 italic'
                  }`}>
                    {m.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canCancel && (
          <div className="px-10 pb-10">
            <button 
              onClick={() => onCancel(invite._id)}
              className="w-full py-5 border-2 border-dashed border-rose-200 text-rose-500 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 size={20} /> Withdraw All Invitations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const BTPInvitesPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState("list"); 
  const [config, setConfig]               = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
 
  const [invites, setInvites]                   = useState([]);
  const [invitesLoading, setInvitesLoading]     = useState(false);
  const [invitesError, setInvitesError]         = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedInvite, setSelectedInvite]     = useState(null);
  const [detailError, setDetailError]           = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState(null);
  
  // Custom Modal States
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  
  const [responding, setResponding]             = useState(null);   
  const [respondError, setRespondError]         = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setConfigLoading(true);
        const res = await btpInviteService.getBTPConfig();
        setConfig(res.data || null);
      } catch (err) {
        toast.error(err.message || "Failed to load BTP configuration.");
      } finally {
        setConfigLoading(false);
      }
    })();
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      setInvitesLoading(true);
      const res = await btpInviteService.getMyInvites();
      setInvites(res.data || []);
    } catch (err) {
      setInvitesError(err.message || "Failed to load invites.");
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const deadlinePassed = config?.btpConfig?.groupCreationDeadline && new Date() > new Date(config?.btpConfig?.groupCreationDeadline);
  const hasActiveInvite = invites.some((inv) => inv.status === "PendingMemberApproval" || inv.status === "Approved");
  

  const handleViewDetail = async (id) => {
    setView("detail");
    setDetailLoading(true);
    try {
      const res = await btpInviteService.getInviteById(id);
      setSelectedInvite(res.data);
    } catch (err) {
      setDetailError(err.message || "Error fetching details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true);
      await btpInviteService.createGroupInvite(payload);
      toast.success("Invites sent successfully!");
      await fetchInvites();
      setView("list");
    } catch (err) {
      setSubmitError(err.message || "Failed to create group invite.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestCancel = (id) => {
    setPendingCancelId(id);
    setShowConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelId) return;
    try {
      setSubmitting(true); // Re-using state for modal loading
      await btpInviteService.cancelInvite(pendingCancelId);
      toast.success("Invitation withdrawn.");
      await fetchInvites();
      if (view === "detail") setView("list");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
      setPendingCancelId(null);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      setResponding(action);
      await btpInviteService.memberResponse(id, { action });
      const res = await btpInviteService.getInviteById(id);
      setSelectedInvite(res.data);
      await fetchInvites();
    } catch (err) {
      setRespondError(err.message || "Unable to process response.");
    } finally {
      setResponding(null);
    }
  };

  if (configLoading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Group Formation" 
          subtitle="Collaborate with peers to create your research group" 
          icon={Users} 
        />

        {/* Highlighted Policy Box */}
        {view === "list" && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* New Department Policy Box */}
            <DepartmentPolicyBanner data={config} />
            
            {/* Existing Formation Policy Box */}
            <PolicyBanner />
          </div>
        )}

        {view === "list" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              {!deadlinePassed && !hasActiveInvite && (
                <button 
                  onClick={() => { setSubmitError(null); setView("create"); }}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2 group"
                >
                  <Plus className="group-hover:rotate-90 transition-transform" /> Start a Group
                </button>
              )}
              {hasActiveInvite && !deadlinePassed && (
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl font-bold italic text-sm border border-blue-100">
                  <ShieldAlert size={20} /> You have an active pending group request or approved request.
                </div>
              )}
            </div>

            {deadlinePassed && (
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl flex items-center gap-4 font-black italic uppercase text-sm">
                <ShieldAlert size={24} /> The group formation deadline has officially passed.
              </div>
            )}

            <div className="space-y-4">
               {invitesLoading && <div className="p-20 text-center text-slate-400 font-black italic animate-pulse tracking-widest">SYNCING INVITES...</div>}
               {!invitesLoading && invites.length === 0 && (
                 <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center space-y-6">
                   <div className="p-8 bg-slate-50 rounded-full w-fit mx-auto text-slate-200"><Users size={64} /></div>
                   <p className="text-slate-500 font-black italic text-xl uppercase tracking-tighter">Your invitation tray is empty</p>
                 </div>
               )}
               <div className="grid grid-cols-1 gap-4">
                {invites.map((invite) => (
                  <InviteRow
                    key={invite._id}
                    invite={invite}
                    isInitiator={invite.initiatorEmail?.toLowerCase() === user?.email?.toLowerCase()}
                    onView={handleViewDetail}
                    onCancel={requestCancel}
                  />
                ))}
               </div>
            </div>
          </div>
        )}

        {view === "create" && (
          <CreateInviteForm
            config={config}
            onSubmit={handleCreate}
            onCancel={() => setView("list")}
            submitting={submitting}
            submitError={submitError}
          />
        )}

        {view === "detail" && (
          <InviteDetail
            invite={selectedInvite}
            currentUserEmail={user?.email}
            onBack={() => setView("list")}
            onCancel={requestCancel}
            onRespond={handleRespond}
            responding={responding}
            respondError={respondError}
          />
        )}
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        onConfirm={handleConfirmCancel}
        onClose={() => { setShowConfirm(false); setPendingCancelId(null); }}
        title="Confirm Cancellation"
        message="Are you sure you want to withdraw this invitation? This action will notify all invited members and cannot be undone."
        theme="red"
        loading={submitting}
      >
        Withdraw Invitation
      </ConfirmModal>
    </div>
  );
}

export default BTPInvitesPage;