import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import profileService from "../../services/Faculty/profileService";
import { 
  User, Mail, Hash, Phone, 
  Briefcase, ShieldCheck, Copy, 
  CheckCircle, Award 
} from "lucide-react";
import Header from "../../components/ui/Header";

const FacultyProfilePage = () => {
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
      toast.error(error?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Email copied to clipboard!");
  };

 

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Faculty Profile" 
          subtitle="Manage academic professional identity" 
          icon={User}
        />
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <Loader fullScreen={false} />
          </div>
        ): (
          <>
            {/* 1. HERO SECTION */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <User size={32} />
                </div>

                <div className="text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                      {profile?.name}
                    </h1>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-100">
                      Supervisor
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

            {/* 2. CORE STATS (3 CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <QuickStat label="Department" value={profile?.department} icon={Briefcase} color="blue" />
              <QuickStat label="Staff ID" value={profile?.staffId} icon={Hash} color="purple" />
              <QuickStat label="Phone Number" value={profile?.phoneNumber} icon={Phone} color="amber" />
            </div>

            {/* 3. ROLES SECTION (Matches Hero Width) */}
            {profile?.roles && profile.roles.length > 0 && (
              <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm p-8 sm:p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Special Designations</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Additional Institutional Roles</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {profile.roles.map((role, index) => (
                    <div 
                      key={index} 
                      className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600 uppercase tracking-wider"
                    >
                      {role.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50"
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800 truncate uppercase tracking-tight">{value || "N/A"}</p>
    </div>
  );
};

export default FacultyProfilePage;