import { useState, useEffect } from "react";
import {
  Layers,
  Calendar,
  CheckCircle2,
  Quote,
  Pencil,
  X,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";

import Loader from "../../ui/Loader";
import facultyProjectService from "../../../services/Faculty/projectServices";
import projectService from "../../../services/Student/projectServices";

/* ── Status transitions mirrored from the backend controller ───────────── */
const STATUS_TRANSITIONS = {
  Approved: ["In Progress"],
  "In Progress": ["Completed"],
  Completed: ["In Progress"],
};

const STATUS_COLORS = {
  Proposed: "text-slate-500",
  Approved: "text-emerald-500",
  "In Progress": "text-amber-500",
  Completed: "text-blue-500",
};

/* ══════════════════════════════════════════════════════════════════════════
   ProjectDetails
══════════════════════════════════════════════════════════════════════════ */
const ProjectDetails = ({ projectId, isFaculty = false }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Edit state */
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({}); // Working copy while editing
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /* ── Fetch Data ── */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = isFaculty
          ? await facultyProjectService.getProjectById(projectId)
          : await projectService.getProjectDetails(projectId);
        setProject(res.data);
      } catch (err) {
        setError(err?.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchDetails();
  }, [projectId, isFaculty]);

  /* ── Enter edit mode — copy current values into draft ── */
  const handleEditOpen = () => {
    setDraft({
      title: project.title,
      description: project.description,
      domain: project.domain,
      status: project.status,
    });
    setSaveError(null);
    setEditing(true);
  };

  /* ── Cancel — discard draft ── */
  const handleCancel = () => {
    setEditing(false);
    setDraft({});
    setSaveError(null);
  };

  /* ── Save — send only fields that actually changed ── */
  const handleSave = async () => {
    const payload = {};
    const editableFields = isFaculty
      ? ["title", "description", "domain", "status"]
      : ["title", "description", "domain"];

    for (const field of editableFields) {
      const trimmed = typeof draft[field] === "string" ? draft[field].trim() : draft[field];
      if (!trimmed) {
        setSaveError(`"${field}" cannot be blank.`);
        return;
      }
      if (trimmed !== project[field]) {
        payload[field] = trimmed;
      }
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      const res = isFaculty
        ? await facultyProjectService.editProjectDetails(projectId, payload)
        : await projectService.editProjectDetails(projectId, payload);

      setProject(res.project ?? { ...project, ...payload });
      setEditing(false);
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Field change helper ── */
  const handleDraftChange = (field, value) => {
    setSaveError(null);
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Render Guards ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader />
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 text-red-500 text-sm p-4">
      <AlertCircle size={16} /> {error}
    </div>
  );
  if (!project) return null;

  const availableTransitions = STATUS_TRANSITIONS[project.status] ?? [];
  const canEdit = isFaculty || project.status !== "Completed";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
      {/* ── Save Error Banner ── */}
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-semibold">
          <AlertCircle size={14} className="shrink-0" />
          {saveError}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          1. Project Content Card (Title, Domain, Description)
      ═══════════════════════════════════════════════════ */}
      <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 relative overflow-hidden group">
        {/* Top Controls & Domain */}
        <div className="flex justify-between items-start mb-6">
          {canEdit && (
            <div className="flex items-center gap-1.5">
              {editing ? (
                <>
                  <ActionButton
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                    title="Save changes"
                  >
                    {saving ? (
                      <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                  </ActionButton>
                  <ActionButton
                    onClick={handleCancel}
                    disabled={saving}
                    className="bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    title="Cancel"
                  >
                    <X size={12} />
                  </ActionButton>
                </>
              ) : (
                <ActionButton
                  onClick={handleEditOpen}
                  className="bg-slate-50 border-slate-200 text-slate-400 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-500"
                  title="Edit project"
                >
                  <Pencil size={12} />
                </ActionButton>
              )}
            </div>
          )}

          {/* Domain Badge */}
          <div>
            {editing ? (
              <input
                value={draft.domain}
                onChange={(e) => handleDraftChange("domain", e.target.value)}
                placeholder="Domain"
                className="text-[9px] font-black uppercase tracking-tighter text-indigo-600
                           bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1
                           outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                           transition-all w-32 text-center placeholder-indigo-300"
              />
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <Layers size={10} className="text-indigo-600" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
                  {project.domain}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-slate-300" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Project Title
            </h4>
          </div>
          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => handleDraftChange("title", e.target.value)}
              placeholder="Enter project title..."
              className="w-full text-xl sm:text-2xl font-bold text-slate-800 bg-slate-50 
                         border border-slate-200 rounded-xl px-4 py-2 outline-none 
                         focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
              {project.title}
            </h1>
          )}
        </div>

        {/* Project Description */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Quote size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Project Abstract
            </h4>
          </div>
          {editing ? (
            <textarea
              value={draft.description}
              onChange={(e) => handleDraftChange("description", e.target.value)}
              rows={5}
              placeholder="Project description..."
              className="w-full text-slate-600 text-sm font-medium leading-relaxed italic
                         bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3
                         outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50
                         resize-none transition-all placeholder-slate-300"
            />
          ) : (
            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed italic">
              {project.description}
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. Bottom Tiles — Semester & Status
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailTile
          icon={<Calendar size={18} />}
          label="Semester"
          value={`Sem ${project.semester}`}
          color="text-amber-500"
        />

        {editing && isFaculty && availableTransitions.length > 0 ? (
          <StatusEditTile
            current={draft.status}
            options={[project.status, ...availableTransitions]}
            onChange={(val) => handleDraftChange("status", val)}
          />
        ) : (
          <DetailTile
            icon={<CheckCircle2 size={18} />}
            label="Current Status"
            value={project.status}
            color={STATUS_COLORS[project.status] ?? "text-slate-500"}
          />
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

const ActionButton = ({ onClick, disabled, className, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const DetailTile = ({ icon, label, value, color }) => (
  <div className="bg-white border border-slate-200 p-5 rounded-[1.8rem] flex items-center gap-4 transition-all hover:border-slate-300">
    <div className={`p-3 bg-slate-50 rounded-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
        {label}
      </span>
      <p className="text-xs font-black text-slate-800 uppercase">
        {value}
      </p>
    </div>
  </div>
);

const StatusEditTile = ({ current, options, onChange }) => (
  <div className="bg-white border border-indigo-200 p-5 rounded-[1.8rem] flex items-center gap-4 ring-2 ring-indigo-50 transition-all shadow-sm">
    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-500">
      <CheckCircle2 size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
        Update Status
      </span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-black text-slate-800 uppercase bg-transparent outline-none
                   cursor-pointer w-full border-b border-indigo-200 pb-0.5
                   focus:border-indigo-400 transition-colors"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default ProjectDetails;