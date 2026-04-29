import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { ShieldCheck, Lock, Save, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import profileService from "../../services/Student/profileService";
import Header from "../../components/common/Header";

const ChangePasswordStudent = () => {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwords.currentPassword || !passwords.newPassword) {
      return toast.error("Please fill in all fields.");
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    if (passwords.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setActionLoading(true);
    try {
      const response = await profileService.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response.success) {
        toast.success("Password updated successfully!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <Header 
            title="Security Settings" 
            subtitle="Update your portal access credentials" 
            icon={ShieldCheck}
          />
        </div>

        <div className=" bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Change Password</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ensure your account stays protected</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6 w-full">
              <div className="grid grid-cols-1 gap-6">
                <PasswordInput 
                  label="Current Password" 
                  value={passwords.currentPassword} 
                  onChange={v => setPasswords({...passwords, currentPassword: v})} 
                  placeholder="Enter current password"
                />
                
                <div className="h-px bg-slate-100 my-2" />

                <PasswordInput 
                  label="New Secure Password" 
                  value={passwords.newPassword} 
                  onChange={v => setPasswords({...passwords, newPassword: v})} 
                  placeholder="Minimum 6 characters"
                />

                <PasswordInput 
                  label="Confirm New Password" 
                  value={passwords.confirmPassword} 
                  onChange={v => setPasswords({...passwords, confirmPassword: v})} 
                  placeholder="Repeat new password"
                />
              </div>

              <div className="pt-6">
                <button 
                  disabled={actionLoading} 
                  type="submit" 
                  className="w-full sm:w-auto px-4 h-10 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-xs disabled:opacity-70"
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18}/>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 p-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Security Requirements</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RequirementItem text="At least 8 characters long" />
              <RequirementItem text="Must contain capital letter(A-Z),small letter(a-z), and special characters (@,#,_.etc)"/>
              <RequirementItem text="Must match confirmation field" />
              <RequirementItem text="Cannot be your old password" />
              <RequirementItem text="Required for institutional access" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const PasswordInput = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
      {label}
    </label>
    <input 
      type="password" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="w-full h-14 sm:h-16 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 sm:px-8 font-bold text-slate-700 outline-none transition-all text-sm sm:text-base" 
    />
  </div>
);

const RequirementItem = ({ text }) => (
  <li className="flex items-center gap-2 text-xs font-bold text-slate-500">
    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
    {text}
  </li>
);

export default ChangePasswordStudent;