import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Send, Trash2, BookText, Layout, 
  UserPlus, ArrowLeft, FilePlus2, Loader2,
  Loader
} from "lucide-react";

import {useAuth} from "../../context/AuthContext";

// UI Components
import Header from "../../components/ui/Header";

import DepartmentDropdown from "../../components/common/General/DepartmentDropDown";
import SupervisorGrid from "../../components/common/General/ProfessorsGroupLoads";
import ConfirmModal from "../../components/common/ConfirmModal";

// Services
import projectProposalService from "../../services/Student/projectProposalService";

import toast from "react-hot-toast";

const CreateProposal = () => {
  const {user , loading} = useAuth();
  
  const [isPG, setIsPG] = useState(false);
 
  const navigate = useNavigate();
  
  // Form & Data State
  const [formData, setFormData] = useState({ title: "", domain: "", description: "" });
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [availableSupervisorsData, setAvailableSupervisorsData] = useState(null);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
 
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfs, setIsLoadingProfs] = useState(false);

  // Fetch Departments on Mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        if (!loading) setIsPG(user.isPG); 
        const res = await projectProposalService.getDepartments();
        setDepartments(res.data || []);
      } catch (err) {
        toast.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, []);

  // Fetch Professors when Department Changes
  useEffect(() => {
    if (!selectedDeptId) {
      setAvailableSupervisorsData(null);
      return;
    }
    const fetchProfs = async () => {
      setIsLoadingProfs(true);
      try {
        const res = await projectProposalService.getAvailableProfessors(selectedDeptId);
        setAvailableSupervisorsData(res);
      } catch (err) {
        toast.error("Failed to fetch available professors");
      } finally {
        setIsLoadingProfs(false);
      }
    };
    fetchProfs();
  }, [selectedDeptId]);

  const handleSelectSupervisor = (profId) => {
    const prof = availableSupervisorsData.availableSupervisors.find(s => s._id === profId);
    
    if (selectedSupervisors.find(s => s._id === profId)) {
      toast.error("Professor already added to your panel");
      return;
    }

    setSelectedSupervisors(prev => [...prev, prof]);
    toast.success(`${prof.name} added`);
  };

  const handleRemoveSupervisor = (id) => {
    setSelectedSupervisors(prev => prev.filter(s => s._id !== id));
  };

  const isFormValid = 
    formData.title.trim() && 
    formData.domain.trim() && 
    formData.description.trim() && 
    selectedSupervisors.length > 0;

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        supervisorIds: selectedSupervisors.map(s => s._id) 
      };
      console.log(isPG);
      const res = isPG
      ? await projectProposalService.createMTPRequest(payload)
      : await projectProposalService.createRequest(payload);

      if (res.success) {
        toast.success("Proposal submitted successfully!");
        navigate("/student/project-proposals");
      }
    } catch (err) {
      toast.error( err?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* ─── UNIFORM HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Header 
            title="Create Proposal" 
            subtitle="Draft your BTP details and select your faculty panel" 
            icon={FilePlus2}
          />
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── LEFT: PROJECT FORM & FACULTY BROWSER ─── */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Project Details Section */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookText size={20} />
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Project Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Title</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-300"
                    placeholder="Enter full project title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Research Domain</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-300"
                    placeholder="e.g. Post-Quantum Cryptography"
                    value={formData.domain}
                    onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abstract / Description</label>
                  <textarea 
                    rows={5}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[2rem] text-sm font-medium leading-relaxed focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-300"
                    placeholder="Provide a detailed overview of your proposed work..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Faculty Selection Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 text-white rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Add Supervisors</h2>
                </div>
                <DepartmentDropdown 
                  departments={departments} 
                  onSelect={setSelectedDeptId} 
                  selectedId={selectedDeptId}
                />
              </div>

              {isLoadingProfs ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100">
                  <Loader/>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Faculty Members...</p>
                </div>
              ) : availableSupervisorsData ? (
                <SupervisorGrid 
                  data={availableSupervisorsData} 
                  onSelect={handleSelectSupervisor}
                  selectedId={null}
                />
              ) : (
                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Layout className="mx-auto text-slate-200 mb-4" size={40} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select a department to browse faculty</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: SUBMISSION PANEL ─── */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl sticky top-6 border border-white/5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Selected Panel</h3>
              
              <div className="space-y-3 min-h-[100px] mb-8">
                {selectedSupervisors.length > 0 ? (
                  selectedSupervisors.map((s) => (
                    <div 
                      key={s._id} 
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group transition-all hover:border-indigo-500/50"
                    >
                      <div className="overflow-hidden">
                        <p className="text-white font-bold text-xs truncate">{s.name}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase mt-1">
                          Available: {s.availableSlots} Slots
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveSupervisor(s._id)}
                        className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border border-dashed border-white/10 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-600 uppercase">No faculty chosen</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-indigo-400">
                      <Loader/>
                      {!isSubmitting && <Send size={14} />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Proposals are sent to all selected faculty all must accept to initiate project.
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isFormValid || isSubmitting}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/20"
                >
                  {isSubmitting ? "Processing..." : "Submit Proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleFinalSubmit}
        title="Final Submission"
        message={`Confirm submission of "${formData.title}" to ${selectedSupervisors.length} faculty member(s).`}
        theme="green"
        loading={isSubmitting}
      >
        Confirm & Send
      </ConfirmModal>
    </div>
  );
};

export default CreateProposal;