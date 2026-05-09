import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileStack, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  AlertCircle 
} from "lucide-react";

// UI Components
import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";
import ProposalCard from "../../components/common/Proposal/ProposalCard";
import ProposalDetail from "../../components/common/Proposal/ProposalDetails";
import ConfirmModal from "../../components/common/ConfirmModal";

// Services
import projectProposalService from "../../services/Student/projectProposalService";
import toast from "react-hot-toast";

const MyProposals = () => {
  const navigate = useNavigate();
  // State
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [view, setView] = useState("list");

  // Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectProposalService.getMyRequests();
      if (res.success) {
        setProposals(res.data);
      }
    } catch (err) {
      toast.error("Failed to load your proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleViewDetails = async (proposal) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await projectProposalService.getRequestDetails(proposal._id);
      if (res.success) {
        setSelectedProposal(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      toast.error("Could not fetch proposal details");
      setView("list"); // Revert view if fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedProposal(null);
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const res = await projectProposalService.withdrawRequest(selectedProposal._id);
      if (res.success) {
        toast.success("Proposal withdrawn successfully");
        handleBackToList();
        fetchProposals();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to withdraw");
    } finally {
      setIsWithdrawing(false);
      setIsWithdrawModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* ─── UNIFORM HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Header 
            title={view === "detail" ? "Proposal Details" : "My Proposals"} 
            subtitle={view === "detail" ? "Review faculty feedback and project status" : "Manage your project requests and supervisor approvals"} 
            icon={FileStack}
          />
          
          <div className="flex items-center gap-3">
            {view === "detail" ? (
              <button 
                onClick={handleBackToList}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowLeft size={16} />
                Back to List
              </button>
            ) : (
              <button 
                onClick={() => navigate("/student/create-proposal")}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={16} />
                New Proposal
              </button>
            )}
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <Loader fullScreen={false} />
          </div>
        ) : view === "detail" ? (
          /* ─── DETAIL VIEW ─── */
          <div className="space-y-8 animate-in fade-in duration-500">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white">
                <Loader fullScreen={false} />
              </div>
            ) : (
              <>
                <ProposalDetail data={selectedProposal} />
                {selectedProposal?.status === "PendingSupervisorApproval" && (
                  <div className="flex justify-center pt-10">
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="flex items-center gap-3 px-10 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
                    >
                      <Trash2 size={18} />
                      Withdraw Proposal
                    </button>
                  </div>
                )}
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
                <h3 className="text-lg font-black text-slate-800">No Proposals Found</h3>
                <p className="text-slate-400 font-medium mb-8">You haven't submitted any project proposals yet.</p>
                <button 
                  onClick={() => navigate("/student/create-proposal")}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Start First Proposal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirm={handleWithdraw}
        title="Withdraw Proposal?"
        message="Are you sure you want to withdraw this request? This will remove it from the supervisors' review list and this action cannot be undone."
        theme="red"
        loading={isWithdrawing}
      >
        Withdraw Now
      </ConfirmModal>
    </div>
  );
};

export default MyProposals;