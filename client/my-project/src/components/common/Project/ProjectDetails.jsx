import { useState, useEffect } from "react";
import { 
  Layers, 
  Calendar, 
  CheckCircle2,
  Quote
} from "lucide-react";

import Loader from "../../ui/Loader";

import { useAuth } from "../../../context/AuthContext";

import facultyProjectService from "../../../services/Faculty/projectServices";
import projectService from "../../../services/Student/projectServices";

const ProjectDetails = ({ projectId, isFaculty = false}) => {

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        let res = null;
        
        if (isFaculty) {
          res = await facultyProjectService.getProjectById(projectId);
        }
        else {
          res = await projectService.getProjectDetails(projectId);
        }
        setProject(res.data);
      } catch (err) {
        setError(err?.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchDetails();
  }, [projectId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader/>
    </div>
  );

  

  if (!project) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
      
      {/* --- 1. Project Description Box with Domain Label --- */}
      <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 relative overflow-hidden group">
        {/* Domain Label - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
          <Layers size={10} className="text-indigo-600" />
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
            {project.domain}
          </span>
        </div>

        <div className="relative z-10 pt-2">
          <div className="flex items-center gap-2 mb-4">
            <Quote size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Abstract</h4>
          </div>
          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed italic">
            {project.description}
          </p>
        </div>
      </section>

      {/* --- 2. Bottom Two-Column Tiles --- */}
      <div className="grid grid-cols-2 gap-4">
        <DetailTile 
          icon={<Calendar size={18} />} 
          label="Semester" 
          value={`Sem ${project.semester}`} 
          color="text-amber-500" 
        />
        
        <DetailTile 
          icon={<CheckCircle2 size={18} />} 
          label="Current Status" 
          value={project.status} 
          color={project.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'} 
        />
      </div>
    </div>
  );
};

// Compact Tile Component
const DetailTile = ({ icon, label, value, color }) => (
  <div className="bg-white border border-slate-200 p-5 rounded-[1.8rem] flex items-center gap-4 transition-all hover:border-slate-300">
    <div className={`p-3 bg-slate-50 rounded-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
        {label}
      </span>
      <p className="text-xs font-black text-slate-800 uppercase">
        {value}
      </p>
    </div>
  </div>
);

export default ProjectDetails;