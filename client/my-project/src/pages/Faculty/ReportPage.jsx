import React, { useState, useEffect } from "react";
import studentsManagement from "../../services/Faculty/studentsManagement";
import generalServices from "../../services/Faculty/generalService";
import { 
  Users, FileSpreadsheet, Download, Loader2, 
  CheckCircle2, AlertCircle, Calendar, GraduationCap, FileText 
} from "lucide-react";
import Header from "../../components/ui/Header";
import { toast } from "react-hot-toast";

const EXPORT_CARDS = [
  {
    key: "ungrouped",
    title: "Ungrouped Students",
    description: "Download a list of all students who have not yet been assigned to a BTP group.",
    filename: "Ungrouped_Students.xlsx",
    icon: Users,
    action: (payload) => studentsManagement.getExcelUngrouped(payload),
  },
  {
    key: "unsupervised",
    title: "Unsupervised Groups",
    description: "Download a list of all groups that have been formed but do not yet have a supervisor assigned.",
    filename: "Unsupervised_Groups.xlsx",
    icon: FileText,
    action: (payload) => studentsManagement.getExcelUnsupervisedGroups(payload),
  },
  {
    key: "fullGroups",
    title: "Full Groups Data",
    description: "Download a complete report of all active groups, including their students and assigned supervisors and project details.",
    filename: "Full_Groups_Data.xlsx",
    icon: FileSpreadsheet,
    action: (payload) => studentsManagement.getExcelGroupsWithProjects(payload),
  },
];

const ExportCard = ({ title, description, filename, action, icon: Icon, disabled, payload }) => {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDownload = async () => {
    if (disabled) {
      toast.error("Please select Session and Semester first");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await action(payload);
      setStatus("success");
      toast.success(`${title} exported successfully!`);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Download failed.";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <div className={`group relative overflow-hidden bg-white rounded-[2.5rem] border transition-all p-10 ${
      status === "loading" ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-100 shadow-sm hover:shadow-xl"
    } ${disabled ? "opacity-60 grayscale-[0.5]" : ""}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            disabled ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
          }`}>
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

        <div className="mt-auto pt-6 border-t border-slate-50">
          {status === "error" && (
            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={status === "loading" || disabled}
            className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              status === "success" 
                ? "bg-emerald-500 text-white" 
                : status === "loading"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : disabled
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200"
            }`}
          >
            {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : 
             status === "success" ? <CheckCircle2 size={20} /> : <Download size={20} />}
            {status === "loading" ? "Generating..." : status === "success" ? "Ready ✓" : "Export to Excel"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentsManagementPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await generalServices.getSessions();
        // Accessing response.data because of your API structure
        if (response && response.data) {
          setSessions(response.data);
        }
      } catch (err) {
        toast.error("Failed to load academic sessions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const isSelectionComplete = selectedSession !== "" && selectedSemester !== "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Students Management" 
          subtitle="Generate and download BTP group reports" 
          icon={Users}
        />

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all">
          {/* Session Picker */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              <Calendar size={14} className="text-blue-500" /> Academic Session
            </label>
            <select 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              disabled={loading}
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all outline-none disabled:opacity-50"
            >
              <option value="">{loading ? "Loading..." : "Select Session"}</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Picker */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              <GraduationCap size={14} className="text-blue-500" /> Semester Type
            </label>
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all outline-none"
            >
              <option value="">Select Semester</option>
              <option value="7">Odd Semester (Sem 7)</option>
              <option value="8">Even Semester (Sem 8)</option>
            </select>
          </div>
        </div>

        {/* Grid Section */}
        {/* Export cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EXPORT_CARDS.map((card) => {
            // Destructure key out so it isn't part of the spread props
            const { key, ...cardProps } = card;
            
            return (
              <ExportCard
                key={key} // Passed directly as required by React
                {...cardProps} // title, description, filename, action, icon
                disabled={!isSelectionComplete}
                payload={{ 
                  sessionId: selectedSession, 
                  semester: parseInt(selectedSemester) 
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentsManagementPage;
