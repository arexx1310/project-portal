import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import profileService from "../../services/Faculty/profileService";
import { 
  User, Mail, Phone, Briefcase, 
  Hash, ShieldCheck, Copy, 
  CheckCircle, Fingerprint, Award,
  Lock, Save, Loader2, LayoutGrid
} from "lucide-react";
import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";

const FacultyProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'security'
  const [profile, setProfile] = useState(null);
  
  // Security State
  const [actionLoading, setActionLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success) setProfile(response.data);
    } catch (error) {
      toast.error(error?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error("Fill all fields");
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match");
    
    setActionLoading(true);
    try {
      const res = await profileService.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (res.success) {
        toast.success("Security credentials updated!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error?.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <Header 
          title="Faculty Account" 
          subtitle="Manage your professional presence and security" 
          icon={User}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem]">
            <Loader fullScreen={false} />
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative transition-all">
            
            {/* 1. Header Section */}
            <div className="p-8 md:p-14 pb-0">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b border-slate-100 pb-12">
                <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                  <Fingerprint size={56} strokeWidth={1.2} />
                </div>
                <div className="text-center md:text-left space-y-4 flex-1">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">{profile?.name}</h1>
                    <span className="px-5 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-200">Faculty</span>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500">
                    <div className="flex items-center gap-2 font-bold text-xs"><Mail size={16} className="text-blue-400"/> {profile?.email}</div>
                    <div className="flex items-center gap-2 font-bold text-xs"><Phone size={16} className="text-blue-400"/> {profile?.phoneNumber || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* 2. Tab Navigation */}
              <div className="flex gap-8 mt-8">
                <TabButton 
                  active={activeTab === 'overview'} 
                  onClick={() => setActiveTab('overview')} 
                  icon={LayoutGrid} 
                  label="Overview" 
                />
                <TabButton 
                  active={activeTab === 'security'} 
                  onClick={() => setActiveTab('security')} 
                  icon={ShieldCheck} 
                  label="Security" 
                />
              </div>
            </div>

            {/* 3. Dynamic Content Area */}
            <div className="p-8 md:p-14 pt-10 transition-all duration-300">
              {activeTab === "overview" ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  <div className="md:col-span-8 space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-8">
                        <SectionTitle icon={Briefcase} title="Placement" />
                        <div className="space-y-6">
                          <InfoItem label="Department" value={profile?.department} />
                          <InfoItem label="Staff ID" value={profile?.staffId} />
                        </div>
                      </div>
                      <div className="space-y-8">
                        <SectionTitle icon={Award} title="Designations" />
                        <div className="flex flex-wrap gap-2">
                          {profile?.roles?.map((role, i) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">
                              {role.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-4 bg-slate-50/80 p-8 rounded-[2rem] border border-slate-200/50">
                    <SectionTitle icon={ShieldCheck} title="Status" />
                    <ul className="space-y-5 mt-6">
                      <CheckItem label="Verified Identity" checked />
                      <CheckItem label="Institutional Email" checked />
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2">
                  <SectionTitle icon={Lock} title="Update Credentials" />
                  <form onSubmit={handlePasswordUpdate} className="mt-8 space-y-6">
                    <PasswordInput 
                      label="Current Password" 
                      value={passwords.currentPassword} 
                      onChange={v => setPasswords({...passwords, currentPassword: v})}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PasswordInput 
                        label="New Password" 
                        value={passwords.newPassword} 
                        onChange={v => setPasswords({...passwords, newPassword: v})}
                      />
                      <PasswordInput 
                        label="Confirm New" 
                        value={passwords.confirmPassword} 
                        onChange={v => setPasswords({...passwords, confirmPassword: v})}
                      />
                    </div>
                    <button 
                      disabled={actionLoading}
                      className="px-10 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Update Security</>}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal UI Components
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all font-black text-[11px] uppercase tracking-widest ${
      active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-blue-600">
      <Icon size={18} strokeWidth={2.5} />
    </div>
    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{title}</h3>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[13px] font-bold text-slate-800">{value || "N/A"}</p>
  </div>
);

const PasswordInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <input 
      type="password" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full h-14 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 font-bold text-slate-700 outline-none transition-all" 
    />
  </div>
);

const CheckItem = ({ label, checked }) => (
  <li className="flex items-center gap-4">
    <div className="bg-emerald-500 rounded-full p-0.5"><CheckCircle size={12} className="text-white" /></div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
  </li>
);

export default FacultyProfilePage;