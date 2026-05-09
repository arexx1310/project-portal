import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Plus, 
  Loader2, 
  Layers, 
  Clock7, 
  Clock8,
  AlertTriangle
} from "lucide-react";

// Services & Components
import sessionService from "../../services/Admin/sessionService";
import Header from "../../components/ui/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

/**
 * Sub-Component: Form Input Field
 */
const FormInputField = ({ label, type = "text", value, onChange, placeholder, hint, icon: Icon, readOnly, min, max }) => (
  <div className="space-y-2">
    <label className="block text-slate-700 text-sm font-bold tracking-tight">{label}</label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`w-full border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold ${Icon ? 'pl-11' : ''} ${readOnly ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`}
      />
    </div>
    {hint && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight px-1">{hint}</p>}
  </div>
);

/**
 * Sub-Component: Section Card
 */
const SectionCard = ({ title, icon: Icon, children, subtitle }) => (
  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
        <Icon size={22} />
      </div>
      <div>
        <h2 className="text-slate-900 font-black text-lg tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-slate-400 text-[10px] font-black mt-1.5 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
    <div className="grid gap-6">{children}</div>
  </div>
);

export default function CreateSessionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initialForm = {
    name: "",
    academicYear: "",
    oddSemester: { startDate: "", endDate: "" },
    evenSemester: { startDate: "", endDate: "" },
  };

  const [form, setForm] = useState(initialForm);

  // Auto-Generate Session Name Logic
  const handleYearChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const year = parseInt(val);
    
    setForm(prev => ({
      ...prev,
      academicYear: val,
      name: year ? `${year}-${year + 1}` : ""
    }));
  };

  const updateSem = (sem, field, value) =>
    setForm((prev) => ({
      ...prev,
      [sem]: { ...prev[sem], [field]: value },
    }));

  // Validation Logic
  const validation = useMemo(() => {
    const { oddSemester: odd, evenSemester: even, academicYear } = form;
    const errors = [];
    const warnings = [];

    const getDiffMonths = (d1, d2) => {
      if (!d1 || !d2) return 0;
      const start = new Date(d1);
      const end = new Date(d2);
      return (end - start) / (1000 * 60 * 60 * 24 * 30.44);
    };

    if (!academicYear || academicYear < 2000 || academicYear > 2100) errors.push("Invalid Year");
    if (!odd.startDate || !odd.endDate || !even.startDate || !even.endDate) errors.push("Missing Dates");

    if (new Date(odd.startDate) >= new Date(odd.endDate)) errors.push("Odd end must be after start");
    if (new Date(odd.endDate) >= new Date(even.startDate)) errors.push("Even sem must start after Odd ends");
    if (new Date(even.startDate) >= new Date(even.endDate)) errors.push("Even end must be after start");

    if (odd.startDate && odd.endDate && getDiffMonths(odd.startDate, odd.endDate) < 2) warnings.push("Odd Sem duration is < 2 months");
    if (even.startDate && even.endDate && getDiffMonths(even.startDate, even.endDate) < 2) warnings.push("Even Sem duration is < 2 months");

    return { isValid: errors.length === 0, errors, warnings };
  }, [form]);

  // Step 1: Pre-submit check to open modal
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validation.isValid) return toast.error(validation.errors[0]);
    setShowConfirm(true);
  };

  // Step 2: Final API Call after confirmation
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        academicYear: parseInt(form.academicYear),
      };

      const res = await sessionService.createSession(payload);
      
      if (res.success) {
        toast.success("Session Created Successfully");
        setForm(initialForm);
        setShowConfirm(false);
        navigate("/admin/managesession");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
        <Header 
          title="Initialize Session" 
          subtitle="New academic cycle setup" 
          showBack={true}
          icon={Plus}
        />

        <form onSubmit={handlePreSubmit} className="space-y-8">
          {/* Session Identity */}
          <SectionCard title="Session Identity" subtitle="Identification & Tracking" icon={Layers}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInputField
                label="Academic Year (Start)"
                type="text"
                value={form.academicYear}
                onChange={handleYearChange}
                placeholder="2026"
                icon={Calendar}
                hint="Format: YYYY (e.g., 2026)"
              />
              <FormInputField
                label="Generated Session Name"
                value={form.name}
                readOnly={true}
                placeholder="Auto-generated"
                hint="Backend required format: YYYY-YYYY"
              />
            </div>
          </SectionCard>

          {/* Semesters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SectionCard title="Odd Semester" subtitle="Phase 01 (Sem 7)" icon={Clock7}>
              <div className="space-y-4">
                <FormInputField
                  label="Commencement"
                  type="date"
                  value={form.oddSemester.startDate}
                  onChange={(e) => updateSem("oddSemester", "startDate", e.target.value)}
                />
                <FormInputField
                  label="Conclusion"
                  type="date"
                  value={form.oddSemester.endDate}
                  onChange={(e) => updateSem("oddSemester", "endDate", e.target.value)}
                />
              </div>
            </SectionCard>

            <SectionCard title="Even Semester" subtitle="Phase 02 (Sem 8)" icon={Clock8}>
              <div className="space-y-4">
                <FormInputField
                  label="Commencement"
                  type="date"
                  value={form.evenSemester.startDate}
                  onChange={(e) => updateSem("evenSemester", "startDate", e.target.value)}
                />
                <FormInputField
                  label="Conclusion"
                  type="date"
                  value={form.evenSemester.endDate}
                  onChange={(e) => updateSem("evenSemester", "endDate", e.target.value)}
                />
              </div>
            </SectionCard>
          </div>

          {/* Validation Feedback */}
          {(validation.warnings.length > 0 || !validation.isValid) && (
            <div className={`flex gap-4 border rounded-[2.5rem] p-8 shadow-sm transition-all ${validation.isValid ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${validation.isValid ? 'bg-white text-amber-600' : 'bg-white text-rose-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className={`font-bold text-sm mb-1 ${validation.isValid ? 'text-amber-900' : 'text-rose-900'}`}>
                  {validation.isValid ? 'Validation Warning' : 'Form Incomplete or Invalid'}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((err, i) => <li key={i} className="text-rose-700 text-xs font-bold uppercase tracking-wider">{err}</li>)}
                  {validation.warnings.map((warn, i) => <li key={i} className="text-amber-700 text-xs font-bold uppercase tracking-wider">{warn}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-black hover:bg-white hover:text-slate-800 hover:border-slate-300 transition-all text-xs uppercase tracking-[0.2em]"
            >
              Cancel Draft
            </button>
            <button
              type="submit"
              disabled={loading || !validation.isValid}
              className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
            >
              <Plus size={18} strokeWidth={3} />
              Create Academic Session
            </button>
          </div>
        </form>
      </div>

      {/* The Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFinalSubmit}
        loading={loading}
        title="Verify Session Details (IMPORTANT)"
        message="Please double-check the dates and academic year. They cannot be updated though it can be deleted."
        theme="green"
      >
        Confirm & Initialize
      </ConfirmModal>
    </div>
  );
}