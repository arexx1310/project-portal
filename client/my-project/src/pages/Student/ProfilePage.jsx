import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import profileService from "../../services/Student/profileService";
import groupService from "../../services/Student/groupService";

import { 
  User, Mail, BookOpen, GraduationCap, 
  ShieldCheck, Copy, CheckCircle, XCircle,
  Phone, Fingerprint, ExternalLink, Lock,
  Save, Loader2, LayoutGrid
} from "lucide-react";

import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";
import GroupDetails from "../../components/common/Group/GroupDetails";
import ConfirmModal from "../../components/common/ConfirmModal";

const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'security'
  const [profile, setProfile] = useState(null);
  const [group, setGroup] = useState(null);
  const [isPGStudent, setisPGStudent] = useState(false);

  // Security State
  const [actionLoading, setActionLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [isConfirmModalOpen,setIsConfirmModalOpen] = useState(false);
  const [isRegistering,setIsRegistering] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profRes = await profileService.getProfile();
      if (profRes.success) {
        const profileData = profRes.data;
        setProfile(profileData);
        if (profileData?.programType === "PG") setisPGStudent(true);

        if (profileData?.groupId) {
          const groupRes = await groupService.getGroupDetails();
          if (groupRes.success) setGroup(groupRes.data);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error("Fill all fields");
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match");
    if (passwords.newPassword.length < 6) return toast.error("Min 6 characters required");

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

  const handleRegisterPG = async () => {
    if (!profile.name) return;
    try {
      const res = await groupService.createGroup(profile?.name) // uses PG student's name for registering 
      if (res.success) {
          fetchProfile();
      }
    } catch (error) {
      toast.error(error?.message || "Registration Failed");
    } finally {
      setIsRegistering(false);
      setIsConfirmModalOpen(false);
    }
  }

  const groupStatus = group?.status?.toLowerCase();
  const hasGroup = !!profile?.groupId;
  const isRegistered = hasGroup && (groupStatus === "formed");
  const hasSups = hasGroup && (groupStatus === "active");

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", { icon: '📋' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <Header 
          title="Student Account" 
          subtitle="Manage academic credentials and portal security" 
          icon={User}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem]">
            <Loader fullScreen={false} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative transition-all">
              
              {/* Action Button (Only visible in Overview) */}
              {activeTab === "overview" && (
                <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20">
                  {/* 1. If NO Group exists yet */}
                  {!hasGroup && (
                    <>
                      {!isPGStudent ? (
                        // UG Student needs to form a group
                        <button 
                          onClick={() => navigate("/student/group-formation")} 
                          className="px-8 py-3 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all flex items-center gap-2 active:scale-95"
                        >
                          Form Group <ExternalLink size={14} />
                        </button>
                      ) : (
                        // PG Student needs to register (create solo group)
                        <button 
                          onClick={() => setIsConfirmModalOpen(true)} 
                          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all"
                        >
                          Register
                        </button>
                      )}
                    </>
                  )}

                  {/* 2. If Group exists but NO Supervisors (UG or PG) */}
                  {(hasGroup && !hasSups) && (
                    <button 
                      onClick={() => navigate("/student/project-proposals")} 
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all flex items-center gap-2 active:scale-95"
                    >
                      Send Proposal <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              )}

              <div className="p-8 md:p-14 pb-0">
                {/* Identity Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b border-slate-100 pb-12">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                    <Fingerprint size={56} strokeWidth={1.2} />
                  </div>
                  <div className="text-center md:text-left space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">{profile?.name}</h1>
                      <span className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border shadow-sm ${hasSups ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {hasSups ? "Verified" : "Action Required"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500">
                      <div onClick={() => copyToClipboard(profile?.email)} className="flex items-center gap-2 font-bold text-xs cursor-pointer hover:text-blue-600 transition-colors group">
                        <Mail size={16} className="text-blue-400 group-hover:scale-110 transition-transform"/> {profile?.email} <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-2 font-bold text-xs"><Phone size={16} className="text-blue-400"/> {profile?.phoneNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-8 mt-8">
                  <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutGrid} label="Academic Overview" />
                  <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={ShieldCheck} label="Security Settings" />
                </div>
              </div>

              {/* Dynamic Content Area */}
              <div className="p-8 md:p-14 pt-10 transition-all duration-300">
                {activeTab === "overview" ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-2">
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-8">
                        <SectionTitle icon={BookOpen} title="Academic Portfolio" />
                        <div className="space-y-6">
                          <InfoItem label="Unique ID / Roll" value={profile?.rollNumber} />
                          <InfoItem label="Primary Faculty" value={profile?.department} />
                          <InfoItem label="Core Specialization" value={profile?.specialization} />
                        </div>
                      </div>
                      <div className="space-y-8">
                        <SectionTitle icon={GraduationCap} title="Program Timeline" />
                        <div className="space-y-6">
                          <InfoItem label="Active Semester" value={`Semester ${profile?.semester}`} />
                          <InfoItem label="Calendar Session" value={profile?.session} />
                          <InfoItem label="Degree Level" value={profile?.programType === "UG" ? "Undergraduate" : "Postgraduate"} />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-4 bg-slate-50/80 p-8 rounded-[2rem] border border-slate-200/50 backdrop-blur-sm self-start">
                      <SectionTitle icon={ShieldCheck} title="Compliance" />
                      <ul className="space-y-5 mt-6">
                        <CheckItem label="Institutional Email" checked={true} />
                        <CheckItem label="Academic Standing" checked={true} />
                        <CheckItem label="Project Registration" checked={hasSups} />
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
                        placeholder="Enter current password"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PasswordInput 
                          label="New Password" 
                          value={passwords.newPassword} 
                          onChange={v => setPasswords({...passwords, newPassword: v})}
                          placeholder="Min 6 characters"
                        />
                        <PasswordInput 
                          label="Confirm New" 
                          value={passwords.confirmPassword} 
                          onChange={v => setPasswords({...passwords, confirmPassword: v})}
                          placeholder="Repeat password"
                        />
                      </div>
                      <button 
                        disabled={actionLoading}
                        className="px-10 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-200"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Update Security</>}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {activeTab === "overview" && group && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <GroupDetails group={group}/>
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleRegisterPG}
          title="Register for M.Tech dissertation"
          message="By confirming you will be marked registered. You can send a project proposal to professors. This action is non reversible."
          theme="base"
          children="Confirm"
          loading={isRegistering}
        />
      </div>
    </div>
  );
};

// Sub-components
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
    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{title}</h3>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="group min-h-[45px]">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-500 transition-colors">{label}</p>
    <p className="text-[13px] font-bold text-slate-800">{value || "Not Specified"}</p>
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <input 
      type="password" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className="w-full h-14 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal" 
    />
  </div>
);

const CheckItem = ({ label, checked }) => (
  <li className="flex items-center gap-4">
    <div className={`rounded-full p-0.5 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      {checked ? <CheckCircle size={14} className="text-white" /> : <XCircle size={14} className="text-white" />}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? 'text-slate-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </li>
);

export default StudentProfilePage;