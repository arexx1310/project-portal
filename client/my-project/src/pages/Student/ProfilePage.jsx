import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import profileService from "../../services/Student/profileService";
import { 
  User, Mail, BookOpen, Hash, 
  Calendar, GraduationCap, 
  ShieldCheck, X, Loader2, Save,
  Users, Copy, CheckCircle
} from "lucide-react";
import Header from "../../components/common/Header";

const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [passwords, setPasswords] = useState({
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
      toast.error(error.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Email copied to clipboard!");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      return toast.error("Please fill in all fields.");
    }

    setActionLoading(true);
    try {
      const response = await profileService.updatePassword(passwords);
      if (response.success) {
        toast.success("Security credentials updated!");
        setIsModalOpen(false);
        setPasswords({ currentPassword: "", newPassword: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Student Profile" 
          subtitle="Manage academic identity and security" 
          icon={User}
        />

        {/* 1. HERO SECTION */}
        <div className="relative overflow-hidden bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />
          
          <div className="relative px-6 sm:px-10 pt-16 sm:pt-20 pb-10">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.1rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <User size={48} className="text-slate-300 sm:size-64" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
                </div>

                <div className="flex-1 mb-2">
                  <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                      {profile?.name}
                    </h1>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-100">
                      STUDENT
                    </span>
                  </div>
                  <div 
                    onClick={() => copyToClipboard(profile?.email)}
                    className="flex items-center justify-center md:justify-start gap-2 mt-4 text-slate-500 font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <Mail size={16} className="text-blue-500"/> {profile?.email} <Copy size={12} />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
              >
                <ShieldCheck size={18} /> Update Security
              </button>
            </div>
          </div>
        </div>

        {/* 2. ACADEMIC QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <QuickStat label="Roll Number" value={profile?.rollNumber} icon={Hash} color="blue" />
          <QuickStat label="Current Semester" value={`${profile?.semester}th Sem`} icon={GraduationCap} color="purple" />
          <QuickStat label="Batch / Session" value={profile?.session} icon={Calendar} color="amber" />
          <QuickStat label="BTP Group" value={profile?.group || "Not Assigned"} icon={Users} color={profile?.group ? "emerald" : "slate"} />
        </div>

        {/* 3. INFORMATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Academic Info */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Academic Profile</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Enrolled Course Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <InfoBlock label="Department" value={profile?.department} />
              <InfoBlock label="Specialization" value={profile?.specialization} />
              <InfoBlock label="Admission Year" value={profile?.admissionYear} />
              <InfoBlock label="Phone Number" value={profile?.phoneNumber} />
              <InfoBlock label="Current Session" value={profile?.session} />
              <InfoBlock label="Institutional Email" value={profile?.email} />
            </div>
          </div>

          {/* Right: Security Status */}
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-10 flex flex-col">
             <div className="flex items-center gap-3 mb-8">
               <ShieldCheck className="text-blue-600" size={24} />
               <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Security Check</h4>
             </div>
             
             <ul className="space-y-6 flex-1">
               <CheckItem label="Institutional Email Verified" checked={true} />
               <CheckItem label="Secure Password Set" checked={true} />
               <CheckItem label="Academic Records Synced" checked={true} />
               <CheckItem label="BTP Module Access" checked={!!profile?.group} />
             </ul>

             <div className="mt-10 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Privacy Note</p>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Your academic data is managed by the department coordinator. Contact them for record corrections.</p>
             </div>
          </div>
        </div>

        {/* --- PASSWORD UPDATE MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-8 sm:p-10 bg-slate-50/50 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Security Update</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Update Portal Credentials</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePasswordUpdate} className="p-8 sm:p-12 space-y-6 sm:space-y-8">
                <div className="space-y-6">
                  <ModalInput label="Current Password" type="password" value={passwords.currentPassword} onChange={v => setPasswords({...passwords, currentPassword: v})} placeholder="••••••••" />
                  <ModalInput label="New Secure Password" type="password" value={passwords.newPassword} onChange={v => setPasswords({...passwords, newPassword: v})} placeholder="••••••••" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 flex-1 h-14 sm:h-16 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all text-xs">
                    Cancel
                  </button>
                  <button disabled={actionLoading} type="submit" className="order-1 sm:order-2 flex-[2] h-14 sm:h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-xs">
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/>Update Password</>}
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

// --- Helper Components ---

const QuickStat = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    slate: "text-slate-400 bg-slate-50"
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors[color]} rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-black text-slate-800 truncate">{value || "N/A"}</p>
    </div>
  );
};

const InfoBlock = ({ label, value }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-base sm:text-lg font-bold text-slate-700 leading-tight break-words">{value || "—"}</p>
  </div>
);

const CheckItem = ({ label, checked }) => (
  <li className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
      <CheckCircle size={14} />
    </div>
    <span className={`text-[11px] font-black uppercase tracking-wider ${checked ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
  </li>
);

const ModalInput = ({ label, type = "text", value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
      {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="w-full h-14 sm:h-16 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 sm:px-8 font-bold text-slate-700 outline-none transition-all text-sm sm:text-base" 
    />
  </div>
);

export default StudentProfilePage;