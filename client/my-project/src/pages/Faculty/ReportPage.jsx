import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet, Download, Loader2, CheckCircle2,
  X, ChevronRight, Table2, AlertCircle, BookOpen,
  GraduationCap, Users, ShieldCheck, FolderKanban,
} from "lucide-react";

import Header from "../../components/ui/Header";
import SessionDropdown from "../../components/common/General/SessionDropDown";
import generalServices from "../../services/Faculty/generalService";
import reportService from "../../services/Faculty/reportService";
import { toast } from "react-hot-toast";

/* ══════════════════════════════════════════════════════════════════════════
   SHEET CATALOGUE
   statusSheets  — always downloaded (Controller 1, no semester needed)
   projectSheets — downloaded separately when a semester is chosen (Controller 2)
══════════════════════════════════════════════════════════════════════════ */
const UG_STATUS_SHEETS = [
  {
    id: "ungrouped",
    name: "Students Not In a Group",
    description: "All UG students whose group ID is null — not yet in any BTP group.",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    conditional: false,
  },
  {
    id: "draft",
    name: "Groups Not Registered",
    description: "Groups still in Draft status — not yet registered by students.",
    icon: FolderKanban,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    conditional: false,
  },
  {
    id: "nosup",
    name: "Groups With NO Supervisors",
    description: "Formed groups awaiting supervisor assignment.",
    icon: ShieldCheck,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
    conditional: false,
  },
];

const UG_PROJECT_SHEETS = [
  {
    id: "projects",
    name: (sem) => `BTP ${sem === 7 ? "Phase 1" : "Phase 2"} — Sem ${sem} Projects`,
    description: "Group name, status, members, supervisors, project title and domain.",
    icon: FileSpreadsheet,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    conditional: true,
  },
  {
    id: "publications",
    name: (sem) => `BTP ${sem === 7 ? "Phase 1" : "Phase 2"} — Publications`,
    description: "Publication details per project — conference, status, DOI and published info.",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    conditional: true,
  },
];

const PG_STATUS_SHEETS = [
  {
    id: "pgnotregistered",
    name: "Students Not Registered",
    description: "MTech students with no group assigned yet.",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    conditional: false,
  },
  {
    id: "pgnosup",
    name: "Students With No Supervisors",
    description: "MTech students in a group but with no supervisor assigned.",
    icon: ShieldCheck,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
    conditional: false,
  },
];

const PG_PROJECT_SHEETS = [
  {
    id: "pgprojects",
    name: (sem) => `MTP Sem ${sem} Projects`,
    description: "Student name, roll, supervisor(s), project title and domain.",
    icon: FileSpreadsheet,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    conditional: true,
  },
  {
    id: "pgpublications",
    name: (sem) => `MTP Sem ${sem} — Publications`,
    description: "Publication details per project — conference, status, DOI and published info.",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    conditional: true,
  },
];

const UG_SEMESTERS = [
  { value: 7, label: "Sem 7", sub: "BTP Phase 1" },
  { value: 8, label: "Sem 8", sub: "BTP Phase 2" },
];

const PG_SEMESTERS = [
  { value: 1, label: "Sem 1", sub: "MTP Phase 1" },
  { value: 2, label: "Sem 2", sub: "MTP Phase 2" },
  { value: 3, label: "Sem 3", sub: "MTP Phase 3" },
  { value: 4, label: "Sem 4", sub: "MTP Phase 4" },
];

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */

/**
 * Returns the sheets shown in the live preview for the chosen programme + semester.
 * Status sheets are always shown. Project sheets only appear when a semester is set.
 */
const getActiveSheets = (programType, semester) => {
  if (!programType) return [];
  const statusSheets  = programType === "UG" ? UG_STATUS_SHEETS  : PG_STATUS_SHEETS;
  const projectSheets = programType === "UG" ? UG_PROJECT_SHEETS : PG_PROJECT_SHEETS;
  return semester ? [...statusSheets, ...projectSheets] : statusSheets;
};

const resolveSheetName = (sheet, semester) =>
  typeof sheet.name === "function" ? sheet.name(semester) : sheet.name;

/* ══════════════════════════════════════════════════════════════════════════
   CONFIRMATION MODAL
══════════════════════════════════════════════════════════════════════════ */
const ConfirmModal = ({ session, programType, semester, sheets, onConfirm, onClose, isDownloading }) => {
  // Trap focus & close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const programLabel = programType === "UG" ? "B.Tech (BTP)" : "M.Tech (MTP)";
  const semLabel = semester
    ? `Status report + Sem ${semester} project & publication report`
    : "Status report only";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header stripe */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              Confirm Report Generation
            </p>
            <h2 className="text-white font-black text-xl uppercase tracking-tighter italic">
              {session?.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                {programLabel}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {semLabel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet list */}
        <div className="px-8 py-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Sheets Included in Download
          </p>
          {sheets.map((sheet, i) => {
            const Icon = sheet.icon;
            return (
              <div
                key={sheet.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${sheet.bg} ${sheet.border}`}
              >
                {/* Sheet tab number */}
                <div className="w-5 h-5 rounded-md bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                </div>
                <Icon size={14} className={`shrink-0 ${sheet.color}`} />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">
                    {resolveSheetName(sheet, semester)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {sheet.description}
                  </p>
                </div>
                <CheckCircle2 size={14} className={`ml-auto shrink-0 ${sheet.color}`} />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDownloading}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating…</>
            ) : (
              <><Download size={16} /> Generate & Download</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   SHEET PREVIEW CARD  (shown in the live preview section)
══════════════════════════════════════════════════════════════════════════ */
const SheetPreviewCard = ({ sheet, index, semester, conditional }) => {
  const Icon = sheet.icon;
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      conditional
        ? "border-dashed border-blue-200 bg-blue-50/50"
        : "border-slate-100 bg-white shadow-sm"
    }`}>
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
          {index + 1}
        </span>
        <div className={`p-2 rounded-xl ${sheet.bg}`}>
          <Icon size={14} className={sheet.color} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
          {resolveSheetName(sheet, semester)}
        </p>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">
          {sheet.description}
        </p>
      </div>
      {conditional && (
        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
          +Project Data
        </span>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
const ReportGeneratorPage = () => {
  const [sessions, setSessions]           = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [programType, setProgramType]     = useState(null);   // "UG" | "PG"
  const [semester, setSemester]           = useState(null);   // number | null
  const [modalOpen, setModalOpen]         = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  /* ── fetch sessions ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await generalServices.getSessions();
        if (res?.data) setSessions(res.data);
      } catch {
        toast.error("Failed to load academic sessions.");
      } finally {
        setSessionsLoading(false);
      }
    };
    fetch();
  }, []);

  /* ── reset semester when program changes ── */
  const handleProgramChange = (prog) => {
    setProgramType(prog);
    setSemester(null);
  };

  /* ── derived state ── */
  const semesters     = programType === "UG" ? UG_SEMESTERS : PG_SEMESTERS;
  const activeSheets  = programType ? getActiveSheets(programType, semester) : [];
  const canGenerate   = !!selectedSession && !!programType;

  /* ── download trigger (called from modal) ── */
  const handleDownload = async () => {
    if (!selectedSession || !programType) return;
    setIsDownloading(true);
    try {
      if (programType === "UG") {
        // Always download the status report
        await reportService.generateUGStatusReport(selectedSession._id, selectedSession.name);
        // If a semester was chosen, also download the project + publication report
        if (semester) {
          await reportService.generateUGProjectReport(selectedSession._id, selectedSession.name, semester);
        }
      } else {
        await reportService.generatePGStatusReport(selectedSession._id, selectedSession.name);
        if (semester) {
          await reportService.generatePGProjectReport(selectedSession._id, selectedSession.name, semester);
        }
      }
      toast.success("Report downloaded successfully!");
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Download failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
     <div className="min-h-screen bg-[#F8FAFC] pb-10 md:pb-20">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">

        <Header
          title="Report Generator"
          subtitle="Build and export programme reports as formatted Excel files"
          icon={FileSpreadsheet}
        />

        {/* ═══════════════════════════════════════════
            STEP 1 — Session
        ═══════════════════════════════════════════ */}
        <StepCard step={1} title="Select Academic Session">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading sessions…
            </div>
          ) : (
            <SessionDropdown
              data={sessions}
              onSelect={(s) => { setSelectedSession(s); setSemester(null); }}
              placeholder="Pick a session"
            />
          )}
        </StepCard>

        {/* ═══════════════════════════════════════════
            STEP 2 — Programme
        ═══════════════════════════════════════════ */}
        <StepCard
          step={2}
          title="Select Programme"
          locked={!selectedSession}
          lockedMessage="Choose a session first"
        >
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { value: "UG", label: "B.Tech", sub: "BTP — Semesters 7 & 8", icon: GraduationCap },
              { value: "PG", label: "M.Tech", sub: "MTP — Semesters 1 – 4", icon: BookOpen },
            ].map(({ value, label, sub, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleProgramChange(value)}
                disabled={!selectedSession}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed
                  ${programType === value
                    ? "border-slate-900 bg-slate-900 text-white shadow-xl"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
              >
                <Icon size={20} className={programType === value ? "text-blue-400 mb-3" : "text-slate-400 mb-3"} />
                <span className="text-sm font-black uppercase tracking-tighter">{label}</span>
                <span className={`text-[10px] font-semibold mt-0.5 ${programType === value ? "text-slate-400" : "text-slate-400"}`}>
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </StepCard>

        {/* ═══════════════════════════════════════════
            STEP 3 — Semester (optional)
        ═══════════════════════════════════════════ */}
        <StepCard
          step={3}
          title="Include Project & Publication Details"
          subtitle="Optional — downloads a second file with project and publication data"
          locked={!programType}
          lockedMessage="Choose a programme first"
        >
          <div className={`grid gap-2.5 ${programType === "PG" ? "grid-cols-4" : "grid-cols-2 max-w-xs"}`}>
            {/* "None" option */}
            <button
              onClick={() => setSemester(null)}
              disabled={!programType}
              className={`flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl border-2 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed
                ${semester === null
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                }`}
            >
              <span className="text-xs font-black uppercase tracking-tight">None</span>
              <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Skip</span>
            </button>

            {semesters.map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => setSemester(value)}
                disabled={!programType}
                className={`flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl border-2 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed
                  ${semester === value
                    ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200"
                    : "border-slate-100 bg-white text-slate-700 hover:border-slate-200"
                  }`}
              >
                <span className="text-xs font-black uppercase tracking-tight">{label}</span>
                <span className={`text-[9px] font-semibold mt-0.5 ${semester === value ? "text-blue-100" : "text-slate-400"}`}>
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </StepCard>

        {/* ═══════════════════════════════════════════
            LIVE PREVIEW
        ═══════════════════════════════════════════ */}
        {programType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Report Preview
                </p>
                <p className="text-slate-800 font-black text-lg uppercase tracking-tighter italic mt-0.5">
                  {semester ? "2 Files" : "1 File"} · {activeSheets.length} Sheet{activeSheets.length !== 1 ? "s" : ""} total
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                <Table2 size={12} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  {programType === "UG" ? "B.Tech" : "M.Tech"} · {selectedSession?.name}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-6 space-y-3">
              {/* Excel file header mockup */}
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50 mb-4">
                <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                  <FileSpreadsheet size={12} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {programType === "UG" ? "BTP" : "MTP"}_Status_Report_{selectedSession?.name}.xlsx
                  </span>
                  {semester && (
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      {programType === "UG" ? "BTP" : "MTP"}_Project_Report_{selectedSession?.name}_Sem{semester}.xlsx
                    </span>
                  )}
                </div>
              </div>

              {activeSheets.map((sheet, i) => (
                <SheetPreviewCard
                  key={sheet.id}
                  sheet={sheet}
                  index={i}
                  semester={semester}
                  conditional={sheet.conditional}
                />
              ))}
            </div>

            {/* Generate button */}
            <button
              onClick={() => setModalOpen(true)}
              disabled={!canGenerate}
              className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm uppercase tracking-widest
                         hover:bg-blue-600 transition-all flex items-center justify-center gap-3
                         shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Generate Report
              <ChevronRight size={16} className="opacity-60" />
            </button>
          </div>
        )}

        {/* Empty state when nothing selected */}
        {!programType && !sessionsLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileSpreadsheet size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm">
              Select a session and programme to preview your report
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          CONFIRMATION MODAL
      ═══════════════════════════════════════════ */}
      {modalOpen && (
        <ConfirmModal
          session={selectedSession}
          programType={programType}
          semester={semester}
          sheets={activeSheets}
          onConfirm={handleDownload}
          onClose={() => { if (!isDownloading) setModalOpen(false); }}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   STEP CARD WRAPPER
══════════════════════════════════════════════════════════════════════════ */
const StepCard = ({ step, title, subtitle, locked = false, lockedMessage, children }) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 transition-all ${
    locked ? "opacity-50" : ""
  }`}>
    <div className="flex items-start gap-4 mb-6">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
        locked ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white"
      }`}>
        {step}
      </div>
      <div>
        <h3 className="font-black text-slate-900 uppercase tracking-tighter italic">{title}</h3>
        {subtitle && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
        )}
        {locked && lockedMessage && (
          <div className="flex items-center gap-1.5 mt-1">
            <AlertCircle size={10} className="text-slate-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lockedMessage}</p>
          </div>
        )}
      </div>
    </div>
    <div className={locked ? "pointer-events-none" : ""}>{children}</div>
  </div>
);

export default ReportGeneratorPage;