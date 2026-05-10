import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Users,
  BookOpen,
  FileText,
  ExternalLink,
  Search,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

import departmentOverviewService from "../../services/Faculty/departmentOverview";
import generalServices from "../../services/Faculty/generalService";
import SessionDropdown from "../../components/common/General/SessionDropDown";
import Loader from "../../components/ui/Loader";
import Header from "../../components/ui/Header";

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
                className="text-indigo-500 hover:text-indigo-700 transition-colors"
                title="View publication">
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

/* ─────────────────────────── Constants ─────────────────────────── */
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

/* ─────────────────────────── Main Page ─────────────────────────── */
const DepartmentOverview = () => {
  const [sessions, setSessions]               = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [program, setProgram]                 = useState(null);
  const [semester, setSemester]               = useState(null);

  const [students, setStudents]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [search, setSearch]         = useState("");

  /* load sessions on mount */
  useEffect(() => {
    generalServices.getSessions()
      .then((res) => { if (res.success) setSessions(res.data); })
      .catch((err) => toast.error(err?.message ?? "Failed to load sessions"));
  }, []);

  /* reset semester when program changes */
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
      const params = { page, limit: 20 };
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
    { key: "sNo",                 label: "#" },
    { key: "studentName",         label: "Student" },
    { key: "rollNumber",          label: "Roll No" },
    { key: "semester",            label: "Sem" },
    ...(!isPG ? [{ key: "specialization", label: "Spec." }] : []),
    { key: "groupName",           label: "Group" },
    { key: "supervisorNames",     label: "Supervisor(s)" },
    { key: "projectTitle",        label: "Project" },
    { key: "publicationStatuses", label: "Publications" },
    { key: "projectDocuments",    label: "Documents" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-5 p-4 md:p-6">

        {/* Header */}
        <Header
          title="Department Overview"
          subtitle="View student project assignments across UG & PG programmes"
          icon={Users}
        />

        {/* Filters card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap items-end gap-3">
            {/* Session */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Session</label>
              <SessionDropdown
                data={sessions}
                onSelect={setSelectedSession}
                placeholder="Select Session"
              />
            </div>

            {/* Programme */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Programme</label>
              <Dropdown
                options={PROGRAM_OPTIONS}
                value={program}
                onChange={handleProgramChange}
                placeholder="Select Programme"
                icon={GraduationCap}
              />
            </div>

            {/* Semester */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Semester</label>
              <Dropdown
                options={semesterOptions}
                value={semester}
                onChange={setSemester}
                placeholder="All Semesters"
                icon={BookOpen}
                disabled={!program}
              />
            </div>

            <button
              onClick={() => fetchStudents(1)}
              disabled={loading || !selectedSession || !program}
              className="px-5 h-[42px] rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.15em] shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader size="h-4 w-4" color="border-white" />
              ) : (
                <>
                  <Search size={14} />
                  Fetch Students
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table card */}
        {(searched || loading) && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Toolbar */}
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
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name / roll no…"
                  className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-slate-50 placeholder:text-slate-400 w-52"
                />
              </div>
            </div>

            {/* Loader replaces table while fetching */}
            {loading ? (
              <Loader text="Fetching students…" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {columns.map((col) => (
                        <th key={col.key}
                          className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
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
                        <tr key={s.rollNumber}
                          className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors duration-100">
                          <td className="px-4 py-3 text-slate-400 text-xs font-mono">{s.sNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.studentName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{s.rollNumber}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold leading-6 text-center">
                              {s.semester}
                            </span>
                          </td>
                          {!isPG && (
                            <td className="px-4 py-3 text-slate-600 text-xs">{s.specialization ?? "—"}</td>
                          )}
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
                          <td className="px-4 py-3 max-w-[200px]">
                            <PublicationCell pubs={s.publicationStatuses} />
                          </td>
                          <td className="px-4 py-3">
                            <DocumentsCell docs={s.projectDocuments} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination — hidden when search is active */}
            {pagination && !loading && filteredStudents.length > 0 && !search && (
              <Pagination pagination={pagination} onPageChange={(p) => fetchStudents(p)} />
            )}
          </div>
        )}

        {/* Empty state before first fetch */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <GraduationCap size={48} className="mb-3 opacity-20" />
            <p className="text-sm">
              Select a session and programme, then click <strong>Fetch Students</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentOverview;