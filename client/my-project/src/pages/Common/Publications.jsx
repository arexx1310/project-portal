import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, BookOpen, ChevronDown, Loader2 } from "lucide-react";
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
            <Plus size={20} />
            <span>Create New Publication</span>
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* CREATE AREA */}
        {creating && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Start a new project
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <input
                autoFocus
                type="text"
                placeholder="Publication Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all text-base" 
              />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={handleCreate} 
                  disabled={createLoading}
                  className="w-full sm:px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {createLoading ? "Saving..." : "Create Publication"}
                </button>
                
                <button 
                  onClick={() => setCreating(false)}
                  className="w-full sm:px-6 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            {createError && (
              <p className="text-red-500 text-xs mt-3 font-medium">
                {createError}
              </p>
            )}
          </div>
        )}

        {/* LIST SECTION */}
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader/>
              <p className="font-medium">Fetching publications...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
              <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">No publications found in this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <section ref={detailRef} className="pt-4 pb-20">
          {selectedId ? (
            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publication Workspace</span>
                <button 
                   onClick={() => setSelectedId(null)}
                   className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold"
                >
                   ✕ CLOSE VIEW
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
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                <ChevronDown className="text-slate-400 animate-bounce mb-2" />
                <p className="text-slate-500 text-sm font-medium">Select a publication to open workspace</p>
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
        group relative p-6 cursor-pointer transition-all duration-300 rounded-2xl border
        ${isSelected 
          ? 'bg-white border-blue-500 shadow-xl shadow-blue-100 ring-4 ring-blue-50' 
          : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-lg hover:bg-white'}
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <span className={`
            text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider mb-3 inline-block
            ${status === 'published' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'}
          `}>
            {status || 'Draft'}
          </span>
          <h3 className={`font-bold text-lg leading-tight transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-700 group-hover:text-blue-700'}`}>
            {title}
          </h3>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className={`text-[10px] font-bold tracking-widest transition-all ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
          {isSelected ? "● ACTIVE WORKSPACE" : "VIEW DETAILS →"}
        </div>
      </div>
    </div>
  );
}

export default Publications;