import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  FileCheck,
  X,
  Briefcase,
  Building2,
  Trash2,
  ArrowRight,
  Info,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

import uploadService from "../../services/Admin/uploadService";
import departmentService from "../../services/Admin/departmentServices";
import Header from "../../components/ui/Header";
import excelFormat from "../../assets/facultyexcelformat.png";

const UploadFacultyPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [allDeptData, setAllDeptData] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getAllDepartments();
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setAllDeptData(data.filter(d => d.department !== "Admin"));
        }
      } catch (err) {
        toast.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, []);

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
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedDept) return toast.error("Missing file or department");

    setLoading(true);
    try {
      const res = await uploadService.uploadFaculty(file, selectedDept);
      setSummary(res.summary);
      toast.success("Faculty records synchronized!");
      setFile(null);
      setSelectedDept("");
    } catch (err) {
      toast.error(err?.message || "Import Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
      <Header
        title="Faculty Onboarding"
        subtitle="Secure bulk provisioning for academic staff"
        icon={Briefcase}
      />
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> Security Scope
              </h3>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Target Academic Unit
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                  >
                    <option value="">Select Unit</option>
                    {allDeptData.map(d => (
                      <option key={d._id} value={d._id}>{d.department}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 px-1">
                  Faculty will be mapped to this department's hierarchy.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowFormatModal(true)}
              className="w-full py-4 px-6 bg-emerald-50 text-emerald-700 rounded-2xl font-semibold text-sm hover:bg-emerald-100 transition-colors flex items-center justify-between group"
            >
              Check Template Format
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Column: Upload */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              className={`relative bg-white border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                isDragging ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]" : "border-slate-200"
              } ${file ? "p-8" : "p-12"}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UploadCloud size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Faculty Data Import</h2>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">
                    Drop your Excel registry here to begin bulk provisioning.
                  </p>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileCheck size={28} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">Validation passed • Ready to sync</p>
                  </div>
                  <button 
                    onClick={() => {
                      setFile(null);
                      // Reset the actual input value so the same file can be picked again
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
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
              disabled={loading || !file || !selectedDept}
              className="w-full h-16 bg-emerald-600 text-white rounded-[1.25rem] font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud size={22} />}
              {loading ? "Processing Faculty..." : "Start Bulk Sync"}
            </button>
            
            {/* Results Cards */}
              {summary && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm group hover:bg-emerald-100 transition-colors">
                      <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Successfully Created</p>
                      <p className="text-4xl font-black text-emerald-700 tracking-tighter">{summary.created}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] shadow-sm group hover:bg-amber-100 transition-colors">
                      <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-1">Records Skipped</p>
                      <p className="text-4xl font-black text-amber-700 tracking-tighter">{summary.skipped}</p>
                    </div>
                  </div>

                  {/* Error Log Section */}
                  {summary.errors?.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/60 transition-all">
                      {/* Header */}
                      <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Skipped Records Detail Log</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full uppercase">
                          {summary.errors.length} Issues Found
                        </span>
                      </div>
                      
                      {/* Scrollable List */}
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-white">
                        <div className="divide-y divide-slate-50">
                          {summary.errors.map((errorMsg, index) => (
                            <div key={index} className="px-8 py-4 hover:bg-slate-50/80 transition-all flex items-start gap-4 group">
                              {/* Index Indicator */}
                              <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-amber-600">
                                  {index + 1}
                                </span>
                              </div>

                              {/* Message */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 leading-relaxed break-words">
                                  {errorMsg}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                    Validation Warning
                                  </p>
                                </div>
                              </div>

                              {/* Status Icon */}
                              <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <AlertCircle size={14} className="text-amber-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Info size={12} />
                          <p className="text-[9px] font-bold italic">
                            Entries skipped due to duplicate IDs, existing emails, or malformed data rows.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6" onClick={() => setShowFormatModal(false)}>
          <div className="bg-white rounded-[2rem] overflow-hidden max-w-4xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-emerald-500" />
                <h3 className="font-bold text-lg text-slate-800">Faculty Excel Schema</h3>
              </div>
              <button onClick={() => setShowFormatModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 bg-slate-50 max-h-[70vh] overflow-y-auto">
              <img src={excelFormat} alt="Schema Requirements" className="rounded-xl border shadow-sm mx-auto" />
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-4">
                <Info className="text-emerald-600 shrink-0" size={20} />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Important:</strong> Ensure column headers match exactly as shown above. The system validates 
                  unique identifiers (Email/ID) to prevent duplicate provisioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadFacultyPage;