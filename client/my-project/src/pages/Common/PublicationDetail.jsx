import { useState, useEffect, useCallback } from "react";
import { 
  Save, MessageSquare, Info, Book, 
  MapPin, Link as LinkIcon, Calendar, 
  CheckCircle2, Loader2, AlertCircle, UserPlus 
} from "lucide-react";
import publicationService from "../../services/Common/publicationService";

const STATUS_OPTIONS = [
  "Idea", "Writing", "InternalReview", "Submitted",
  "UnderReview", "Accepted", "Rejected",
  "Presented", "Published", "Withdrawn",
];

export default function PublicationDetail({ projectId, publicationId, role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [remarkError, setRemarkError] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicationService.getPublication(role, projectId, publicationId);
      const pub = res.data;
      setData(pub);
      setForm(buildForm(pub));
      setDirty({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, projectId, publicationId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  function buildForm(pub) {
    return {
      title: pub.title ?? "",
      abstract: pub.abstract ?? "",
      authors: (pub.authors ?? []).join(", "),
      status: pub.status ?? "Idea",
      conferenceName: pub.conference?.name ?? "",
      conferenceSubmission: pub.conference?.submissionDate ? pub.conference.submissionDate.slice(0, 10) : "",
      conferenceNotification: pub.conference?.notificationDate ? pub.conference.notificationDate.slice(0, 10) : "",
      conferencePresentation: pub.conference?.presentationDate ? pub.conference.presentationDate.slice(0, 10) : "",
      publishedDoi: pub.published?.doi ?? "",
      publishedLink: pub.published?.link ?? "",
      publishedDate: pub.published?.publishedDate ? pub.published.publishedDate.slice(0, 10) : "",
      publishedVenue: pub.published?.venue ?? "",
    };
  }

  function buildPayload() {
    const payload = {};
    if (dirty.title) payload.title = form.title;
    if (dirty.abstract) payload.abstract = form.abstract || null;
    if (dirty.authors) payload.authors = form.authors.split(",").map((a) => a.trim()).filter(Boolean);
    if (dirty.status) payload.status = form.status;

    const confFields = ["conferenceName", "conferenceSubmission", "conferenceNotification", "conferencePresentation"];
    if (confFields.some((f) => dirty[f])) {
      payload.conference = {
        name: form.conferenceName || null,
        submissionDate: form.conferenceSubmission || null,
        notificationDate: form.conferenceNotification || null,
        presentationDate: form.conferencePresentation || null,
      };
    }

    const pubFields = ["publishedDoi", "publishedLink", "publishedDate", "publishedVenue"];
    if (pubFields.some((f) => dirty[f])) {
      payload.published = {
        doi: form.publishedDoi || null,
        link: form.publishedLink || null,
        publishedDate: form.publishedDate || null,
        venue: form.publishedVenue || null,
      };
    }
    return payload;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty((prev) => ({ ...prev, [field]: true }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (Object.keys(dirty).length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildPayload();
      await publicationService.updatePublication(role, projectId, publicationId, payload);
      setDirty({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRemark = async () => {
    const note = remarkText.trim();
    if (!note) return;
    setRemarkLoading(true);
    setRemarkError(null);
    try {
      const res = await publicationService.addRemark(role, projectId, publicationId, { note });
      setData((prev) => ({
        ...prev,
        remarks: [...(prev.remarks ?? []), res.data],
      }));
      setRemarkText("");
    } catch (err) {
      setRemarkError(err.message);
    } finally {
      setRemarkLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
      <Loader/>
    </div>
  );

  if (error) return (
    <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-center gap-3">
      <AlertCircle size={20} /> {error}
    </div>
  );

  const hasDirty = Object.keys(dirty).length > 0;

  return (
   
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-100/40 via-slate-50 to-white selection:bg-pink-100 selection:text-pink-900">
      <div className="max-w-7xl mx-auto p-2 md:p-3 space-y-10 animate-in fade-in duration-700">
        
        {/* OPTIMIZED GLASS HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-30 bg-white/70 backdrop-blur-md py-5 px-8 rounded-3xl border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] will-change-transform">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{form.title || "Untitled Publication"}</h1>
            <p className="text-pink-500 text-xs font-bold uppercase tracking-widest mt-1">Research Publication Management</p>
          </div>
          <div className="flex items-center gap-4">
             {saveSuccess && <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1 animate-pulse"><CheckCircle2 size={16}/> Saved</span>}
             <button 
              onClick={handleSave} 
              disabled={!hasDirty || saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all active:scale-95
                ${!hasDirty ? 'bg-slate-200/50 text-slate-400 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200'}
              `}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            
            {/* CORE SECTION - HARDWARE ACCELERATED */}
            <section className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-sm overflow-hidden transform-gpu">
              <div className="px-8 py-5 border-b border-white/40 flex items-center gap-3 font-black text-slate-600 uppercase text-xs tracking-widest">
                <div className="p-2 bg-pink-500 rounded-lg text-white shadow-sm"><Info size={16} /></div>
                Core Details
              </div>
              <div className="p-8 space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Publication Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-slate-100 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-slate-100 focus:border-indigo-400 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authors</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.authors}
                        onChange={(e) => handleChange("authors", e.target.value)}
                        className="w-full px-5 py-3.5 pl-11 rounded-2xl bg-white/80 border border-slate-100 focus:border-indigo-400 transition-all outline-none"
                      />
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Abstract</label>
                  <textarea
                    rows={4}
                    value={form.abstract}
                    onChange={(e) => handleChange("abstract", e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/80 border border-slate-100 focus:border-pink-400 focus:bg-white transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* SECONDARY GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white p-8 shadow-sm transform-gpu">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-orange-500 rounded-lg text-white shadow-sm"><MapPin size={16} /></div>
                   <h2 className="text-xs font-black uppercase tracking-widest text-slate-600">Conference</h2>
                </div>
                <div className="space-y-5">
                  <GlassField label="Venue Name" value={form.conferenceName} onChange={(v) => handleChange("conferenceName", v)} />
                  <GlassField type="date" label="Submission" value={form.conferenceSubmission} onChange={(v) => handleChange("conferenceSubmission", v)} />
                  <GlassField type="date" label="Notification" value={form.conferenceNotification} onChange={(v) => handleChange("conferenceNotification", v)} />
                  <GlassField type="date" label="Presentation" value={form.conferencePresentation} onChange={(v) => handleChange("conferencePresentation", v)} />
                </div>
              </section>

              <section className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white p-8 shadow-sm transform-gpu">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-sm"><Book size={16} /></div>
                   <h2 className="text-xs font-black uppercase tracking-widest text-slate-600">Published</h2>
                </div>
                <div className="space-y-5">
                  <GlassField label="DOI" value={form.publishedDoi} onChange={(v) => handleChange("publishedDoi", v)} />
                  <GlassField label="Journal/Venue" value={form.publishedVenue} onChange={(v) => handleChange("publishedVenue", v)} />
                  <GlassField type="url" label="Link" value={form.publishedLink} onChange={(v) => handleChange("publishedLink", v)} />
                  <GlassField type="date" label="Date" value={form.publishedDate} onChange={(v) => handleChange("publishedDate", v)} />
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN TIMELINE */}
          <div className="lg:col-span-4">
            <section className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white p-8 shadow-xl lg:sticky lg:top-32 h-fit transform-gpu">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                <MessageSquare size={18} className="text-pink-600" /> Timeline & Remarks
              </h3>
              
              <div className="space-y-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {data.remarks.length === 0 && (
                  <p className="text-slate-400 text-xs italic text-center py-10">No updates yet.</p>
                )}
                {data.remarks.map((r, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-pink-100 pb-2">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-pink-500 shadow-sm" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{r.note}</p>
                    <div className="mt-2 text-[9px] uppercase tracking-tighter font-bold text-pink-400 bg-pink-50 w-fit px-2 py-0.5 rounded">
                      {r.addedBy?.name ?? "User"} • {new Date(r.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <textarea
                  rows={3}
                  placeholder="Share a progress update..."
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all"
                />
                {remarkError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase">{remarkError}</p>}
                <button 
                  onClick={handleAddRemark} 
                  disabled={remarkLoading || !remarkText.trim()}
                  className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all disabled:opacity-30 shadow-lg"
                >
                  {remarkLoading ? "Posting..." : "Post Update"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

const GlassField = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1.5 group">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-indigo-500 transition-colors">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-white/40 focus:bg-white focus:border-indigo-300 transition-all text-sm outline-none"
    />
  </div>
);