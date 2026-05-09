import { useState, useEffect, useCallback } from "react";

import { 
  FileStack, ArrowLeft, CheckCircle2, XCircle, AlertCircle , ShieldAlert
} from "lucide-react";
import { toast } from "react-hot-toast";

// UI Components
import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";
import ProposalCard from "../../components/common/Proposal/ProposalCard";
import ProposalDetail from "../../components/common/Proposal/ProposalDetails";
import ConfirmModal from "../../components/common/ConfirmModal";

// Services
import proposalService from "../../services/Faculty/proposalService";

const SupervisorRequestPage = ({isPG = false}) => {

  // State
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [view, setView] = useState("list");

  // Modal State for Action (Accept/Reject)
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

 const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await proposalService.getMyRequests(isPG);
      if (res.success) {
        setProposals(res.data);
      }
    } catch (err) {
      toast.error("Failed to load supervision requests");
    } finally {
      setLoading(false);
    }
  }, [isPG]); // ← add isPG here

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleViewDetails = async (proposal) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await proposalService.getRequestDetails(proposal._id);
      if (res.success) {
        setSelectedProposal(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      toast.error("Could not fetch request details");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedProposal(null);
  };

  const handleRespond = async () => {
    setIsSubmitting(true);
    try {
      console.log(selectedProposal._id);
      const responseData = { action: actionModal.type }; // "accept" or "reject"
      const res = !isPG ?  await proposalService.respondToRequest(selectedProposal._id, responseData) :
        await proposalService.respondToMTPRequest(selectedProposal._id, responseData);
      
      if (res.success) {
        toast.success(`Proposal ${actionModal.type === 'accept' ? 'accepted' : 'rejected'} successfully`);
        handleBackToList();
        fetchProposals();
      }
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionModal.type} proposal`);
    } finally {
      setIsSubmitting(false);
      setActionModal({ isOpen: false, type: null });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Header 
            title={view === "detail" ? "Request Review" : "Supervision Requests"} 
            subtitle={view === "detail" ? "Review student proposal and take action" : "Manage incoming project supervision requests from students"} 
            icon={FileStack}
          />
          
          {view === "detail" && (
            <button 
              onClick={handleBackToList}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
              Back to List
            </button>
          )}
        </div>

        {/* ─── MAIN CONTENT ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <Loader fullScreen={false} />
          </div>
        ) : view === "detail" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100">
                <Loader fullScreen={false} />
              </div>
            ) : (
                <>
                  {/* ─── ACTION BAR (Above Content) ─── */}
                  {selectedProposal?.status === "PendingSupervisorApproval" && (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <ShieldAlert size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Action Required</h4>
                          <p className="text-xs font-medium text-slate-500">Please review the details below before making a decision.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: "reject" })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 hover:border-rose-200 transition-all active:scale-95"
                        >
                          <XCircle size={16} strokeWidth={2.5} />
                          Reject
                        </button>

                        <button
                          onClick={() => setActionModal({ isOpen: true, type: "accept" })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-indigo-100"
                        >
                          <CheckCircle2 size={16} strokeWidth={2.5} />
                          Accept Supervision
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── PROPOSAL CONTENT ─── */}
                  <div className="relative">
                    {/* Subtle decorative element to connect action bar to content */}
                    {selectedProposal?.status === "PendingSupervisorApproval" && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-slate-200 to-transparent hidden md:block" />
                    )}
                    <ProposalDetail data={selectedProposal} />
                  </div>
                </>
              )}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <div className="animate-in fade-in duration-500">
            {proposals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {proposals.map((item) => (
                  <ProposalCard 
                    key={item._id} 
                    proposal={item} 
                    onViewDetails={() => handleViewDetails(item)} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 mb-4">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-lg font-black text-slate-800">No Pending Requests</h3>
                <p className="text-slate-400 font-medium">You don't have any supervision requests to review at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ACTION MODAL ─── */}
      <ConfirmModal 
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null })}
        onConfirm={handleRespond}
        title={actionModal.type === "accept" ? "Accept Request?" : "Reject Request?"}
        message={
          actionModal.type === "accept" 
            ? "By accepting, you agree to supervise this student's project. This will notify the student and register a project for the group."
            : "Are you sure you want to reject this request? You may want to provide feedback in the details view first."
        }
        theme={actionModal.type === "accept" ? "green" : "red"}
        loading={isSubmitting}
      >
        {actionModal.type === "accept" ? "Confirm Acceptance" : "Confirm Rejection"}
      </ConfirmModal>
    </div>
  );
};

export default SupervisorRequestPage;