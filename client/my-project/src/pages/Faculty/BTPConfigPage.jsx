import React, { useState, useEffect } from "react";
import btpService from "../../services/Faculty/btpConfigService";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { 
  Settings, Users, ShieldCheck, Clock, 
  Save, X, AlertTriangle, Loader2, Info,
  BookOpen, Calendar, Globe, Building2
} from "lucide-react";
import Header from "../../components/common/Header";

const hasFacultyRole = (user, roles) => {
  if (!user || user.role !== "faculty") return false;
  const userSubRoles = user.faculty?.roles || [];
  return roles.some((role) => userSubRoles.includes(role));
};

const BTPConfigPage = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canEdit = hasFacultyRole(user, ["BTP_COMMITTEE_HEAD", "HOD"]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await btpService.getDepartmentConfig();
      if (response.success) setConfig(response.data);
    } catch (err) {
      toast.error("Failed to load department settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : type === "number" ? parseInt(value) : value;

    // Handle nested crossDepartmentRules
    if (name.startsWith("crossDept_")) {
      const field = name.replace("crossDept_", "");
      setConfig((prev) => ({
        ...prev,
        btpConfig: {
          ...prev.btpConfig,
          crossDepartmentRules: {
            ...prev.btpConfig.crossDepartmentRules,
            [field]: val,
          },
        },
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        btpConfig: { ...prev.btpConfig, [name]: val },
      }));
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    
    const { btpConfig } = config;
    if (btpConfig.minStudentsPerGroup > btpConfig.maxStudentsPerGroup) {
      return toast.error("Min students cannot exceed Max students");
    }
    if (btpConfig.minSupervisors > btpConfig.maxSupervisors) {
      return toast.error("Min supervisors cannot exceed Max supervisors");
    }
    if (btpConfig.crossDepartmentRules.isAllowed && isNaN(btpConfig.crossDepartmentRules.minSameDepartmentStudents)) {
        return toast.error("Please specify minimum students from same department");
    }
    
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setSaving(true);
    try {
      await btpService.updateDepartmentConfig(config._id, { btpConfig: config.btpConfig });
      toast.success("Department configuration updated");
      setIsConfirmOpen(false);
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) return <div className="p-20 text-center font-black uppercase text-slate-400">No configuration found.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Department Configuration" 
          subtitle="Manage BTP rules, limits, and academic deadlines" 
          icon={Settings}
        />

        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* 1. DEPARTMENT HERO */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50" />
             <div className="relative z-10">
                <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-100">
                    Active Department
                </span>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-4 italic">{config.department}</h1>
                <div className="flex flex-wrap gap-2 mt-4">
                    {config.specializations?.map((spec, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-lg">
                            {spec}
                        </span>
                    ))}
                </div>

                {!canEdit && (
                    <div className="mt-8 flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700">
                        <ShieldCheck size={20} />
                        <p className="text-xs font-bold uppercase tracking-wide">View-Only Mode: Restricted to HOD and BTP Committee Head</p>
                    </div>
                )}
             </div>
          </div>

          <form onSubmit={handleSaveClick} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. GROUP RULES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Group Formation</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Define student constraints</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <ConfigInput 
                        label="Min Students / Group" 
                        name="minStudentsPerGroup" 
                        value={config.btpConfig.minStudentsPerGroup} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={Users}
                    />
                    <ConfigInput 
                        label="Max Students / Group" 
                        name="maxStudentsPerGroup" 
                        value={config.btpConfig.maxStudentsPerGroup} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={Users}
                    />
                </div>
            </div>

            {/* 3. SUPERVISOR RULES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Supervision</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Manage faculty workload</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Min Supervisors" name="minSupervisors" value={config.btpConfig.minSupervisors} onChange={handleChange} disabled={!canEdit} icon={ShieldCheck} />
                        <ConfigInput label="Max Supervisors" name="maxSupervisors" value={config.btpConfig.maxSupervisors} onChange={handleChange} disabled={!canEdit} icon={ShieldCheck} />
                    </div>
                    <ConfigInput 
                        label="Max Groups / Faculty Member" 
                        name="maxGroupsPerSupervisor" 
                        value={config.btpConfig.maxGroupsPerSupervisor} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={BookOpen}
                    />
                </div>
            </div>

            {/* 4. CROSS-DEPARTMENT RULES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Cross-Department</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Inter-disciplinary collaboration</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <Building2 className="text-emerald-500" size={20}/>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Allow Cross-Dept Groups</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Students can collaborate across departments</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="crossDept_isAllowed"
                                checked={config.btpConfig.crossDepartmentRules.isAllowed}
                                onChange={handleChange}
                                disabled={!canEdit}
                                className="sr-only peer" 
                            />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <div className={`${!config.btpConfig.crossDepartmentRules.isAllowed ? 'opacity-40 grayscale pointer-events-none' : ''} transition-all duration-300`}>
                        <ConfigInput 
                            label="Min Students from Parent Dept" 
                            name="crossDept_minSameDepartmentStudents" 
                            value={config.btpConfig.crossDepartmentRules.minSameDepartmentStudents} 
                            onChange={handleChange} 
                            disabled={!canEdit || !config.btpConfig.crossDepartmentRules.isAllowed} 
                            icon={Users}
                            placeholder="e.g. 2"
                        />
                        <p className="mt-3 text-[10px] text-slate-400 italic font-medium px-2">
                           * Minimum number of students that must belong to {config.department} in a cross-dept group.
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. DEADLINES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Academic Timeline</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Critical cutoff dates</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <ConfigInput 
                        type="date" 
                        label="Group Creation" 
                        name="groupCreationDeadline" 
                        value={config.btpConfig.groupCreationDeadline ? config.btpConfig.groupCreationDeadline.split("T")[0] : ""} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={Clock} 
                    />
                    <ConfigInput 
                        type="date" 
                        label="Supervisor Selection" 
                        name="supervisorSelectionDeadline" 
                        value={config.btpConfig.supervisorSelectionDeadline ? config.btpConfig.supervisorSelectionDeadline.split("T")[0] : ""} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={Clock} 
                    />
                    <ConfigInput 
                        type="date" 
                        label="Project Proposal" 
                        name="projectProposalDeadline" 
                        value={config.btpConfig.projectProposalDeadline ? config.btpConfig.projectProposalDeadline.split("T")[0] : ""} 
                        onChange={handleChange} 
                        disabled={!canEdit} 
                        icon={Clock} 
                    />
                </div>
            </div>

            <div className="lg:col-span-2">
                {canEdit && (
                    <div className="mt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Save Department Configuration
                        </button>
                    </div>
                )}
            </div>
          </form>
        </div>

        {/* --- CONFIRMATION MODAL --- */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-10 text-center">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Confirm Global Changes?</h3>
                    <p className="text-slate-500 font-medium text-sm mt-4 leading-relaxed">
                        Updating these settings will immediately enforce new rules for all student groups and faculty members in the <span className="text-slate-900 font-bold">{config.department}</span>.
                    </p>
                    
                    <div className="flex gap-4 mt-10">
                        <button 
                            onClick={() => setIsConfirmOpen(false)} 
                            className="flex-1 h-16 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmUpdate} 
                            disabled={saving}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : "Confirm Update"}
                        </button>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default BTPConfigPage;