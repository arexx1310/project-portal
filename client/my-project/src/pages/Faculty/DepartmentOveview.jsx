import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown, Users, BookOpen, FileText, ExternalLink, Search,
  GraduationCap, ChevronLeft, ChevronRight, FileSpreadsheet,
  Download, Loader2, CheckCircle2, X, ChevronRight as ChevronRightIcon,
  Table2, AlertCircle, ShieldCheck, FolderKanban,
} from "lucide-react";
import { toast } from "react-hot-toast";

import departmentOverviewService from "../../services/Faculty/departmentOverview";
import generalServices from "../../services/Faculty/generalService";
import reportService from "../../services/Faculty/reportService";
import SessionDropdown from "../../components/common/General/SessionDropDown";
import Loader from "../../components/ui/Loader";
import Header from "../../components/ui/Header";

/* ─────────────────────────── Tab Config ─────────────────────────── */
const TABS = [
  { id: "overview", label: "Department Overview", icon: Users },
  { id: "reports",  label: "Report Generator",    icon: FileSpreadsheet },
];

/* ─────────────────────────── Generic Dropdown ─────────────────────────── */
const Dropdown = ({ options, value, onChange, placeholder, icon: Icon, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 min-w-[180px]
          ${disabled
            ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
            : open
              ? "bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-sm text-slate-700"
              : "bg-white border-slate-200 shadow-sm hover:border-slate-300 text-slate-700"
          }`}
      >
        {Icon && <Icon size={16} className="text-indigo-500 shrink-0" />}
        <span className="flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${value === opt.value ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── Status Badge ─────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Published:      "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Under Review": "bg-amber-100 text-amber-700 border-amber-200",
    Submitted:      "bg-blue-100 text-blue-700 border-blue-200",
    Rejected:       "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

/* ─────────────────────────── Publication Cell ─────────────────────────── */
const PublicationCell = ({ pubs }) => {
  if (!pubs?.length) return <span className="text-slate-300 text-sm">—</span>;
  return (
    <div className="flex flex-col gap-1.5">
      {pubs.map((p, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={p.status} />
            {p.publishLink && (
              <a href={p.publishLink} target="_blank" rel="noreferrer"
                className="text-indigo-500 hover:text-indigo-700 transition-colors" title="View publication">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">{p.title}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────── Documents Cell ─────────────────────────── */
const DocumentsCell = ({ docs }) => {
  if (!docs?.length) return <span className="text-slate-300 text-sm">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {docs.map((d, i) => (
        <a key={i} href={d.url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors group">
          <FileText size={12} className="shrink-0" />
          <span className="group-hover:underline underline-offset-2">{d.label}</span>
        </a>
      ))}
    </div>
  );
};

/* ─────────────────────────── Pagination ─────────────────────────── */
const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
      <span className="text-xs text-slate-500">
        Showing <strong className="text-slate-700">{from}–{to}</strong> of{" "}
        <strong className="text-slate-700">{total}</strong> students
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={16} className="text-slate-600" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all
                ${p === page ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={16} className="text-slate-600" />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────── Overview Constants ─────────────────────────── */
const PROGRAM_OPTIONS = [
  { value: "UG", label: "B.Tech (UG)" },
  { value: "PG", label: "M.Tech (PG)" },
];
const UG_SEMESTER_OPTIONS = [
  { value: 7, label: "Semester 7" },
  { value: 8, label: "Semester 8" },
];
const PG_SEMESTER_OPTIONS = [
  { value: 1, label: "Semester 1" },
  { value: 2, label: "Semester 2" },
  { value: 3, label: "Semester 3" },
  { value: 4, label: "Semester 4" },
];

/* ─────────────────────────── Report Constants ─────────────────────────── */
const UG_STATUS_SHEETS = [
  { id: "ungrouped", name: "Students Not In a Group", description: "All UG students whose group ID is null — not yet in any BTP group.", icon: Users, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100", conditional: false },
  { id: "draft", name: "Groups Not Registered", description: "Groups still in Draft status — not yet registered by students.", icon: FolderKanban, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", conditional: false },
  { id: "nosup", name: "Groups With NO Supervisors", description: "Formed groups awaiting supervisor assignment.", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", conditional: false },
];
const UG_PROJECT_SHEETS = [
  { id: "projects", name: (sem) => `BTP ${sem === 7 ? "Phase 1" : "Phase 2"} — Sem ${sem} Projects`, description: "Group name, status, members, supervisors, project title and domain.", icon: FileSpreadsheet, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", conditional: true },
  { id: "publications", name: (sem) => `BTP ${sem === 7 ? "Phase 1" : "Phase 2"} — Publications`, description: "Publication details per project — conference, status, DOI and published info.", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", conditional: true },
];
const PG_STATUS_SHEETS = [
  { id: "pgnotregistered", name: "Students Not Registered", description: "MTech students with no group assigned yet.", icon: Users, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100", conditional: false },
  { id: "pgnosup", name: "Students With No Supervisors", description: "MTech students in a group but with no supervisor assigned.", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", conditional: false },
];
const PG_PROJECT_SHEETS = [
  { id: "pgprojects", name: (sem) => `MTP Sem ${sem} Projects`, description: "Student name, roll, supervisor(s), project title and domain.", icon: FileSpreadsheet, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", conditional: true },
  { id: "pgpublications", name: (sem) => `MTP Sem ${sem} — Publications`, description: "Publication details per project — conference, status, DOI and published info.", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", conditional: true },
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

/* ─────────────────────────── Report Helpers ─────────────────────────── */
const getActiveSheets = (programType, semester) => {
  if (!programType) return [];
  const statusSheets  = programType === "UG" ? UG_STATUS_SHEETS  : PG_STATUS_SHEETS;
  const projectSheets = programType === "UG" ? UG_PROJECT_SHEETS : PG_PROJECT_SHEETS;
  return semester ? [...statusSheets, ...projectSheets] : statusSheets;
};

const resolveSheetName = (sheet, semester) =>
  typeof sheet.name === "function" ? sheet.name(semester) : sheet.name;

/* ─────────────────────────── Confirm Modal ─────────────────────────── */
const ConfirmModal = ({ session, programType, semester, sheets, onConfirm, onClose, isDownloading }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Confirm Report Generation</p>
            <h2 className="text-white font-black text-xl uppercase tracking-tighter italic">{session?.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{programLabel}</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{semLabel}</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isDownloading}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40">
            <X size={18} />
          </button>
        </div>
        <div className="px-8 py-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Sheets Included in Download</p>
          {sheets.map((sheet, i) => {
            const Icon = sheet.icon;
            return (
              <div key={sheet.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${sheet.bg} ${sheet.border}`}>
                <div className="w-5 h-5 rounded-md bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                </div>
                <Icon size={14} className={`shrink-0 ${sheet.color}`} />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{resolveSheetName(sheet, semester)}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{sheet.description}</p>
                </div>
                <CheckCircle2 size={14} className={`ml-auto shrink-0 ${sheet.color}`} />
              </div>
            );
          })}
        </div>
        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose} disabled={isDownloading}
            className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDownloading}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-slate-200 disabled:opacity-60 disabled:cursor-not-allowed">
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

/* ─────────────────────────── Sheet Preview Card ─────────────────────────── */
const SheetPreviewCard = ({ sheet, index, semester, conditional }) => {
  const Icon = sheet.icon;
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      conditional ? "border-dashed border-blue-200 bg-blue-50/50" : "border-slate-100 bg-white shadow-sm"
    }`}>
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">{index + 1}</span>
        <div className={`p-2 rounded-xl ${sheet.bg}`}><Icon size={14} className={sheet.color} /></div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{resolveSheetName(sheet, semester)}</p>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{sheet.description}</p>
      </div>
      {conditional && (
        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
          +Project Data
        </span>
      )}
    </div>
  );
};

/* ─────────────────────────── Step Card ─────────────────────────── */
const StepCard = ({ step, title, subtitle, locked = false, lockedMessage, children }) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 transition-all ${locked ? "opacity-50" : ""}`}>
    <div className="flex items-start gap-4 mb-6">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${locked ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white"}`}>
        {step}
      </div>
      <div>
        <h3 className="font-black text-slate-900 uppercase tracking-tighter italic">{title}</h3>
        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
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

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: DEPARTMENT OVERVIEW
═══════════════════════════════════════════════════════════════════════════ */
const DepartmentOverviewTab = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [program, setProgram]                 = useState(null);
  const [semester, setSemester]               = useState(null);
  const [students, setStudents]               = useState([]);
  const [pagination, setPagination]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [searched, setSearched]               = useState(false);
  const [search, setSearch]                   = useState("");

  const handleProgramChange = (val) => {
    setProgram(val);
    setSemester(null);
    setStudents([]);
    setPagination(null);
    setSearched(false);
  };

  const semesterOptions =
    program === "UG" ? UG_SEMESTER_OPTIONS :
    program === "PG" ? PG_SEMESTER_OPTIONS : [];

  const fetchStudents = useCallback(async (page = 1) => {
    if (!selectedSession || !program) {
      toast.error("Please select a session and programme.");
      return;
    }
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (semester !== null) params.semester = semester;

      const res = program === "UG"
        ? await departmentOverviewService.getUGStudents(selectedSession._id, params)
        : await departmentOverviewService.getPGStudents(selectedSession._id, params);

      if (res.success) {
        setStudents(res.data);
        setPagination(res.pagination);
        setSearched(true);
        if (res.data.length === 0) toast("No students found for the selected filters.");
      } else {
        toast.error(res.message ?? "Failed to fetch students.");
      }
    } catch (err) {
      toast.error(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [selectedSession, program, semester]);

  const filteredStudents = students.filter((s) =>
    !search.trim() ||
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const isPG = program === "PG";
  const columns = [
    { key: "sNo",             label: "#" },
    { key: "studentName",     label: "Student" },
    { key: "rollNumber",      label: "Roll No" },
    { key: "semester",        label: "Sem" },
    ...(!isPG ? [{ key: "specialization", label: "Spec." }] : []),
    { key: "groupName",       label: "Group" },
    { key: "supervisorNames", label: "Supervisor(s)" },
    { key: "projectTitle",    label: "Project" },
    { key: "publicationStatuses", label: "Publications" },
    { key: "projectDocuments",    label: "Documents" },
  ];

  return (
    <div className="space-y-5">
      {/* Filters card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Session</label>
            <SessionDropdown data={sessions} onSelect={setSelectedSession} placeholder="Select Session" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Programme</label>
            <Dropdown options={PROGRAM_OPTIONS} value={program} onChange={handleProgramChange} placeholder="Select Programme" icon={GraduationCap} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Semester</label>
            <Dropdown options={semesterOptions} value={semester} onChange={setSemester} placeholder="All Semesters" icon={BookOpen} disabled={!program} />
          </div>
          <button
            onClick={() => fetchStudents(1)}
            disabled={loading || !selectedSession || !program}
            className="px-5 h-[42px] rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.15em] shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader size="h-4 w-4" color="border-white" /> : <><Search size={14} /> Fetch Students</>}
          </button>
        </div>
      </div>

      {/* Table card */}
      {(searched || loading) && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Users size={16} className="text-indigo-500" />
              <span className="text-sm font-bold">
                {program === "UG" ? "B.Tech" : "M.Tech"} Students
                {selectedSession ? ` — ${selectedSession.name}` : ""}
                {semester ? `, Semester ${semester}` : ""}
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name / roll no…"
                className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-slate-50 placeholder:text-slate-400 w-52" />
            </div>
          </div>

          {loading ? (
            <Loader text="Fetching students…" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                        <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No students match your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.rollNumber} className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors duration-100">
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{s.sNo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.studentName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{s.rollNumber}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold leading-6 text-center">{s.semester}</span>
                        </td>
                        {!isPG && <td className="px-4 py-3 text-slate-600 text-xs">{s.specialization ?? "—"}</td>}
                        <td className="px-4 py-3">
                          {s.groupName !== "—"
                            ? <span className="inline-block px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold">{s.groupName}</span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px]">
                          {s.supervisorNames?.length
                            ? s.supervisorNames.map((n, i) => <div key={i} className="whitespace-nowrap">{n}</div>)
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-[180px]">
                          {s.projectTitle !== "—"
                            ? <span className="leading-snug line-clamp-2">{s.projectTitle}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]"><PublicationCell pubs={s.publicationStatuses} /></td>
                        <td className="px-4 py-3"><DocumentsCell docs={s.projectDocuments} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination && !loading && filteredStudents.length > 0 && !search && (
            <Pagination pagination={pagination} onPageChange={(p) => fetchStudents(p)} />
          )}
        </div>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <GraduationCap size={48} className="mb-3 opacity-20" />
          <p className="text-sm">Select a session and programme, then click <strong>Fetch Students</strong>.</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: REPORT GENERATOR
═══════════════════════════════════════════════════════════════════════════ */
const ReportGeneratorTab = ({ sessions, sessionsLoading }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [programType, setProgramType]         = useState(null);
  const [semester, setSemester]               = useState(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [isDownloading, setIsDownloading]     = useState(false);

  const handleProgramChange = (prog) => { setProgramType(prog); setSemester(null); };

  const semesters    = programType === "UG" ? UG_SEMESTERS : PG_SEMESTERS;
  const activeSheets = programType ? getActiveSheets(programType, semester) : [];
  const canGenerate  = !!selectedSession && !!programType;

  const handleDownload = async () => {
    if (!selectedSession || !programType) return;
    setIsDownloading(true);
    try {
      if (programType === "UG") {
        await reportService.generateUGStatusReport(selectedSession._id, selectedSession.name);
        if (semester) await reportService.generateUGProjectReport(selectedSession._id, selectedSession.name, semester);
      } else {
        await reportService.generatePGStatusReport(selectedSession._id, selectedSession.name);
        if (semester) await reportService.generatePGProjectReport(selectedSession._id, selectedSession.name, semester);
      }
      toast.success("Report downloaded successfully!");
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Step 1 */}
      <StepCard step={1} title="Select Academic Session">
        {sessionsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading sessions…
          </div>
        ) : (
          <SessionDropdown data={sessions} onSelect={(s) => { setSelectedSession(s); setSemester(null); }} placeholder="Pick a session" />
        )}
      </StepCard>

      {/* Step 2 */}
      <StepCard step={2} title="Select Programme" locked={!selectedSession} lockedMessage="Choose a session first">
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { value: "UG", label: "B.Tech", sub: "BTP — Semesters 7 & 8", icon: GraduationCap },
            { value: "PG", label: "M.Tech", sub: "MTP — Semesters 1 – 4", icon: BookOpen },
          ].map(({ value, label, sub, icon: Icon }) => (
            <button key={value} onClick={() => handleProgramChange(value)} disabled={!selectedSession}
              className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed
                ${programType === value ? "border-slate-900 bg-slate-900 text-white shadow-xl" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
              <Icon size={20} className={`${programType === value ? "text-blue-400" : "text-slate-400"} mb-3`} />
              <span className="text-sm font-black uppercase tracking-tighter">{label}</span>
              <span className={`text-[10px] font-semibold mt-0.5 ${programType === value ? "text-slate-400" : "text-slate-400"}`}>{sub}</span>
            </button>
          ))}
        </div>
      </StepCard>

      {/* Step 3 */}
      <StepCard step={3} title="Include Project & Publication Details"
        subtitle="Optional — downloads a second file with project and publication data"
        locked={!programType} lockedMessage="Choose a programme first">
        <div className={`grid gap-2.5 ${programType === "PG" ? "grid-cols-4" : "grid-cols-2 max-w-xs"}`}>
          <button onClick={() => setSemester(null)} disabled={!programType}
            className={`flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl border-2 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed
              ${semester === null ? "border-slate-300 bg-slate-100 text-slate-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"}`}>
            <span className="text-xs font-black uppercase tracking-tight">None</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Skip</span>
          </button>
          {semesters.map(({ value, label, sub }) => (
            <button key={value} onClick={() => setSemester(value)} disabled={!programType}
              className={`flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl border-2 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed
                ${semester === value ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200" : "border-slate-100 bg-white text-slate-700 hover:border-slate-200"}`}>
              <span className="text-xs font-black uppercase tracking-tight">{label}</span>
              <span className={`text-[9px] font-semibold mt-0.5 ${semester === value ? "text-blue-100" : "text-slate-400"}`}>{sub}</span>
            </button>
          ))}
        </div>
      </StepCard>

      {/* Live Preview */}
      {programType && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Report Preview</p>
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
              <SheetPreviewCard key={sheet.id} sheet={sheet} index={i} semester={semester} conditional={sheet.conditional} />
            ))}
          </div>
          <button onClick={() => setModalOpen(true)} disabled={!canGenerate}
            className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={20} />
            Generate Report
            <ChevronRightIcon size={16} className="opacity-60" />
          </button>
        </div>
      )}

      {!programType && !sessionsLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FileSpreadsheet size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold text-sm">Select a session and programme to preview your report</p>
        </div>
      )}

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

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT: DEPARTMENT HUB
═══════════════════════════════════════════════════════════════════════════ */
const DepartmentHub = () => {
  const [activeTab, setActiveTab]           = useState("overview");
  const [sessions, setSessions]             = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    generalServices.getSessions()
      .then((res) => { if (res?.data) setSessions(res.data); })
      .catch(() => toast.error("Failed to load academic sessions."))
      .finally(() => setSessionsLoading(false));
  }, []);

  const activeTabConfig = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-5 p-4 md:p-6">

        {/* Header */}
        <Header
          title={activeTabConfig.label}
          subtitle={
            activeTab === "overview"
              ? "View student project assignments across UG & PG programmes"
              : "Build and export programme reports as formatted Excel files"
          }
          icon={activeTabConfig.icon}
        />

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-1.5 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                ${activeTab === id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Icon size={15} className={activeTab === id ? "text-blue-400" : "text-slate-400"} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <DepartmentOverviewTab sessions={sessions} />
        )}
        {activeTab === "reports" && (
          <ReportGeneratorTab sessions={sessions} sessionsLoading={sessionsLoading} />
        )}
      </div>
    </div>
  );
};

export default DepartmentHub;