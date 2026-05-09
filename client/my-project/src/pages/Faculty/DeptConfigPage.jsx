import React, { useState, useEffect, useCallback } from "react";

import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  Settings, Users, ShieldCheck, Clock,
  Save, X, AlertTriangle, Loader2,
  BookOpen, Calendar, Globe, Building2, GraduationCap
} from "lucide-react";

import deptConfigService from "../../services/Faculty/deptConfigService";
import Header from "../../components/ui/Header";

// ─── helpers (same as original page) ────────────────────────────────────────

const hasFacultyRole = (user, roles) => {
  if (!user || user.role !== "faculty") return false;
  const userSubRoles = user.roles || [];
  return roles.some((role) => userSubRoles.includes(role));
};

const toDateInput = (val) => {
  if (!val) return "";
  return val.toString().split("T")[0];
};

const toISOFromDateInput = (val) => {
  if (!val) return null;
  return new Date(val).toISOString();
};

// ─── sub-components (same API as original ConfigInput) ──────────────────────

const ConfigInput = ({ label, icon: Icon, type = "number", name, value, onChange, disabled, placeholder }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1 group-focus-within:text-blue-500 transition-colors">
      <Icon size={14} className="text-blue-500" /> {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full h-14 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 font-bold outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

// ─── confirmation modal (identical to original) ──────────────────────────────

const ConfirmModal = ({ isOpen, onCancel, onConfirm, saving, departmentName, configType }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
            Confirm {configType} Changes?
          </h3>
          <p className="text-slate-500 font-medium text-sm mt-4 leading-relaxed">
            Updating these settings will immediately enforce new rules for all relevant members in the{" "}
            <span className="text-slate-900 font-bold">{departmentName}</span>.
          </p>
          <div className="flex gap-4 mt-10">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 h-16 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : "Confirm Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BTP CARD
// Owns its own local state, dirty-tracking, and save flow.
// ─────────────────────────────────────────────────────────────────────────────

const BTPConfigCard = ({ initialConfig, departmentId, departmentName, canEdit }) => {
  const [btp, setBtp]                   = useState(initialConfig);
  const [originalBtp, setOriginalBtp]   = useState(initialConfig);
  const [saving, setSaving]             = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Mirror: when parent re-fetches (e.g. page refresh), sync down
  useEffect(() => {
    setBtp(initialConfig);
    setOriginalBtp(initialConfig);
  }, [initialConfig]);

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value, type, checked } = e.target;

    const coerce = (v) => {
      if (type === "checkbox") return checked;
      if (type === "number")   return v === "" ? "" : parseInt(v, 10);
      return v;
    };

    if (name.startsWith("crossDept_")) {
      const field = name.replace("crossDept_", "");
      setBtp((prev) => ({
        ...prev,
        crossDepartmentRules: {
          ...prev.crossDepartmentRules,
          [field]: coerce(value),
        },
      }));
    } else {
      setBtp((prev) => ({ ...prev, [name]: coerce(value) }));
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (btp.minStudentsPerGroup > btp.maxStudentsPerGroup) {
      return toast.error("Min students cannot exceed Max students");
    }
    if (btp.minSupervisors > btp.maxSupervisors) {
      return toast.error("Min supervisors cannot exceed Max supervisors");
    }
    if (
      btp.crossDepartmentRules?.isAllowed &&
      (!btp.crossDepartmentRules.minSameDepartmentStudents ||
        btp.crossDepartmentRules.minSameDepartmentStudents <= 0)
    ) {
      return toast.error("Please specify minimum students from same department (must be ≥ 1)");
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...btp,
        groupCreationDeadline:       toISOFromDateInput(btp.groupCreationDeadline),
        supervisorSelectionDeadline: toISOFromDateInput(btp.supervisorSelectionDeadline),
        projectProposalDeadline:     toISOFromDateInput(btp.projectProposalDeadline),
        lockRecordDeadline:          toISOFromDateInput(btp.lockRecordDeadline),
      };

      await deptConfigService.updateBTPConfig(departmentId, { btpConfig: payload });
      toast.success("BTP configuration updated");
      setOriginalBtp(btp);
      setIsConfirmOpen(false);
    } catch (err) {
      toast.error(err?.message || "BTP update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBtp(originalBtp);
    toast("BTP changes discarded", { icon: "↩️" });
  };

  return (
    <>
      <form onSubmit={handleSaveClick} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-10">

        {/* Card header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">BTP Configuration</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Bachelor's Thesis Project rules</p>
          </div>
        </div>

        {/* Group formation */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Users size={12} /> Group Formation
          </p>
          <div className="space-y-4">
            <ConfigInput label="Min Students / Group"  name="minStudentsPerGroup"  value={btp.minStudentsPerGroup}  onChange={handleChange} disabled={!canEdit} icon={Users} />
            <ConfigInput label="Max Students / Group"  name="maxStudentsPerGroup"  value={btp.maxStudentsPerGroup}  onChange={handleChange} disabled={!canEdit} icon={Users} />
          </div>
        </div>

        {/* Supervision */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <ShieldCheck size={12} /> Supervision
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ConfigInput label="Min Supervisors" name="minSupervisors" value={btp.minSupervisors} onChange={handleChange} disabled={!canEdit} icon={ShieldCheck} />
              <ConfigInput label="Max Supervisors" name="maxSupervisors" value={btp.maxSupervisors} onChange={handleChange} disabled={!canEdit} icon={ShieldCheck} />
            </div>
            <ConfigInput label="Max Groups / Faculty" name="maxGroupsPerSupervisor" value={btp.maxGroupsPerSupervisor} onChange={handleChange} disabled={!canEdit} icon={BookOpen} />
          </div>
        </div>

        {/* Cross-department */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Globe size={12} /> Cross-Department
          </p>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Building2 className="text-emerald-500" size={20} />
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Allow Cross-Dept Groups</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Students can collaborate across departments</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="crossDept_isAllowed"
                  checked={btp.crossDepartmentRules?.isAllowed ?? false}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className={`${!btp.crossDepartmentRules?.isAllowed ? "opacity-40 grayscale pointer-events-none" : ""} transition-all duration-300`}>
              <ConfigInput
                label="Min Students from Parent Dept"
                name="crossDept_minSameDepartmentStudents"
                value={btp.crossDepartmentRules?.minSameDepartmentStudents ?? ""}
                onChange={handleChange}
                disabled={!canEdit || !btp.crossDepartmentRules?.isAllowed}
                icon={Users}
                placeholder="e.g. 2"
              />
            </div>
          </div>
        </div>

        {/* Deadlines */}
        <div>
          
          <div className="space-y-4">
            
            <ConfigInput type="date" label="Lock Record Deadline"          name="lockRecordDeadline"          value={toDateInput(btp.lockRecordDeadline)}          onChange={handleChange} disabled={!canEdit} icon={Clock} />
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <X size={18} /> Discard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save BTP Config
            </button>
          </div>
        )}
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmUpdate}
        saving={saving}
        departmentName={departmentName}
        configType="BTP"
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MTP CARD
// Same pattern as BTPConfigCard. MTP has no group-size or cross-dept rules —
// only supervisor caps, cross-dept boolean, and one deadline.
// ─────────────────────────────────────────────────────────────────────────────

const MTPConfigCard = ({ initialConfig, departmentId, departmentName, canEdit }) => {
  const [mtp, setMtp]                   = useState(initialConfig);
  const [originalMtp, setOriginalMtp]   = useState(initialConfig);
  const [saving, setSaving]             = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setMtp(initialConfig);
    setOriginalMtp(initialConfig);
  }, [initialConfig]);

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value, type, checked } = e.target;

    const coerce = (v) => {
      if (type === "checkbox") return checked;
      if (type === "number")   return v === "" ? "" : parseInt(v, 10);
      return v;
    };

    setMtp((prev) => ({ ...prev, [name]: coerce(value) }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (mtp.maxSupervisors < 1) {
      return toast.error("Max supervisors must be at least 1");
    }
    if (mtp.maxStudentsPerSupervisor < 1) {
      return toast.error("Max students per supervisor must be at least 1");
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...mtp,
        lockRecordDeadline: toISOFromDateInput(mtp.lockRecordDeadline),
      };

      await deptConfigService.updateMTPConfig(departmentId, { mtpConfig: payload });
      toast.success("MTP configuration updated");
      setOriginalMtp(mtp);
      setIsConfirmOpen(false);
    } catch (err) {
      toast.error(err?.message || "MTP update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMtp(originalMtp);
    toast("MTP changes discarded", { icon: "↩️" });
  };

  // Department doesn't run a PG programme — show a placeholder instead
  if (!initialConfig) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
          <GraduationCap size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          MTP not configured for this department
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSaveClick} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-10">

        {/* Card header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">MTP Configuration</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Master's Thesis Project rules</p>
          </div>
        </div>

        {/* Supervision */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <ShieldCheck size={12} /> Supervision
          </p>
          <div className="space-y-4">
            <ConfigInput label="Max Supervisors / Student"   name="maxSupervisors"          value={mtp.maxSupervisors}          onChange={handleChange} disabled={!canEdit} icon={ShieldCheck} />
            <ConfigInput label="Max MTP Students / Supervisor" name="maxStudentsPerSupervisor" value={mtp.maxStudentsPerSupervisor} onChange={handleChange} disabled={!canEdit} icon={Users} />
          </div>
        </div>

        {/* Cross-dept toggle */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Globe size={12} /> Cross-Department
          </p>
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Building2 className="text-indigo-500" size={20} />
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Allow Cross-Dept Supervisors</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Students may invite faculty from other departments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="crossDeptisAllowed"
                checked={mtp.crossDeptisAllowed ?? false}
                onChange={handleChange}
                disabled={!canEdit}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        {/* Deadline */}
        <div>
          
          <ConfigInput type="date" label="Lock Record Deadline" name="lockRecordDeadline" value={toDateInput(mtp.lockRecordDeadline)} onChange={handleChange} disabled={!canEdit} icon={Clock} />
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <X size={18} /> Discard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save MTP Config
            </button>
          </div>
        )}
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmUpdate}
        saving={saving}
        departmentName={departmentName}
        configType="MTP"
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const DeptConfigPage = () => {
  const { user } = useAuth();
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);

  // BTP: BTP_COMMITTEE_HEAD or HOD can edit
  const canEditBTP = hasFacultyRole(user, ["BTP_COMMITTEE_HEAD", "HOD"]);
  // MTP: HOD only
  const canEditMTP = hasFacultyRole(user, ["HOD"]);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await deptConfigService.getDepartmentConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to load department settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400">
        No configuration found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header
          title="Department Configuration"
          subtitle="Manage BTP and MTP rules, limits, and academic deadlines"
          icon={Settings}
        />

        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Department hero — same as original */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50" />
            <div className="relative z-10">
              <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-100">
                Active Department
              </span>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-4 italic">
                {config.department}
              </h1>
              <div className="flex flex-wrap gap-2 mt-4">
                {config.specializations?.map((spec, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-lg">
                    {spec}
                  </span>
                ))}
              </div>

              {!canEditBTP && !canEditMTP && (
                <div className="mt-8 flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700">
                  <ShieldCheck size={20} />
                  <p className="text-xs font-bold uppercase tracking-wide">
                    View-Only Mode: BTP editing requires BTP Committee Head or HOD. MTP editing requires HOD.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Two config cards side-by-side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BTPConfigCard
              initialConfig={config.btpConfig}
              departmentId={config._id}
              departmentName={config.department}
              canEdit={canEditBTP}
            />
            <MTPConfigCard
              initialConfig={config.mtpConfig}   // null → shows placeholder
              departmentId={config._id}
              departmentName={config.department}
              canEdit={canEditMTP}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeptConfigPage;