import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Loader2, Building2, Trash2, Edit3, X, Save, Phone,
  Users, AlertCircle, GraduationCap, ChevronLeft, ChevronRight,
  CalendarDays, Mail, User, Hash
} from "lucide-react";
import { toast } from "react-hot-toast";

// Services
import studentService from "../../services/Admin/studentService";
import departmentService from "../../services/Admin/departmentServices";
import sessionService from "../../services/Admin/sessionService";

// Components
import Header from "../../components/ui/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

const PAGE_LIMIT = 20;

const ManageStudentPage = () => {
  // Data States
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  // Filter States
  const [filterSession, setFilterSession] = useState("");
  const [filterDeptConfig, setFilterDeptConfig] = useState(""); 
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  
  // Modal States
  const [editModal, setEditModal] = useState({ open: false, student: null });
  // Note: deleteConfig for single student removed. 
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState({ isOpen: false, deptId: "", deptName: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDeptForDelete, setSelectedDeptForDelete] = useState("");

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial Load
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [deptData, sessionRes] = await Promise.all([
          departmentService.getAllDepartments(),
          sessionService.getSessions()
        ]);
        setDepartments(deptData || []);
        const sessionList = sessionRes.data || [];
        setSessions(sessionList);

        const active = sessionList.find(s => s.isActive);
        if (active) setFilterSession(active._id);
        else if (sessionList.length > 0) setFilterSession(sessionList[0]._id);
      } catch (error) {
        toast.error("Failed to load initialization data");
      }
    };
    initializeData();
  }, []);

  // Fetch Stats based on selected session
  useEffect(() => {
    if (filterSession) fetchStats(filterSession);
  }, [filterSession]);

  const fetchStats = async (sessionId) => {
    try {
      const res = await studentService.getStudentStats(sessionId);
      setStats(res.data);
    } catch { console.error("Stats fetch failed"); }
  };

  const fetchStudents = useCallback(async (page = 1) => {
    if (!filterSession) {
      setLoading(false)
      return;
    }
    try {
      setLoading(true);
      const res = await studentService.getStudentsByFilter(
        filterSession, 
        filterDeptConfig || null, 
        page, 
        PAGE_LIMIT, 
        debouncedSearch
      );
      setStudents(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      toast.error("Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterDeptConfig, filterSession]);

  useEffect(() => { fetchStudents(1); }, [fetchStudents]);

  // Update Logic
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    // Updated payload: name, email, rollNumber, phoneNumber
    const payload = {
      name: editModal.student.user.name,
      email: editModal.student.user.email,
      rollNumber: editModal.student.rollNumber,
      phoneNumber: editModal.student.phoneNumber
    };

    try {
      await studentService.updateStudent(editModal.student._id, payload);
      toast.success("Student updated successfully");
      setEditModal({ open: false, student: null });
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete remains
  const handleBulkDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await studentService.bulkDeleteStudents(bulkDeleteConfig.deptId, filterSession);
      toast.success(`Registry cleared for ${bulkDeleteConfig.deptName}`);
      setBulkDeleteConfig({ isOpen: false, deptId: "", deptName: "" });
      setSelectedDeptForDelete("");
      fetchStudents(1);
      fetchStats(filterSession);
    } catch (err) {
      toast.error(err.message || "Bulk delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const currentSessionName = useMemo(() => {
    return sessions.find(s => s._id === filterSession)?.name || "...";
  }, [sessions, filterSession]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
      <Header
        title="Student Registry"
        subtitle={`Managing students in session ${currentSessionName}`}
        icon={GraduationCap}
      />
        
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="In Session" value={stats?.totalInSession} icon={Users} color="text-blue-600" bgColor="bg-blue-50" description={`Total in ${currentSessionName}`} />
          <StatCard label="Global Registry" value={stats?.totalStudents} icon={GraduationCap} color="text-slate-900" bgColor="bg-slate-100" description="Across all sessions" />
          <StatCard label="Departments" value={stats?.byDepartment?.length} icon={Building2} color="text-purple-600" bgColor="bg-purple-50" description="Units with active enrollment" />
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col md:flex-row gap-4 flex-[2]">
            <div className="bg-slate-100 rounded-[1.5rem] px-4 flex items-center flex-1 focus-within:ring-2 focus-within:ring-blue-500">
              <CalendarDays className="text-slate-400 mr-2" size={16} />
              <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="bg-transparent border-none focus:ring-0 font-black text-slate-700 text-[10px] uppercase w-full h-14 outline-none">
                {sessions.map(s => <option key={s._id} value={s._id}>{s.name} {s.isActive ? '• Active' : ''}</option>)}
              </select>
            </div>

            <div className="bg-slate-100 rounded-[1.5rem] px-4 flex items-center flex-1 focus-within:ring-2 focus-within:ring-blue-500">
              <Building2 className="text-slate-400 mr-2" size={16} />
              <select value={filterDeptConfig} onChange={(e) => setFilterDeptConfig(e.target.value)} className="bg-transparent border-none focus:ring-0 font-black text-slate-700 text-[10px] uppercase w-full h-14 outline-none">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.department}</option>)}
              </select>
            </div>
          </div>

          <div className="relative flex-[1.5]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search by name, email or roll..." className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* Bulk Action UI kept */}
          <div className="flex gap-2 items-center bg-red-50/50 p-1 rounded-[1.5rem] border border-red-100">
            <select
              value={selectedDeptForDelete}
              onChange={(e) => setSelectedDeptForDelete(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-black text-red-500 text-[9px] uppercase px-4 h-12 outline-none min-w-[140px]"
            >
              <option value="">Clear Department</option>
              {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.department}</option>)}
            </select>
            <button
              onClick={() => {
                if(!selectedDeptForDelete) return toast.error("Select a department first");
                const d = departments.find(x => x._id === selectedDeptForDelete);
                setBulkDeleteConfig({ isOpen: true, deptId: d._id, deptName: d.department });
              }}
              className="h-12 w-12 flex items-center justify-center bg-red-600 text-white rounded-[1.2rem] hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-40 text-center">
              <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessing Registry...</p>
            </div>
          ) : students.length >= 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Student Details</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase">Roll Number</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase">Semester</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Department</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                              {s.user?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm">{s.user?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{s.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-mono text-xs font-black text-slate-600">{s.rollNumber}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">SEM {s.semester}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-slate-500 uppercase">{s.department}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditModal({ open: true, student: s })} className="p-2 bg-white shadow-sm border border-slate-100 rounded-xl hover:text-blue-600 text-slate-400 transition-colors">
                              <Edit3 size={16} />
                            </button>
                            {/* Single Trash button removed here */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={(p) => fetchStudents(p)} />
            </>
          ) : (
            <div className="py-32 text-center">
              <AlertCircle size={40} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900">No Student Records</h3>
              <p className="text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Update Profile</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{editModal.student.rollNumber}</p>
              </div>
              <button onClick={() => setEditModal({ open: false, student: null })} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="p-8 space-y-4">
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      value={editModal.student.user.name}
                      onChange={(e) => setEditModal({ ...editModal, student: { ...editModal.student, user: { ...editModal.student.user, name: e.target.value } }})}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      value={editModal.student.user.email}
                      onChange={(e) => setEditModal({ ...editModal, student: { ...editModal.student, user: { ...editModal.student.user, email: e.target.value } }})}
                    />
                  </div>
                </div>

                {/* Roll Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Roll Number</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      value={editModal.student.rollNumber}
                      onChange={(e) => setEditModal({ ...editModal, student: { ...editModal.student, rollNumber: e.target.value }})}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      value={editModal.student.phoneNumber}
                      onChange={(e) => setEditModal({ ...editModal, student: { ...editModal.student, phoneNumber: e.target.value }})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={actionLoading}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                SAVE CHANGES
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Single Confirmation Modal for deleteConfig removed */}

      <ConfirmModal
        isOpen={bulkDeleteConfig.isOpen}
        onClose={() => setBulkDeleteConfig({ ...bulkDeleteConfig, isOpen: false })}
        onConfirm={handleBulkDeleteConfirm}
        title="CRITICAL: Bulk Delete"
        message={`This will permanently delete ALL students in ${bulkDeleteConfig.deptName} for the ${currentSessionName} session. Proceed with caution.`}
        theme="red"
        loading={actionLoading}
      >
        Execute Bulk Delete
      </ConfirmModal>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bgColor, description }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`${bgColor} ${color} w-12 h-12 rounded-2xl flex items-center justify-center`}><Icon size={24} /></div>
      <div className="text-right">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value ?? 0}</p>
      </div>
    </div>
    <p className="text-[9px] font-bold text-slate-400 italic pt-3 border-t border-slate-50">{description}</p>
  </div>
);

const Pagination = ({ pagination, onPageChange }) => (
  <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      Showing Page {pagination.page} of {pagination.pages}
    </p>
    <div className="flex gap-2">
      <button 
        disabled={pagination.page === 1} 
        onClick={() => onPageChange(pagination.page - 1)} 
        className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <ChevronLeft size={18}/>
      </button>
      <button 
        disabled={pagination.page === pagination.pages} 
        onClick={() => onPageChange(pagination.page + 1)} 
        className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <ChevronRight size={18}/>
      </button>
    </div>
  </div>
);

export default ManageStudentPage;