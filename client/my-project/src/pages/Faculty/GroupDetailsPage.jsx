import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, Info, BookOpen, ArrowLeft } from "lucide-react";

import Header from "../../components/ui/Header";
import Loader from "../../components/ui/Loader";

import GroupDetails from "../../components/common/Group/GroupDetails";
import ProjectTabs from "../Common/ProjectTabs";

import myGroupsService from "../../services/Faculty/groupsService";

import toast from "react-hot-toast";
const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const [isPG,setIsPG] = useState(false);
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await myGroupsService.getGroupDetails(groupId);
        if (response.success) {
          setGroup(response.data);
          setIsPG(response.data.isPG);
          // SET DEFAULT TAB TO LAST TAB
          // Logic: If projects exist, pick the last one, otherwise default to "details"
          if (response.data.projects && response.data.projects.length > 0) {
            const lastProject = response.data.projects[response.data.projects.length - 1];
            setActiveTab(lastProject._id);
          } else {
            setActiveTab("details");
          }
        }
      } catch (error) {
        toast.error(err?.message || "Error fetching group details:");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [groupId]);

  const handleBack = async () => {
      if (isPG) {
          navigate("/faculty/pg/students");
      } else {
          navigate("/faculty/my-groups");
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-10">
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Header 
              title="Project Details"
              subtitle={`Session: `} 
              icon={Layers} 
            />
          
          </div>
          <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-white rounded-3xl border border-slate-100">
            <Loader fullScreen={false} />
          </div>
        </div>
      </div>
    );
  }

  if (!group) return <div className="p-10 text-center font-bold text-slate-500">Group not found.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        
        {/* Responsive Header Container */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <Header 
              title= {`Project Details: ${group.name}`}
              subtitle={`Session: ${group.session?.name || group.session}`} 
              icon={Layers} 
            />
          </div>
          
          <button 
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:text-blue-600 transition-all shadow-sm active:scale-95 w-full sm:w-auto"
          >
            <ArrowLeft size={18} />
            <span className="whitespace-nowrap">Back To List</span>
          </button>
        </div>

        {/* Responsive Tab Navigation */}
        <div className="relative border-b border-slate-200">
          <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex min-w-full sm:min-w-0">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center gap-2 px-4 md:px-6 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "details" 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Info size={16} />Overview
              </button>

              {group.projects?.map((project, index) => (
                <button
                  key={project._id}
                  onClick={() => setActiveTab(project._id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                    activeTab === project._id 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <BookOpen size={16} /> Project {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="mt-2 md:mt-6">
          {activeTab === "details" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupDetails group={group} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProjectTabs projectId={activeTab} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;