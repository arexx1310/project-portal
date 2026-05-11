import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, BookOpen, ChevronDown, Info } from "lucide-react";
import publicationService from "../../services/Common/publicationService";
import PublicationDetail from "./PublicationDetail";
import Loader from "../../components/ui/Loader";

const Publications = ({ projectId, role }) => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const detailRef = useRef(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicationService.listPublications(role, projectId);
      setPublications(res.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, projectId]);

  useEffect(() => {
    if (projectId) fetchList();
  }, [fetchList, projectId]);

  useEffect(() => {
    if (selectedId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setCreateError("Title is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await publicationService.createPublication(role, projectId, { title });
      const created = res.data;
      setPublications((prev) => [created, ...prev]);
      setSelectedId(created._id);
      setNewTitle("");
      setCreating(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (pubId) => {
    if (!window.confirm("Delete this publication?")) return;
    try {
      await publicationService.deletePublication(role, projectId, pubId);
      setPublications((prev) => prev.filter((p) => p._id !== pubId));
      if (selectedId === pubId) setSelectedId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
      
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {!creating && (
          <button 
            onClick={() => setCreating(true)}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 font-medium"
            >
            <Plus size={18} />
            <span>New Publication</span>
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* COMPACT CREATE AREA */}
        {creating && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl animate-in slide-in-from-top-4 duration-300 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                Initialize Record
              </h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Enter working title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all text-sm font-medium" 
              />
              
              <div className="flex gap-2">
                <button 
                  onClick={handleCreate} 
                  disabled={createLoading}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {createLoading ? "Creating..." : "Save Record"}
                </button>
                
                <button 
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* TIP SECTION */}
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
               <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
               <p className="text-[11px] leading-relaxed text-slate-600">
                <span className="font-bold text-blue-700">Pro-tip:</span> You can refine the title later. Once you provide a <strong>DOI Link</strong> in the workspace, we'll automatically fetch and update the official metadata for you.
               </p>
            </div>
            
            {createError && (
              <p className="text-red-500 text-[10px] mt-3 font-bold uppercase tracking-tight">
                Error: {createError}
              </p>
            )}
          </div>
        )}

        {/* LIST SECTION */}
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader/>
              <p className="text-xs font-black uppercase tracking-widest mt-4">Syncing...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
              <BookOpen size={40} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-bold text-sm">No publications indexed in this project yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publications.map((pub) => (
                <PublicationCard
                  key={pub._id}
                  publication={pub}
                  isSelected={selectedId === pub._id}
                  onSelect={() => setSelectedId(pub._id)}
                  onDelete={() => handleDelete(pub._id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* DETAILS SECTION */}
        <section ref={detailRef} className="pt-8 pb-20">
          {selectedId ? (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Workspace</span>
                </div>
                <button 
                   onClick={() => setSelectedId(null)}
                   className="text-slate-400 hover:text-red-500 transition-colors text-[10px] font-black tracking-widest"
                >
                   CLOSE [X]
                </button>
              </div>
              <PublicationDetail
                key={selectedId}
                projectId={projectId}
                publicationId={selectedId}
                role={role}
              />
            </div>
          ) : (
            !loading && publications.length > 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                <ChevronDown className="text-slate-400 animate-bounce mb-2" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Select an entry to begin editing</p>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

const PublicationCard = ({ publication, isSelected, onSelect, onDelete }) => {
  const { title, status } = publication;

  return (
    <div
      onClick={onSelect}
      className={`
        group relative p-5 cursor-pointer transition-all duration-300 rounded-xl border
        ${isSelected 
          ? 'bg-white border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-50' 
          : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-md hover:bg-white'}
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <span className={`
            text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest mb-2 inline-block
            ${status === 'published' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'}
          `}>
            {status || 'Draft'}
          </span>
          <h3 className={`font-bold text-sm leading-snug transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-700 group-hover:text-blue-700'}`}>
            {title}
          </h3>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className={`text-[9px] font-black tracking-widest transition-all ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
          {isSelected ? "● IN VIEW" : "OPEN WORKSPACE →"}
        </div>
      </div>
    </div>
  );
}

export default Publications;