import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import profileService from "../../services/Student/profileService";
import { 
  User, Mail, BookOpen, Hash, 
  Calendar, GraduationCap, 
  ShieldCheck, Copy, CheckCircle, Users
} from "lucide-react";
import Header from "../../components/common/Header";

const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

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
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Email copied to clipboard!");
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

        {/* 1. HERO SECTION (Simplified) */}
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar - Small and Simple */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <User size={32} />
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                  {profile?.name}
                </h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-100">
                  STUDENT
                </span>
              </div>
              <div 
                onClick={() => copyToClipboard(profile?.email)}
                className="flex items-center justify-center md:justify-start gap-2 mt-2 text-slate-500 font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors"
              >
                <Mail size={14} className="text-blue-500"/> {profile?.email} <Copy size={12} />
              </div>
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
          <div className="lg:col-span-2 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Academic Profile</h3>
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

          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-10 flex flex-col">
             <div className="flex items-center gap-3 mb-8">
               <ShieldCheck className="text-blue-600" size={24} />
               <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Status Check</h4>
             </div>
             
             <ul className="space-y-6 flex-1">
               <CheckItem label="Institutional Email Verified" checked={true} />
               <CheckItem label="Academic Records Synced" checked={true} />
               <CheckItem label="BTP Module Access" checked={!!profile?.group} />
             </ul>

             <div className="mt-10 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Privacy Note</p>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Your academic data is managed by the department coordinator. Contact them for record corrections.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    slate: "text-slate-400 bg-slate-50"
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800 truncate">{value || "N/A"}</p>
    </div>
  );
};

const InfoBlock = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-base font-bold text-slate-700 leading-tight break-words">{value || "—"}</p>
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

export default StudentProfilePage;