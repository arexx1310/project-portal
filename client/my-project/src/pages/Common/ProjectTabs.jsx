import { useState } from "react";
import { FileText, Clock, GraduationCap } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import ProjectDetails from "../../components/common/Project/ProjectDetails";

import FacultyWorkManager from "../Faculty/PorgressFaculty";
import StudentWorkManager from "../Student/ProgressStudent";
import Publication from "./Publications";

const ProjectTabs = ({ projectId }) => {
  const { user } = useAuth();
  const isFaculty = user.role === "faculty";
  const [activeTab, setActiveTab] = useState("details");

  const tabs = [
    { id: "details", label: "Details", icon: FileText },
    { id: "updates", label: "Weekly Progress", icon: Clock },
    { id: "publication", label: "Publication", icon: GraduationCap },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return <ProjectDetails projectId={projectId} isFaculty={isFaculty} />;
      case "updates":
        if (isFaculty) return <FacultyWorkManager projectId={projectId} />;
        return <StudentWorkManager projectId={projectId} />;
      case "publication":
        return <Publication projectId={projectId} role={user.role}/>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-4">
      {/* --- Responsive Tab Navigation --- */}
      {/* Added horizontal scroll for mobile and better padding on desktops */}
      <div className="w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex flex-nowrap md:flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl md:rounded-[1.5rem] w-max md:w-fit border border-slate-200/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl 
                  text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap
                  transition-all duration-300
                  ${isActive 
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }
                `}
              >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Responsive Tab Content Area --- */}
      <div className="min-h-[300px] md:min-h-[450px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Internal Helper for empty states
const PlaceholderState = ({ icon: Icon, text }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center h-full border-dashed">
    <div className="p-4 md:p-6 bg-slate-50 rounded-full mb-4 text-slate-200">
      <Icon size={32} strokeWidth={1.5} className="md:w-10 md:h-10" />
    </div>
    <p className="text-slate-400 font-black italic uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px] text-center max-w-[200px] md:max-w-none">
      {text}
    </p>
  </div>
);

export default ProjectTabs;