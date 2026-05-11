import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  ArrowRight, 
  Calendar, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';

import projectService from '../../services/Student/projectServices';
import Header from '../../components/ui/Header';
import Loader from '../../components/ui/Loader';
import ProjectTabs from "../Common/ProjectTabs";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await projectService.getMyProjects();
        if (res.success) {
          setProjects(res.data);
          if (res.data.length > 0) {
            setSelectedProjectId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);


  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <Header 
          title="Project Workspace" 
          subtitle="Manage your academic project cycle" 
          icon={FolderKanban}
        />

        {/* ─── PROJECTS LIST ─── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <Loader fullScreen={false} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {projects.length > 0 ? (
              projects.map((project) => {
                const isSelected = selectedProjectId === project._id;
                
                return (
                  <button 
                    key={project._id}
                    onClick={() => setSelectedProjectId(project._id)}
                    className={`w-full text-left bg-white border rounded-[1.5rem] p-5 shadow-sm transition-all relative overflow-hidden group
                      ${isSelected 
                        ? 'border-blue-500 ring-4 ring-indigo-500/5' 
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors
                        ${isSelected ? 'bg-indigo-50 border-indigo-200 text-blue-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        <Calendar size={10} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Sem {project.semester || 'N/A'}
                        </span>
                      </div>
                      {isSelected && <Sparkles size={14} className="text-blue-400 animate-pulse" />}
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-sm font-black transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-800'}`}>
                        {project.title}
                      </h3>
                      <div className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-blue-400 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-500'}`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              /* EMPTY STATE IF NO PROJECTS EXIST AT ALL */
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[1.5rem] p-10 flex flex-col items-center justify-center bg-slate-50/50">
                <Plus size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-500 mb-4">No projects found</p>
                <button 
                  onClick={() => navigate('/student/project-proposals')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                  Propose New Project
                </button>
              </div>
            )}
          </div>  
        )}

        {/* ─── TAB CONTENT ─── */}
        {selectedProjectId && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <ProjectTabs projectId={selectedProjectId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;