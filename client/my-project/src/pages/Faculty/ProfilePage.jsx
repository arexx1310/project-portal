import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import profileService from "../../services/Faculty/profileService";
import { 
  User, Mail, Hash, ShieldCheck, X, 
  FileText, Loader2, Save, Briefcase
} from "lucide-react";
import Header from "../../components/common/Header";

const FacultyProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingPassword, setEditingPassword] = useState({
    currentPassword: "",
    newPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPassword.currentPassword || !editingPassword.newPassword) {
      return toast.error("Please fill in both password fields.");
    }

    setActionLoading(true);
    try {
      const response = await profileService.updatePassword(editingPassword);
      if (response.success) {
        toast.success(response.message || "Password updated successfully!");
        setIsModalOpen(false);
        setEditingPassword({ currentPassword: "", newPassword: "" }); 
      }
    } catch (error) {
      const errMsg = error?.message || "Update failed";
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Standardized Loading Style
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayRoles = profile?.roles?.map(r => r.replace(/_/g, ' ')).join(", ") || "Faculty";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="My Profile" 
          subtitle="Manage your academic professional identity" 
          icon={User}
        />

        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 1. HERO SECTION */}
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <div className="relative px-8 pt-16 pb-8">
              <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex flex-col md:flex-row items-end gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-white p-1.5 shadow-xl">
                      <div className="w-full h-full rounded-[1.6rem] bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <User size={48} className="text-slate-300" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                  </div>

                  <div className="flex-1 mb-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{profile?.name}</h1>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                        Faculty Member
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-slate-500 font-bold text-sm italic">
                      <div className="flex items-center gap-1.5"><Mail size={14} className="text-blue-500" /> {profile?.email}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mb-2 flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                >
                  <ShieldCheck size={18} /> Change Password
                </button>
              </div>
            </div>
          </div>

          {/* 2. QUICK STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Staff ID" value={profile?.staffId} icon={Hash} />
            <QuickStat label="Privileges" value={displayRoles} icon={ShieldCheck} />
            <QuickStat label="Phone" value={profile?.phoneNumber} icon={Hash} />
            <QuickStat label="Status" value="Active" icon={ShieldCheck} isStatus />
          </div>

          {/* 3. ACADEMIC INFO */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Academic Profile</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Verify your department and contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <InfoBlock label="Department" value={profile?.department} />
              <InfoBlock label="Contact Number" value={profile?.phoneNumber} />
              <InfoBlock label="Institutional Email" value={profile?.email} />
              <InfoBlock label="Primary Role" value={`Supervisor`} />
            </div>
          </div>
        </div>

        {/* --- PASSWORD MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
              <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Update Password</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Ensure your account remains secure</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-10 space-y-6">
                <ModalInput 
                  label="Current Password" 
                  icon={FileText} 
                  type="password"
                  value={editingPassword.currentPassword} 
                  onChange={v => setEditingPassword({...editingPassword, currentPassword: v})} 
                  placeholder="••••••••"
                />
                <ModalInput 
                  label="New Password" 
                  icon={FileText} 
                  type="password"
                  value={editingPassword.newPassword} 
                  onChange={v => setEditingPassword({...editingPassword, newPassword: v})} 
                  placeholder="••••••••" 
                />

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={actionLoading} 
                    type="submit" 
                    className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---
const QuickStat = ({ label, value, icon: Icon, isStatus }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-300 transition-all group">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Icon size={16} />
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-sm font-black truncate uppercase ${isStatus ? 'text-emerald-600' : 'text-slate-800'}`}>
      {value || "N/A"}
    </p>
  </div>
);

const InfoBlock = ({ label, value }) => (
  <div className="space-y-1 group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">{label}</p>
    <p className="text-lg font-bold text-slate-700">{value || "—"}</p>
  </div>
);

const ModalInput = ({ label, icon: Icon, type = "text", value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
      <Icon size={14} className="text-blue-500" /> {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="w-full h-14 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 font-bold outline-none transition-all" 
    />
  </div>
);

export default FacultyProfilePage;