import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { GraduationCap, Mail, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email });
      toast.success("OTP sent! Check your email.");
      // Pass email to next page via state
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 lg:p-10">

          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to login
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your institutional email and we'll send you an OTP.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="id@university.edu"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;