import { useState, useEffect, useCallback } from "react";
import {
  Save,
  MessageSquare,
  Info,
  Book,
  MapPin,
  Loader2,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

import toast from "react-hot-toast";

import publicationService from "../../services/Common/publicationService";
import Loader from "../../components/ui/Loader";

const STATUS_OPTIONS = [
  "Idea",
  "Writing",
  "InternalReview",
  "Submitted",
  "UnderReview",
  "Accepted",
  "Rejected",
  "Presented",
  "Published",
  "Withdrawn",
];

export default function PublicationDetail({
  projectId,
  publicationId,
  role,
}) {
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(null);

  const [dirty, setDirty] = useState({});

  const [saving, setSaving] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [remarkText, setRemarkText] = useState("");

  const [remarkLoading, setRemarkLoading] = useState(false);

  /* ───────────────────────────────────────────── */

  const buildForm = (pub) => {
    return {
      title: pub.title ?? "",

      abstract: pub.abstract ?? "",

      authors: (pub.authors ?? []).join(", "),

      status: pub.status ?? "Idea",

      conferenceName: pub.conference?.name ?? "",

      conferenceSubmission: pub.conference?.submissionDate
        ? pub.conference.submissionDate.slice(0, 10)
        : "",

      conferenceNotification: pub.conference?.notificationDate
        ? pub.conference.notificationDate.slice(0, 10)
        : "",

      conferencePresentation: pub.conference?.presentationDate
        ? pub.conference.presentationDate.slice(0, 10)
        : "",

      publishedDoi: pub.published?.doi ?? "",

      publishedLink: pub.published?.link ?? "",

      publishedDate: pub.published?.publishedDate
        ? pub.published.publishedDate.slice(0, 10)
        : "",

      publishedVenue: pub.published?.venue ?? "",
    };
  };

  /* ───────────────────────────────────────────── */

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);

      const res = await publicationService.getPublication(
        role,
        projectId,
        publicationId
      );

      const pub = res.data;

      setData(pub);

      setForm(buildForm(pub));

      setDirty({});
    } catch (err) {
      toast.error(err?.message || "Failed to fetch publication");
    } finally {
      setLoading(false);
    }
  }, [role, projectId, publicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ───────────────────────────────────────────── */

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setDirty((prev) => ({
      ...prev,
      [field]: true,
    }));

    setSaveSuccess(false);
  };

  /* ───────────────────────────────────────────── */

  const buildPayload = () => {
    const payload = {};

    if (dirty.abstract) {
      payload.abstract = form.abstract || null;
    }

    if (dirty.status) {
      payload.status = form.status;
    }

    const confFields = [
      "conferenceName",
      "conferenceSubmission",
      "conferenceNotification",
      "conferencePresentation",
    ];

    if (confFields.some((f) => dirty[f])) {
      payload.conference = {
        name: form.conferenceName || null,

        submissionDate: form.conferenceSubmission || null,

        notificationDate: form.conferenceNotification || null,

        presentationDate: form.conferencePresentation || null,
      };
    }

    if (dirty.publishedDoi) {
      payload.published = {
        doi: form.publishedDoi || null,
      };
    }

    return payload;
  };

  /* ───────────────────────────────────────────── */

  const handleSave = async () => {
    if (Object.keys(dirty).length === 0) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      await publicationService.updatePublication(
        role,
        projectId,
        publicationId,
        payload
      );

      await fetchDetail();

      toast.success("Publication updated successfully");

      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      toast.error(err?.message || "Failed to update publication");
    } finally {
      setSaving(false);
    }
  };

  /* ───────────────────────────────────────────── */

  const handleAddRemark = async () => {
    const note = remarkText.trim();

    if (!note) return;

    try {
      setRemarkLoading(true);

      const res = await publicationService.addRemark(
        role,
        projectId,
        publicationId,
        { note }
      );

      setData((prev) => ({
        ...prev,
        remarks: [...(prev?.remarks ?? []), res.data],
      }));

      setRemarkText("");

      toast.success("Remark added");
    } catch (err) {
      toast.error(err?.message || "Failed to add remark");
    } finally {
      setRemarkLoading(false);
    }
  };

  /* ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader />
      </div>
    );
  }

  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-100/40 via-slate-50 to-white">

      <div className="max-w-7xl mx-auto p-1 space-y-10">

        {/* HEADER */}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-30 bg-white/70 backdrop-blur-md py-5 px-8 rounded-3xl border border-white shadow-sm">

          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {form.title || "Untitled Publication"}
            </h1>

            <p className="text-pink-500 text-xs font-bold uppercase tracking-widest mt-1">
              Research Publication Management
            </p>
          </div>

          <div className="flex items-center gap-4">

            {saveSuccess && (
              <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1 animate-pulse">
                <CheckCircle2 size={16} />
                Saved
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={!hasDirty || saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all active:scale-95
              ${
                !hasDirty
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200"
              }`}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT */}

          <div className="lg:col-span-8 space-y-8">

            {/* CORE */}

            <section className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-sm overflow-hidden">

              <div className="px-8 py-5 border-b border-white/40 flex items-center gap-3 font-black text-slate-600 uppercase text-xs tracking-widest">
                <div className="p-1 bg-pink-500 rounded-lg text-white shadow-sm">
                  <Info size={16} />
                </div>

                Core Details
              </div>

              <div className="p-8 space-y-6">

                {/* TITLE */}

                <div className="space-y-2">

                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Publication Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    readOnly
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-100 text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>

                {/* STATUS + AUTHORS */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">

                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleChange("status", e.target.value)
                      }
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">

                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Authors
                    </label>

                    <div className="relative">

                      <input
                        type="text"
                        value={form.authors}
                        readOnly
                        className="w-full px-5 py-3.5 pl-11 rounded-2xl bg-slate-100 border border-slate-100 text-slate-500 cursor-not-allowed outline-none"
                      />

                      <UserPlus
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                        size={18}
                      />
                    </div>
                  </div>
                </div>

                {/* ABSTRACT */}

                <div className="space-y-2">

                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Abstract
                  </label>

                  <textarea
                    rows={5}
                    value={form.abstract}
                    onChange={(e) =>
                      handleChange("abstract", e.target.value)
                    }
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-100 outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* CONFERENCE + PUBLISHED */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* CONFERENCE */}

              <section className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white p-8 shadow-sm">

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-500 rounded-lg text-white shadow-sm">
                    <MapPin size={16} />
                  </div>

                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Conference
                  </h2>
                </div>

                <div className="space-y-5">

                  <GlassField
                    label="Venue Name"
                    value={form.conferenceName}
                    onChange={(v) =>
                      handleChange("conferenceName", v)
                    }
                  />

                  <GlassField
                    type="date"
                    label="Submission"
                    value={form.conferenceSubmission}
                    onChange={(v) =>
                      handleChange("conferenceSubmission", v)
                    }
                  />

                  <GlassField
                    type="date"
                    label="Notification"
                    value={form.conferenceNotification}
                    onChange={(v) =>
                      handleChange("conferenceNotification", v)
                    }
                  />

                  <GlassField
                    type="date"
                    label="Presentation"
                    value={form.conferencePresentation}
                    onChange={(v) =>
                      handleChange("conferencePresentation", v)
                    }
                  />
                </div>
              </section>

              {/* PUBLISHED */}

              <section className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white p-8 shadow-sm">

                <div className="flex items-center gap-3 mb-6">

                  <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-sm">
                    <Book size={16} />
                  </div>

                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Published
                  </h2>
                </div>

                <div className="space-y-5">

                  <div>
                    <GlassField
                      label="DOI"
                      value={form.publishedDoi}
                      onChange={(v) =>
                        handleChange("publishedDoi", v)
                      }
                    />

                    <p className="text-[10px] text-slate-400 mt-2">
                      Saving DOI will automatically fetch title,
                      authors, venue, link and publication date.
                    </p>
                  </div>

                  <GlassField
                    label="Journal / Venue"
                    value={form.publishedVenue}
                    readOnly
                  />

                  <GlassField
                    type="url"
                    label="Paper Link"
                    value={form.publishedLink}
                    readOnly
                  />

                  <GlassField
                    type="date"
                    label="Published Date"
                    value={form.publishedDate}
                    readOnly
                  />
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT */}

          <div className="lg:col-span-4">

            <section className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white p-8 shadow-xl lg:sticky lg:top-32 h-fit">

              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                <MessageSquare size={18} className="text-pink-600" />
                Timeline & Remarks
              </h3>

              <div className="space-y-8 max-h-[350px] overflow-y-auto pr-2">

                {(data?.remarks ?? []).length === 0 && (
                  <p className="text-slate-400 text-xs italic text-center py-10">
                    No updates yet.
                  </p>
                )}

                {(data?.remarks ?? []).map((r, i) => (
                  <div
                    key={i}
                    className="relative pl-8 border-l-2 border-pink-100 pb-2"
                  >
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-pink-500 shadow-sm" />

                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {r.note}
                    </p>

                    <div className="mt-2 text-[9px] uppercase tracking-tighter font-bold text-pink-400 bg-pink-50 w-fit px-2 py-0.5 rounded">
                      {r.addedBy?.user?.name ?? "User"} •{" "}
                      {new Date(r.date).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD REMARK */}

              <div className="mt-8 pt-8 border-t border-slate-100">

                <textarea
                  rows={3}
                  placeholder="Share a progress update..."
                  value={remarkText}
                  onChange={(e) =>
                    setRemarkText(e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none"
                />

                <button
                  onClick={handleAddRemark}
                  disabled={
                    remarkLoading || !remarkText.trim()
                  }
                  className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all disabled:opacity-30"
                >
                  {remarkLoading
                    ? "Posting..."
                    : "Post Update"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */

const GlassField = ({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}) => (
  <div className="space-y-1.5">

    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>

    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
      ${
        readOnly
          ? "bg-slate-100 border-slate-100 text-slate-500 cursor-not-allowed"
          : "border-slate-100 bg-white/40 focus:bg-white focus:border-indigo-300"
      }`}
    />
  </div>
);