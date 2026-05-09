import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  X,
  Users,
  Building2,
  GraduationCap,
  Info,
  Trash2,
  ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";

import uploadService from "../../services/Admin/uploadService";
import departmentService from "../../services/Admin/departmentServices";
import Header from "../../components/ui/Header";
import excelFormat from "../../assets/studentexcelformat.png";

const UploadStudentsPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [allDeptData, setAllDeptData] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [availableSpecs, setAvailableSpecs] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("BTech")
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getAllDepartments();
        setAllDeptData(res.data || res);
      } catch (err) {
        toast.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      const deptObj = allDeptData.find(d => d._id === selectedDept);
      setAvailableSpecs(deptObj ? deptObj.specializations : []);
    } else {
      setAvailableSpecs([]);
    }
    setSelectedSpec("");
  }, [selectedDept, allDeptData]);

  const handleFileChange = (e) => {
    const selectedFile = e.target ? e.target.files[0] : e;
    if (!selectedFile) return;

    if (selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setFile(selectedFile);
      setSummary(null);
    } else {
      toast.error("Please upload .xlsx or .xls file");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    if (!selectedDept) return toast.error("Department is required");
    if (selectedProgram==="BTech" && !selectedSpec) return toast.error("Specialization is required for BTech.")

    setLoading(true);
    const toastId = toast.loading("Processing records...");

    try {
      const res = await uploadService.uploadStudents(file, selectedDept, selectedSpec, selectedProgram);
      if (res.success) {
        setSummary(res.summary);
        toast.success("Import successful!", { id: toastId });
        setFile(null);
      }
    } catch (err) {
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setLoading(false);
      setSelectedDept("");
      setSelectedSpec(""); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
      <Header title="Student Import" subtitle="Manage bulk provisioning securely" icon={Users} />

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Sidebar: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Target Destination
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                    >
                      <option value="">Select Dept</option>
                      {allDeptData.map(d => <option key={d._id} value={d._id}>{d.department}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                    >
                      <option value="">Select Program</option>
                      {["BTech", "MTech"].map(d => <option key={d.index} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {selectedProgram === "BTech" && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Specialization</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedSpec}
                      onChange={(e) => setSelectedSpec(e.target.value)}
                      disabled={!selectedDept}
                      className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none disabled:opacity-50 appearance-none"
                    >
                      <option value="">Select Specialization</option>
                      {availableSpecs.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                    </select>
                  </div>
                </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowFormatModal(true)}
              className="w-full py-4 px-6 bg-blue-50 text-blue-700 rounded-2xl font-semibold text-sm hover:bg-blue-100 transition-colors flex items-center justify-between group"
            >
              View Excel Format
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Main Content: Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              className={`relative bg-white border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-slate-200"
              } ${file ? "p-8" : "p-12"}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UploadCloud size={32} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Upload student roster</h2>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">
                    Drag and drop your .xlsx file here or click to browse files
                  </p>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
                  >
                    Select File
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileCheck size={28} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready to import</p>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".xlsx,.xls" />
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file }
              className="w-full h-16 bg-blue-600 text-white rounded-[1.25rem] font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={22} />}
              {loading ? "Processing Database..." : "Complete Import"}
            </button>

              {/* Import Summary Results */}
              {summary && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm">
                      <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Successfully Created</p>
                      <p className="text-4xl font-black text-emerald-700 tracking-tighter">{summary.created}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] shadow-sm">
                      <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-1">Records Skipped</p>
                      <p className="text-4xl font-black text-amber-700 tracking-tighter">{summary.skipped}</p>
                    </div>
                  </div>

                  {/* Details Section - Audit Log Style */}
                  {summary.details.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50">
                      <div className="bg-slate-50 px-8 py-4 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Skipped Records Log</p>
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-slate-50">
                          {summary.details.map((d, index) => (
                            <div key={index} className="px-8 py-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                  <AlertCircle size={14} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-700 leading-none">{d.email}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-1">Registry Conflict</p>
                                </div>
                              </div>
                              
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-tight border border-amber-100/50">
                                {d.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50/50 px-8 py-3 text-center">
                        <p className="text-[9px] font-bold text-slate-400 italic">Total {summary.details.length} issues identified during import</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Format Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setShowFormatModal(false)}>
          <div className="bg-white rounded-[2rem] overflow-hidden max-w-3xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Expected Excel Template</h3>
              <button onClick={() => setShowFormatModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8 bg-slate-50">
              <img src={excelFormat} alt="Excel Format" className="rounded-xl border shadow-sm mx-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStudentsPage;