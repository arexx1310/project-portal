import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  UserCircle,
  KeyRound,
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
// Import your logo here
import nsutLogo from "../../assets/nsut-logo.png"; 

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      toast.error(err?.response?.data?.message || err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Header / Branding - Responsive */}
      <div className="flex flex-col items-center justify-center pt-12 pb-6 px-4 text-center">
        <img 
          src={nsutLogo} 
          alt="College Logo" 
          className="h-20 w-auto mb-4 object-contain sm:h-24 md:h-28"
        />
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Academic Project <span className="text-indigo-600">Management System</span>
        </h1>
        
      </div>

      {/* Main Login Area */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800">Sign In to Portal</h2>
              <p className="text-sm text-slate-500">Please enter your institutional credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 px-1">Email Address</label>
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

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 px-1">Password</label>
                <div className="relative">
                  <KeyRound
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "password" ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
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

          <footer className="mt-auto py-8 text-center text-xs text-slate-400 font-medium">
            © 2026 Academic Project Management System
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;