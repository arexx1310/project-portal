import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  RefreshCw, 
  Calendar, 
  Building2, 
  GraduationCap, 
  Activity, 
  PlusCircle, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import toast from "react-hot-toast";

// Service Imports
import studentService from "../../services/Admin/studentService";
import sessionService from "../../services/Admin/sessionService";
import facultyService from "../../services/Admin/facultyService";
import Header from '../../components/common/Header';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [studentStats, setStudentStats] = useState(null);
  const [facultyStats, setFacultyStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. First, check for an active session
      const sessionData = await sessionService.getActiveSession();
      const currentSession = sessionData.session || null;
      setActiveSession(currentSession);

      // 2. Only fetch statistics if a session exists
      if (currentSession) {
        await Promise.all([
          fetchFacultyStats(),
          fetchStudentStats(currentSession._id)
        ]);
      } else {
        // If no session, we still fetch Faculty Stats as they are global
        await fetchFacultyStats();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync system data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyStats = async () => {
    try {
      const res = await facultyService.getFacultyStats();
      setFacultyStats(res.data);
    } catch (err) {
      toast.error("Faculty metrics unavailable");
    }
  };

  const fetchStudentStats = async (sessionId) => {
    try {
      const res = await studentService.getStudentStats(sessionId);
      setStudentStats(res.data);
    } catch (err) {
      toast.error("Student metrics unavailable");
    }
  };

  const handleManualRefresh = async () => {
    setStatsLoading(true);
    await fetchInitialData();
    setStatsLoading(false);
    toast.success("System data synchronized");
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Initializing Portal...</p>
      </div>
    );
  }

  // 2. NO SESSION STATE (Onboarding)
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-indigo-900 p-12 text-white relative">
              <div className="relative z-10">
                <ShieldAlert className="w-12 h-12 text-indigo-300 mb-6" />
                <h1 className="text-4xl font-black mb-2">System Setup Required</h1>
                <p className="text-indigo-200 text-lg max-w-md">
                  Welcome to the BTP Portal. To begin, you must establish an active academic session.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-20 -mt-20 opacity-50" />
            </div>
            
            <div className="p-12">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Why do I need a session?</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Sessions act as containers for student batches, project deadlines, and faculty evaluations. Without a session, data cannot be categorized.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Global Faculty</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your {facultyStats?.totalFaculty || 0} registered faculty members are safe. They are global and will automatically sync once a session is live.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate("/admin/sessions/create")}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
              >
                <PlusCircle size={22} />
                Create First Academic Session
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. FULL DASHBOARD STATE (With Data)
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Header 
            title="Admin Console" 
            subtitle="Central Governance & Performance Metrics" 
            icon={Activity}
          />
          <button 
            onClick={handleManualRefresh}
            disabled={statsLoading}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 rounded-2xl transition-all shadow-sm font-bold text-sm"
          >
            <RefreshCw size={18} className={statsLoading ? "animate-spin" : ""} />
            {statsLoading ? "Syncing..." : "Sync Database"}
          </button>
        </div>

        {/* Active Session Highlight */}
        <div className="bg-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Active Academic Period</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight">{activeSession.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-indigo-200 font-medium">
                <span className="flex items-center gap-1"><Calendar size={16}/> AY {activeSession.academicYear}</span>
                <span className="opacity-30">|</span>
                <span>System Secure</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <p className="text-xs font-bold uppercase text-indigo-300 mb-1">Total Active Students</p>
              <p className="text-4xl font-black">{studentStats?.activeStudents || 0}</p>
            </div>
          </div>
          <Calendar size={140} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Faculty Management Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><Building2 size={24}/></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Faculty Registry</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Global Academic Staff</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900">{facultyStats?.totalFaculty || 0}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Members</p>
              </div>
            </div>
            
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 text-left text-[11px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-right">Headcount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {facultyStats?.byDepartment?.map((dept) => (
                    <tr key={dept.department} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-indigo-600">{dept.department}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-tighter">
                          {dept.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Insights Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><GraduationCap size={24}/></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Student Enrollment</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Current Session Batch</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900">{studentStats?.activeStudents || 0}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active</p>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 text-left text-[11px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Program</th>
                    <th className="px-6 py-4 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentStats?.byDepartment?.map((dept) => (
                    <tr key={dept.department} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-emerald-600">{dept.department}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black tracking-tighter">
                          {dept.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
        
        {/* Bottom System Info */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             © 2026 University BTP Management System
           </p>
           
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;