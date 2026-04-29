import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Loader2, Building2, Trash2, Edit3,
  Users, Award, ShieldCheck, Briefcase, 
  CheckCircle2, Phone, X, AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";

import facultyService from "../../services/Admin/facultyService";
import departmentService from "../../services/Admin/departmentServices";
import Header from "../../components/common/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

const AVAILABLE_ROLES = ["HOD", "BTP_COMMITTEE_HEAD", "BTP_COMMITTEE_MEMBER"];

const ManageFacultyPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");

  // --- Modal States ---
  const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: null, name: "" });
  const [bulkDeleteConfig, setBulkDeleteConfig] = useState({ isOpen: false, deptId: "", deptName: "" });
  const [isBulkDeletePickerOpen, setIsBulkDeletePickerOpen] = useState(false);
  
  // Role Editing States
  const [editRoleModal, setEditRoleModal] = useState({ isOpen: false, faculty: null });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDeptForDelete, setSelectedDeptForDelete] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [facultyRes, statsRes, deptRes] = await Promise.all([
        facultyService.getAllFaculty(),
        facultyService.getFacultyStats(),
        departmentService.getAllDepartments(),
      ]);
      setFacultyList(Array.isArray(facultyRes.data) ? facultyRes.data : []);
      setStats(statsRes.data);
      setDepartments(deptRes || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await facultyService.deleteFaculty(deleteConfig.id);
      toast.success("Access revoked");
      setDeleteConfig({ isOpen: false, id: null, name: "" });
      fetchInitialData();
    } catch (err) { toast.error("Deletion Failed"); }
    finally { setActionLoading(false); }
  };

  const handleOpenBulkConfirm = () => {
    if (!selectedDeptForDelete) return toast.error("Select a department");
    const dept = departments.find(d => d._id === selectedDeptForDelete);
    setBulkDeleteConfig({ 
      isOpen: true, 
      deptId: selectedDeptForDelete, 
      deptName: dept?.department || "Selected Department" 
    });
    setIsBulkDeletePickerOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await facultyService.bulkDeleteByDepartment(bulkDeleteConfig.deptId);
      toast.success("Department records cleared");
      setBulkDeleteConfig({ isOpen: false, deptId: "", deptName: "" });
      setSelectedDeptForDelete("");
      fetchInitialData();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  // Role Update Logic
  const openEditModal = (faculty) => {
    setEditRoleModal({ isOpen: true, faculty });
    setSelectedRoles(faculty.roles || []);
  };

  const toggleRole = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleRoleUpdate = async () => {
    setActionLoading(true);
    try {
      await facultyService.updateFaculty(editRoleModal.faculty._id, { roles: selectedRoles });
      toast.success("Permissions updated");
      setEditRoleModal({ isOpen: false, faculty: null });
      setConfirmRoleChange(false);
      fetchInitialData();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFaculty = useMemo(() => {
    return facultyList.filter((f) => {
      const matchesSearch = !debouncedSearch || f.user?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || f.staffId?.toString().includes(debouncedSearch);
      const matchesDept = filterDept === "All" || f.departmentConfig?.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [facultyList, debouncedSearch, filterDept]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-8xl mx-auto space-y-8">
        <Header title="Faculty Hub" subtitle="Manage academic staff registry" icon={Briefcase} />

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Total Faculty" value={stats?.totalFaculty} icon={Users} color="text-blue-600" bgColor="bg-blue-50" description="Active staff records" />
          <StatCard label="Active Departments" value={stats?.byDepartment?.length} icon={Building2} color="text-purple-600" bgColor="bg-purple-50" description="Departmental units" />
          <StatCard label="Special Roles" value={stats?.withSpecialRoles} icon={Award} color="text-emerald-600" bgColor="bg-emerald-50" description="Admin access granted" />
        </div>

        {/* Global Actions */}
        <div className="flex justify-end">
           <button 
              onClick={() => setIsBulkDeletePickerOpen(true)}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-sm hover:bg-red-50 transition-all active:scale-95"
            >
              <Trash2 size={18} /> Bulk Remove Dept
            </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search name or ID..." className="w-full pl-16 pr-6 h-16 bg-slate-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex-1">
            <FilterDropdown value={filterDept} onChange={setFilterDept} options={[...new Set(facultyList.map(f => f.departmentConfig?.department))].map(d => ({label: d, value: d}))} placeholder="All Departments" showAll />
          </div>
        </div>

        {/* Faculty Table */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          {loading ? (
             <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Database...</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Member</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff ID</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Roles</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFaculty.map((f) => (
                    <tr key={f._id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase">{f.user?.name?.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{f.user?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{f.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-600">{f.staffId}</td>
                      <td className="px-8 py-5"><span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">{f.departmentConfig?.department || "—"}</span></td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {f.roles?.length > 0 ? f.roles.map(r => (
                            <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase tracking-tighter">
                              {r.replace(/_/g, ' ')}
                            </span>
                          )) : <span className="text-[10px] text-slate-300 italic font-bold">Standard</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(f)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit3 size={18} /></button>
                          <button onClick={() => setDeleteConfig({ isOpen: true, id: f._id, name: f.user?.name })} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL: SELECT DEPT FOR BULK DELETE --- */}
      {isBulkDeletePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Purge Department</h3>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Select target to remove all faculty</p>
              </div>
              <button onClick={() => setIsBulkDeletePickerOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Choose Department</label>
                <select 
                  value={selectedDeptForDelete} 
                  onChange={(e) => setSelectedDeptForDelete(e.target.value)} 
                  className="w-full h-16 bg-slate-50 rounded-2xl px-6 font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all"
                >
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.department}</option>)}
                </select>
              </div>
              <button 
                onClick={handleOpenBulkConfirm}
                disabled={!selectedDeptForDelete}
                className="w-full h-16 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl disabled:opacity-30 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                Proceed to Confirm <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MANAGE ROLES --- */}
      {editRoleModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Update Permissions</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{editRoleModal.faculty?.user?.name}</p>
              </div>
              <button onClick={() => setEditRoleModal({ isOpen: false, faculty: null })} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Administrative Privileges</label>
              {AVAILABLE_ROLES.map(role => {
                const isActive = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      isActive ? "border-blue-500 bg-blue-50/50" : "border-slate-100 bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <span className={`text-xs font-black uppercase tracking-wider ${isActive ? "text-blue-700" : "text-slate-600"}`}>
                      {role.replace(/_/g, ' ')}
                    </span>
                    {isActive && <CheckCircle2 size={18} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>
            <div className="p-8 bg-slate-50/80 border-t border-slate-100">
               <button 
                onClick={() => setConfirmRoleChange(true)}
                className="w-full h-14 bg-slate-900 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all"
               >Review Changes <ShieldCheck size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL CONFIRMATION MODALS --- */}
      <ConfirmModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
        onConfirm={handleDelete}
        title="Revoke Access?"
        message={`This will permanently remove ${deleteConfig.name} from the registry.`}
        theme="red"
        loading={actionLoading}
      >Confirm Revoke</ConfirmModal>

      <ConfirmModal
        isOpen={bulkDeleteConfig.isOpen}
        onClose={() => setBulkDeleteConfig({ ...bulkDeleteConfig, isOpen: false })}
        onConfirm={handleBulkDeleteConfirm}
        title="CRITICAL: Bulk Delete"
        message={`Are you absolutely sure? This will delete ALL faculty members in the ${bulkDeleteConfig.deptName} department.`}
        theme="red"
        loading={actionLoading}
      >Yes, Purge All Records</ConfirmModal>

      <ConfirmModal
        isOpen={confirmRoleChange}
        onClose={() => setConfirmRoleChange(false)}
        onConfirm={handleRoleUpdate}
        title="Apply Changes?"
        message="Update the administrative roles for this faculty member?"
        theme="blue"
        loading={actionLoading}
      >Apply Permissions</ConfirmModal>

    </div>
  );
};

// --- Helper Components ---
const StatCard = ({ icon: Icon, label, value, color, bgColor, description }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`${bgColor} ${color} w-10 h-10 rounded-xl flex items-center justify-center`}><Icon size={20} /></div>
      <div className="text-right">
        <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value || 0}</p>
      </div>
    </div>
    <p className="text-[9px] font-bold text-slate-400 italic pt-3 border-t border-slate-50">{description}</p>
  </div>
);

const FilterDropdown = ({ value, onChange, options, placeholder, showAll }) => (
  <div className="bg-slate-50 rounded-[1.5rem] px-4 flex items-center w-full border border-transparent hover:border-slate-200 h-16">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none focus:ring-0 font-black text-slate-600 text-[10px] uppercase w-full outline-none cursor-pointer">
      {showAll && <option value="All">{placeholder}</option>}
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

export default ManageFacultyPage;