import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import profileService from "../../services/Student/profileService";

import groupService from "../../services/Student/groupService";

import { 
  User, Mail, BookOpen, Calendar, GraduationCap, 
  ShieldCheck, Copy, CheckCircle, XCircle,
  Phone, Fingerprint, ExternalLink
} from "lucide-react";

import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";

import GroupDetails from "../../components/common/Group/GroupDetails";

const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [group, setGroup] = useState(null);
  const [isPGStudent, setisPGStudent] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const groupStatus = group?.status?.toLowerCase();
  const hasGroup = !!profile?.groupId;

  const isRegistered =
    hasGroup &&
    groupStatus === "active";

  const fetchProfile = async () => {
  try {
    setLoading(true);

    const profRes = await profileService.getProfile();

    if (profRes.success) {
      const profileData = profRes.data;

      setProfile(profileData);

      if (profileData?.programType === "PG") {
        setisPGStudent(true);
      }

      // Fetch group only if groupId exists
      if (profileData?.groupId) {
        const groupRes = await groupService.getGroupDetails();

        if (groupRes.success && groupRes.data) {
          setGroup(groupRes.data);
        }
      }
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
    toast.success("Copied to clipboard", { icon: '📋' });
  };

  const handlePgRegistration = async () => {
      if (!profile?.name || !isPGStudent) return;

      try {
        const res = await groupService.createGroup(profile.name);

        if (res.success) {
          toast.success("Registration Successful!");

          // Reload profile + group
          fetchProfile();
        }
      } catch (error) {
        toast.error(error?.message || "Registration Failed");
      }
  };

  return (
     <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <Header 
          title="Student Profile" 
          subtitle="Manage your academic credentials and group status" 
          icon={User}
        />
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <Loader fullScreen={false} />
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative transition-all hover:shadow-2xl hover:shadow-slate-200/50">
          
          {/* Action Button Container */}
          <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20">

            {/* ================= UG STUDENT ================= */}
            {!isPGStudent && (
              <>
                {/* No group */}
                {!hasGroup && (
                  <button
                    className="px-8 py-3 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95"
                    onClick={() => navigate("/student/group-formation")}
                  >
                    Form Group <ExternalLink size={14} />
                  </button>
                )}

                {/* Draft group */}
                {hasGroup && groupStatus === "draft" && (
                  <button
                    className="px-8 py-3 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95"
                    onClick={() => navigate("/student/group-formation")}
                  >
                    Form Group <ExternalLink size={14} />
                  </button>
                )}

                {/* Formed group */}
                {hasGroup && groupStatus === "formed" && (
                  <button
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                    onClick={() => navigate("/student/project-proposals")}
                  >
                    Send Proposal <ExternalLink size={14} />
                  </button>
                )}

                {/* Active => no button */}
              </>
            )}

            {/* ================= PG STUDENT ================= */}
            {isPGStudent && (
              <>
                {/* No group */}
                {!hasGroup && (
                  <button
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                    onClick={handlePgRegistration}
                  >
                    Register
                  </button>
                )}

                {/* Draft group */}
                {hasGroup && groupStatus === "draft" && (
                  <button
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                    onClick={() => navigate("/student/project-proposals")}
                  >
                    Send Proposal <ExternalLink size={14} />
                  </button>
                )}

                {/* Active => no button */}
              </>
            )}
          </div>

          <div className="p-8 md:p-14">
            {/* Identity Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b border-slate-100 pb-12">
              <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                <Fingerprint size={56} strokeWidth={1.2} />
              </div>

              <div className="text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    {profile?.name}
                  </h1>
                  <span className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border shadow-sm ${isRegistered ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {isRegistered ? "Verified" : "Action Required"}
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500">
                  <div 
                    onClick={() => copyToClipboard(profile?.email)}
                    className="flex items-center gap-2 font-bold text-xs cursor-pointer hover:text-blue-600 transition-colors group"
                  >
                    <Mail size={16} className="text-blue-400 group-hover:scale-110 transition-transform"/> 
                    {profile?.email} 
                    <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Phone size={16} className="text-blue-400"/> {profile?.phoneNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-12">
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

              {/* Status Sidebar */}
              <div className="md:col-span-4 bg-slate-50/80 p-8 rounded-[2rem] border border-slate-200/50 backdrop-blur-sm self-start">
                <SectionTitle icon={ShieldCheck} title="Compliance" />
                <ul className="space-y-5 mt-6">
                  <CheckItem label="Institutional Email" checked={true} />
                  <CheckItem label="Academic Standing" checked={true} />
                  <CheckItem label="Project Registration" checked={isRegistered} />
                </ul>
                <div className="pt-8 mt-8 border-t border-slate-200">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                    Last Cloud Sync<br/>
                    <span className="text-slate-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
            
        {group && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <GroupDetails group={group}/>
          </div>
        )}
          </div>
        )}
        
      </div>
    </div>
  );
};

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
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-500 transition-colors">
      {label}
    </p>
    <p className="text-[13px] font-bold text-slate-800">{value || "Not Specified"}</p>
  </div>
);

const CheckItem = ({ label, checked }) => (
  <li className="flex items-center gap-4">
    {checked ? (
      <div className="bg-emerald-500 rounded-full p-0.5"><CheckCircle size={14} className="text-white" /></div>
    ) : (
      <div className="bg-slate-200 rounded-full p-0.5"><XCircle size={14} className="text-white" /></div>
    )}
    <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? 'text-slate-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </li>
);

export default StudentProfilePage;