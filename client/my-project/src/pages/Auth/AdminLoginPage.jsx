import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";  
import { API_PATHS } from "../../utils/apiPaths";       
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, Settings } from "lucide-react";
import { toast } from "react-hot-toast";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.ADMIN_LOGIN, {
        email,
        password,
      });

      await login(data.user);
      toast.success("System Administrator access granted");
      navigate("/admin/dashboard");
    } catch (err) {
      const msg = err.message || "Invalid administrative credentials";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative w-full max-w-[420px]">
        {/* Security Badge */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <div className="relative bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-2xl">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] shadow-2xl p-8 lg:p-10">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Console</h1>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-semibold">
              BTP Governance Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                Admin Identifier
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors ${focusedField === "email" ? "text-indigo-400" : "text-slate-500"}`}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="admin.access@btp.edu"
                  className="w-full h-12 pl-11 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                Security Key
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors ${focusedField === "password" ? "text-indigo-400" : "text-slate-500"}`}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-11 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-[11px] text-red-400 text-center font-medium leading-tight">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Initialize Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-slate-600">
            <Settings className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">System Version 2.4.0-Stable</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-center text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
        >
          Return to Standard Portal
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;