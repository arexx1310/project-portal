import React, { useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

const themes = {
  green: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    btnPrimary: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
    ring: "focus:ring-emerald-500/20",
  },
  red: {
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    btnPrimary: "bg-red-600 hover:bg-red-700 shadow-red-100",
    ring: "focus:ring-red-500/20",
  },
  base: {
    icon: AlertCircle,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    btnPrimary: "bg-slate-900 hover:bg-slate-800 shadow-slate-200",
    ring: "focus:ring-slate-500/20",
  }
};

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  theme = "base", 
  children, // This is the Action Button Name
  loading = false 
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { e.key === "Escape" && onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const style = themes[theme] || themes.base;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Close Icon */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Header Icon */}
        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 ${style.iconBg} ${style.iconColor}`}>
          <Icon size={32} />
        </div>

        {/* Content */}
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 order-2 sm:order-1 px-6 py-4 rounded-2xl text-sm font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-[1.5] order-1 sm:order-2 px-6 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 ${style.btnPrimary}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              children
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;