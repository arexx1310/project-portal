import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { KeyRound, Eye, EyeOff, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const [email]                       = useState(location.state?.email || "");
  const [otp, setOtp]                 = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Redirect if someone lands here directly without email
  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post(API_PATHS.AUTH.VERIFY_OTP, {
        email,
        otp,
        newPassword,
      });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 lg:p-10">

          <button
            onClick={() => navigate("/forgot-password")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              OTP sent to <span className="font-medium text-slate-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 px-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="6-digit OTP"
                className="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* New Password Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 px-1">New Password</label>
              <div className="relative mt-1.5">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 chars, A-Z, 0-9, @$!%*?&"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;