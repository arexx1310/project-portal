import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";   
import { API_PATHS } from "../../utils/apiPaths";          
import {
  GraduationCap,
  UserCircle,
  KeyRound,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Briefcase,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      await login(data.user);
      toast.success(`Welcome, ${data.user.name || "Scholar"}`);

      const routes = {
        student: "/student/dashboard",
        faculty: "/faculty/dashboard",
      };

      navigate(routes[data.user.role] || "/");
    } catch (err) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] bg-[#0f172a] p-12 text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">UniProject Portal</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold leading-tight">
              Official Project <br />
              <span className="text-indigo-400">Management System</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              Streamlining the transition from academic research to professional execution.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Institutional SSO Active</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
          
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
            
                <div className="relative">
                  <UserCircle
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "email" ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="id@university.edu"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 px-1">Password</label>
                <div className="relative">
                  <KeyRound
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "password" ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"} // Dynamic type
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                  />
                  {/* Show/Hide Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-200"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Access Portal
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            © 2026 University BTP Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;