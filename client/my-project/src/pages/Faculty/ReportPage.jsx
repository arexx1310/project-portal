import React, { useState } from "react";
import studentsManagement from "../../services/Faculty/studentsManagement";
import { 
  Users, FileSpreadsheet, Download, Loader2, 
  CheckCircle2, AlertCircle, Info, FileText 
} from "lucide-react";
import Header from "../../components/common/Header";
import { toast } from "react-hot-toast";

const EXPORT_CARDS = [
  {
    key: "ungrouped",
    title: "Ungrouped Students",
    description:
      "Download a list of all students who have not yet been assigned to a BTP group.",
    filename: "Ungrouped_Students.xlsx",
    icon: Users,
    action: () => studentsManagement.getExcelUngrouped(),
  },
  {
    key: "unsupervised",
    title: "Unsupervised Groups",
    description:
      "Download a list of all groups that have been formed but do not yet have a supervisor assigned.",
    filename: "Unsupervised_Groups.xlsx",
    icon: FileText,
    action: () => studentsManagement.getExcelUnsupervisedGroups(),
  },
  {
    key: "fullGroups",
    title: "Full Groups Data",
    description:
      "Download a complete report of all active groups, including their students and assigned supervisors.",
    filename: "Full_Groups_Data.xlsx",
    icon: FileSpreadsheet,
    action: () => studentsManagement.getExcelFullGroupsData(),
  },
];

// ── Single export card ────────────────────────────────────────────────────────

const ExportCard = ({ title, description, filename, action, icon: Icon }) => {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const handleDownload = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      await action();
      setStatus("success");
      toast.success(`${title} exported successfully!`);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      const msg = err?.message || "Download failed.";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  return (
    <div className={`group relative overflow-hidden bg-white rounded-[2.5rem] border transition-all p-10 ${
      status === "loading" ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200"
    }`}>
      {/* Icon & Content */}
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Icon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{title}</h3>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              <FileSpreadsheet size={12} className="text-blue-500" />
              {filename}
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">
          {description}
        </p>

        {/* Action Section */}
        <div className="mt-auto pt-6 border-t border-slate-50">
          {status === "error" && (
            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={status === "loading"}
            className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              status === "success" 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                : status === "loading"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200"
            }`}
          >
            {status === "loading" ? (
              <Loader2 className="animate-spin" size={20} />
            ) : status === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <Download size={20} />
            )}
            
            {status === "loading"
              ? "Generating..."
              : status === "success"
              ? "Ready ✓"
              : "Export to Excel"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const StudentsManagementPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Page header */}
        <Header 
          title="Students Management" 
          subtitle="Export and manage BTP groups and student datasets" 
          icon={Users}
        />

        {/* Info Callout */}
        <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-black uppercase tracking-tighter text-lg">Reporting Center</h4>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">All files are generated in real-time as .xlsx spreadsheets</p>
            </div>
          </div>
        </div>

        {/* Export cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {EXPORT_CARDS.map((card) => (
            <ExportCard
              key={card.key}
              title={card.title}
              description={card.description}
              filename={card.filename}
              action={card.action}
              icon={card.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentsManagementPage;