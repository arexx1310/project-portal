import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Plus, 
  ChevronLeft, 
  Users, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Info,
  Trash2,
  MapPin
} from "lucide-react";
import { toast } from "react-hot-toast";

import projectProposalService from "../../services/Student/projectProposalService";
import profileService from "../../services/Student/profileService";
import Header from "../../components/common/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

// ─── Status badge helper ───────────────────────────────────────────────────
const STATUS_STYLES = {
  PendingSupervisorApproval: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  Approved: { label: "Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  Rejected: { label: "Rejected", color: "text-rose-700 bg-rose-50 border-rose-200", icon: XCircle },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function ProfessorCard({ professor, isSelected, onToggle, disabled }) {
  return (
    <div
      onClick={() => !disabled && onToggle(professor.professorId)}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${
        isSelected 
          ? "border-blue-600 bg-blue-50/50 shadow-sm" 
          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate">
            {professor.name}
          </h4>
          <div className="mt-2 space-y-1">
            <p className="text-[11px] sm:text-xs text-slate-500 flex items-center">
              <Users className="w-3 h-3 mr-1 flex-shrink-0" /> Active: {professor.activeGroups}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 flex items-center">
              <BookOpen className="w-3 h-3 mr-1 flex-shrink-0" /> Slots: {professor.availableSlots}
            </p>
          </div>
        </div>
        {isSelected && (
          <div className="bg-blue-600 rounded-full p-1 shadow-sm flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalForm({ semester, groupedProfessors, professorsLoading, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);

  const toggleProfessor = (id) => {
    setSelectedProfessorIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Project title is required.");
    if (!description.trim()) return toast.error("Description is required.");
    if (!domain.trim()) return toast.error("Domain is required.");
    if (semester === 7 && selectedProfessorIds.length === 0)
      return toast.error("Please select at least one supervisor.");

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      domain: domain.trim(),
      ...(semester === 7 && { supervisorsIds: selectedProfessorIds }),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">New Submission</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
          Sem {semester}
        </span>
      </div>

      <form onSubmit={handleSubmitInternal} className="p-5 sm:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Project Title *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descriptive title..."
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Domain *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. AI, Cyber Security"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Description *</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px] text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectives and scope..."
              disabled={submitting}
            />
          </div>
        </div>

        {semester === 7 && (
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Select Supervisor(s) *</h3>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Required for Sem 7</span>
            </div>
            
            {professorsLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedProfessors).map(([deptName, profList]) => (
                  <div key={deptName} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{deptName}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {profList.map((prof) => (
                        <ProfessorCard
                          key={prof.professorId}
                          professor={prof}
                          isSelected={selectedProfessorIds.includes(prof.professorId)}
                          onToggle={toggleProfessor}
                          disabled={submitting}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedProfessors).length === 0 && (
                   <p className="text-center text-slate-400 py-4 italic text-sm">No supervisors available at this time.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-6 flex flex-col gap-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 disabled:bg-blue-300 text-sm"
          >
            {submitting ? "Processing..." : "Submit Proposal"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ProposalRow({ proposal, onViewDetails, onInitiateDelete, deleting }) {
  const status = STATUS_STYLES[proposal.status] || { label: proposal.status, color: "bg-slate-100 text-slate-700", icon: Info };
  const StatusIcon = status.icon;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-blue-300 transition-all">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${status.color}`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto sm:ml-0">
              Sem {proposal.project?.semester}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mb-3 break-words">{proposal.project?.title || "Untitled"}</h3>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] sm:text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider"><BookOpen className="w-3.5 h-3.5" /> {proposal.project?.domain}</span>
            <span className="flex items-center gap-1.5 uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> {new Date(proposal.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-slate-50 sm:border-t-0 sm:pt-0 sm:ml-auto">
          <button 
            onClick={() => onViewDetails(proposal._id)}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Details
          </button>
          {proposal.status === "PendingSupervisorApproval" && (
            <button 
              onClick={() => onInitiateDelete(proposal._id)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
            >
              <Trash2 className={`w-5 h-5 ${deleting === proposal._id ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalDetail({ proposal, onBack, onInitiateDelete, deleting }) {
  if (!proposal) return null;
  const status = STATUS_STYLES[proposal.status] || { label: proposal.status, color: "bg-slate-100 text-slate-700" };
  const canCancel = proposal.status === "PendingSupervisorApproval";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight mb-4 uppercase">{proposal.project?.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                {status.label}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                {proposal.project?.domain}
              </span>
            </div>
          </div>
          {canCancel && (
            <button 
              onClick={() => onInitiateDelete(proposal._id)}
              disabled={deleting === proposal._id}
              className="w-full sm:w-auto px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 font-bold rounded-xl text-sm transition-all"
            >
              Cancel Request
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Project Description</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-100 italic">
                {proposal.project?.description}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Supervisor Responses</h3>
              <div className="space-y-3">
                {proposal.supervisors?.map((s, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl bg-white gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                    </div>
                    <div className="flex items-center justify-between sm:text-right gap-4">
                       <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${
                         s.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                         s.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {s.status}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 h-fit">
            <h4 className="font-black text-blue-900 mb-4 uppercase text-[10px] tracking-widest">Metadata</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-600 font-bold uppercase">Semester</span>
                <span className="font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-100">{proposal.project?.semester}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-600 font-bold uppercase">Submitted</span>
                <span className="font-black text-blue-900">{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProjectProposalPage = () => {
  const [view, setView] = useState("list");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [groupedProfessors, setGroupedProfessors] = useState({}); // Stores object grouped by dept
  const [professorsLoading, setProfessorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setProfileLoading(true);
        const res = await profileService.getProfile();
        setProfile(res.data);
      } catch (err) {
        toast.error("Failed to load profile.");
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      setProposalsLoading(true);
      const res = await projectProposalService.getProjectProposals();
      setProposals(res.data || []);
    } catch (err) {
      toast.error("Could not refresh proposals.");
    } finally {
      setProposalsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  useEffect(() => {
    if (view !== "create" || profile?.semester !== 7) return;
    (async () => {
      try {
        setProfessorsLoading(true);
        const res = await projectProposalService.getAvailableProfessors();
        // res.data is expected to be { "DEPT_NAME": [professors], ... }
        setGroupedProfessors(res.data || {});
      } catch (err) {
        toast.error("Failed to load supervisors.");
      } finally {
        setProfessorsLoading(false);
      }
    })();
  }, [view, profile?.semester]);

  const handleViewDetails = async (id) => {
    try {
      setDetailLoading(true);
      setView("detail");
      const res = await projectProposalService.projectProposalDetails(id);
      setSelectedProposal(res.data);
    } catch (err) {
      toast.error("Error loading details.");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await projectProposalService.createProjectProposal(pendingPayload);
      toast.success("Submitted!");
      await fetchProposals();
      setView("list");
    } catch (err) {
      toast.error(err?.message || "Failed.");
    } finally {
      setIsConfirmSubmitOpen(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(pendingDeleteId);
      await projectProposalService.deleteProjectProposal(pendingDeleteId);
      toast.success("Cancelled.");
      if (view === "detail") setView("list");
      await fetchProposals();
    } catch (err) {
      toast.error("Action failed.");
    } finally {
      setIsConfirmDeleteOpen(false);
      setDeleting(null);
      setPendingDeleteId(null);
    }
  };

  if (profileLoading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="BTP Proposals" 
          subtitle="Define project vision & get approval" 
          icon={FileText} 
        />

        {/* Action Bar / Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Group", val: profile?.group || "None", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Stage", val: `Sem ${profile?.semester}`, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Count", val: proposals.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="w-5 h-5"/></div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                <p className="font-bold text-slate-800 text-sm truncate">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        {view === "list" && (
          <div className="space-y-6">
            {(profile?.group && [7, 8].includes(profile?.semester)) && (
              <button 
                onClick={() => setView("create")}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-lg shadow-blue-100"
              >
                <Plus className="w-4 h-4" /> New Proposal
              </button>
            )}

            {proposalsLoading ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4 rounded-full"></div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Refreshing...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-800 font-bold">No Proposals</h3>
                <p className="text-slate-400 text-xs mt-1">Start by defining your project vision.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposals.map((p) => (
                  <ProposalRow key={p._id} proposal={p} onViewDetails={handleViewDetails} onInitiateDelete={(id) => { setPendingDeleteId(id); setIsConfirmDeleteOpen(true); }} deleting={deleting} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === "create" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ProposalForm 
              semester={profile.semester} 
              groupedProfessors={groupedProfessors} 
              professorsLoading={professorsLoading} 
              onSubmit={(p) => { setPendingPayload(p); setIsConfirmSubmitOpen(true); }} 
              onCancel={() => setView("list")} 
              submitting={submitting} 
            />
          </div>
        )}

        {view === "detail" && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              </div>
            ) : (
              <ProposalDetail proposal={selectedProposal} onBack={() => setView("list")} onInitiateDelete={(id) => { setPendingDeleteId(id); setIsConfirmDeleteOpen(true); }} deleting={deleting} />
            )}
          </div>
        )}

        <ConfirmModal isOpen={isConfirmSubmitOpen} onClose={() => setIsConfirmSubmitOpen(false)} onConfirm={handleSubmit} title="Submit Proposal?" theme="green" loading={submitting} message="Official submission. Details cannot be edited once sent." >Accept</ConfirmModal>
        <ConfirmModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={handleDelete} title="Delete Proposal?" theme="red" loading={deleting !== null} message="This action is permanent and cannot be undone." > Cancel</ConfirmModal>
      </div>
    </div>
  );
}

export default ProjectProposalPage;