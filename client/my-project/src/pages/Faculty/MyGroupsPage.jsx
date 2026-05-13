import { useState, useEffect, useCallback } from "react";
import { Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/ui/Header";
import SessionDropdown from "../../components/common/General/SessionDropDown";

import groupsService from "../../services/Faculty/groupsService";
import generalServices from "../../services/Faculty/generalService";

// Reusable Components
import GroupList from "../../components/common/Group/GroupList"; 

import toast from "react-hot-toast";
const MyGroupsPage = ({isPG=false}) => {
  const navigate = useNavigate();
  
  // State Management
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Memoized fetch function to handle both initial and session-change calls
  const fetchGroups = useCallback(async (sessionId = null) => {
    setLoading(true);
    try {
      // sessionId will be null on initial load, returning current session groups
      const response = isPG ? 
        await groupsService.getMTechStudents(sessionId) :
        await groupsService.getAllGroups(sessionId);

      if (response.success) {
        
        setGroups(response.data);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch groups:");
    } finally {
      setLoading(false);
    }
  }, [isPG]);

  // 1. Initial Load: Fetch Sessions and Groups (Current Session)
  useEffect(() => {
    const initPage = async () => {
      try {
        // Run both requests in parallel for better performance
        const [sessionRes] = await Promise.all([
          generalServices.getSessions(),
          fetchGroups(null) // Fetch groups with null ID immediately
        ]);

        if (sessionRes.data) {
          setSessions(sessionRes.data);
        }
      } catch (error) {
        toast.error("Initialization failed:");
      }
    };

    initPage();
  }, [fetchGroups]);

  // 2. Subsequent Loads: Fetch whenever selectedSessionId changes manually
  useEffect(() => {
    // Skip the very first run since initPage handles it
    if (selectedSessionId !== null) {
      fetchGroups(selectedSessionId);
    }
  }, [selectedSessionId, fetchGroups]);

  // Handle row click (navigation with ID)
  const handleGroupClick = (groupId) => {
    navigate(`/faculty/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 md:pb-20">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        
        <Header 
          title="Mentor Dashboard" 
          subtitle="Real-time oversight of supervised groups" 
          icon={Layers} 
        />

        {/* Filters Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Academic Session
            </label>
            <SessionDropdown 
              data={sessions} 
              onSelect={(session) => setSelectedSessionId(session._id)} 
              placeholder="Current Session"
            />
          </div>
          
          
        </div>

        {/* Groups Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
             <GroupList 
                groupData={groups} 
             />
        )}
      </div>
    </div>
  );
};

export default MyGroupsPage;