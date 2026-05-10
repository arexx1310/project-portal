import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, FileText, ExternalLink, X, Lock, AlertTriangle
} from "lucide-react";
import projectServices from "../../services/Student/projectServices";
import Loader from "../../components/ui/Loader";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────
   MAIN DOCUMENTS PAGE
───────────────────────────────────────────────────────────── */
const Documents = ({ projectId, isStudent = true }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({ label: "Project Report", customLabel: "", file: null });
  const [uploadError, setUploadError] = useState(null);

  const labelOptions = [
    "Project Report",
    "Published Paper",
    "Presentation",
    "Plagiarism Report",
    "Certificates",
    "Other",
  ];

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectServices.getDocuments(projectId);
      setDocuments(res.data ?? []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchDocs();
  }, [fetchDocs, projectId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isStudent) return;
    if (!uploadData.file) return setUploadError("Please select a file");

    const finalLabel = uploadData.label === "Other" ? uploadData.customLabel : uploadData.label;
    if (!finalLabel?.trim()) return setUploadError("Label is required");

    const formData = new FormData();
    formData.append("document", uploadData.file);
    formData.append("label", finalLabel);

    setUploading(true);
    setUploadError(null);
    try {
      await projectServices.uploadDocument(projectId, formData);
      setShowUploadForm(false);
      setUploadData({ label: "Project Report", customLabel: "", file: null });
      toast.success("Document uploaded successfully");
      fetchDocs();
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!isStudent) return;
    if (!window.confirm("Delete this document permanently?")) return;
    try {
      await projectServices.deleteDocument(projectId, docId);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      toast.success("Document deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
      
      {/* HEADER SECTION */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* 
              By placing the button here directly (or after the 'Read Only' tag), 
              it mirrors the "Create New Publication" button's positioning.
          */}
          {isStudent && !showUploadForm ? (
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 font-medium"
            >
              <Plus size={20} />
              <span>Upload Document</span>
            </button>
          ) : (
            /* This empty div ensures that if there's no button, the layout doesn't collapse, 
              matching the logic where the button is the primary lead element. */
            <div />
          )}

          {!isStudent && (
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Lock size={12} /> READ-ONLY VIEW
            </p>
          )}
        </div>

      <div className="max-w-6xl mx-auto">

        {/* UPLOAD FORM AREA (Matching "Create Area" from Publications) */}
        {isStudent && showUploadForm && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Upload New Document
              </h3>
              <button onClick={() => setShowUploadForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 ml-1">Label Type</label>
                  <select
                    value={uploadData.label}
                    onChange={(e) => setUploadData({ ...uploadData, label: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm"
                  >
                    {labelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {uploadData.label === "Other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Custom Label</label>
                    <input
                      type="text"
                      placeholder="Enter label name..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm"
                      value={uploadData.customLabel}
                      onChange={(e) => setUploadData({ ...uploadData, customLabel: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 ml-1">File (PDF only)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-all border border-slate-200 p-1 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-6 py-3 text-slate-500 font-semibold rounded-xl hover:bg-slate-100 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-200 text-sm"
                >
                  {uploading ? "Uploading..." : "Start Upload"}
                </button>
              </div>
            </form>

            {uploadError && (
              <p className="text-red-500 text-xs mt-3 font-medium flex items-center gap-1.5">
                <AlertTriangle size={12} /> {uploadError}
              </p>
            )}
          </div>
        )}

        {/* LIST SECTION */}
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader />
              <p className="font-medium mt-4">Fetching documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">No documents yet.</p>
              {isStudent && (
                <p className="text-slate-400 text-sm mt-1">Upload your first document to get started.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  doc={doc}
                  isStudent={isStudent}
                  onDelete={() => handleDelete(doc._id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DOCUMENT CARD (Matching PublicationCard Style)
───────────────────────────────────────────────────────────── */
const DocumentCard = ({ doc, isStudent, onDelete }) => {
  return (
    <div className="group bg-white/80 p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:bg-white transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
            <FileText size={24} />
          </div>
          {isStudent && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Delete document"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <span className="text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider mb-2 inline-block bg-blue-50 text-blue-600 border border-blue-100">
          PDF Document
        </span>
        
        <h3 className="font-bold text-slate-700 text-lg leading-tight group-hover:text-blue-700 transition-colors truncate" title={doc.label}>
          {doc.label}
        </h3>
      </div>

      <div className="mt-6">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-100"
        >
          <ExternalLink size={14} />
          Open Document
        </a>
      </div>
    </div>
  );
};

export default Documents;