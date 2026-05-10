import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Building2, Plus, Loader2, Layers, ListFilter, Pencil, RotateCcw
} from "lucide-react";

// Services & Components
import departmentService from "../../services/Admin/departmentServices";
import Header from "../../components/ui/Header";
import ConfirmModal from "../../components/common/ConfirmModal";

const FormInputField = ({ label, value, onChange, placeholder, icon: Icon }) => (
  <div className="space-y-2">
    <label className="block text-slate-700 text-sm font-bold tracking-tight">{label}</label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold ${Icon ? 'pl-11' : ''}`}
      />
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, subtitle }) => (
  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
        <Icon size={22} />
      </div>
      <div>
        <h2 className="text-slate-900 font-black text-lg tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-slate-400 text-[10px] font-black mt-1.5 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
    <div className="grid gap-6">{children}</div>
  </div>
);

export default function CreateDepartmentPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [existingDepts, setExistingDepts] = useState([]);
  
  const [editId, setEditId] = useState(null);
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setExistingDepts(response);
    } catch (err) {
      toast.error("Could not load existing departments");
    } finally {
      setFetching(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!departmentName.trim()) return toast.error("Department name is required");
    setShowConfirm(true);
  };

  const confirmAction = async () => {
    setLoading(true);
    try {
      const payload = { department: departmentName.trim() };
      let res;
      
      if (editId) {
        res = await departmentService.updateDepartment(editId, payload);
      } else {
        res = await departmentService.createDepartments(payload);
      }

      toast.success(editId ? "Department updated!" : "Department created!");
      setDepartmentName("");
      setEditId(null);
      setShowConfirm(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (dept) => {
    setEditId(dept._id);
    setDepartmentName(dept.department);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setDepartmentName("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header title="Departments" subtitle="Manage Academic Infrastructure" showBack icon={Building2} />
        
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleFormSubmit} className="space-y-8">
              <SectionCard 
                title={editId ? "Update Department" : "Register New"} 
                subtitle={editId ? "Modify existing name" : "Department Entry"} 
                icon={editId ? Pencil : Layers}
              >
                <FormInputField
                  label="Department Full Name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g. COMPUTER SCIENCE AND ENGINEERING"
                  icon={Building2}
                />
              </SectionCard>

              <div className="flex gap-4">
                {editId && (
                  <button type="button" onClick={cancelEdit} className="w-1/3 py-4 rounded-3xl bg-white border border-slate-200 text-slate-500 text-xs font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                    <RotateCcw size={16} /> Cancel
                  </button>
                )}
                <button type="submit" className={`w-full py-4 rounded-3xl text-white text-xs font-black shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${editId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-indigo-600'}`}>
                  {editId ? <Pencil size={18} /> : <Plus size={18} strokeWidth={3} />}
                  {editId ? "Update Department" : "Register Department"}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-100/50 border border-slate-200 rounded-[2.5rem] p-6">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <ListFilter size={18} className="text-slate-400" />
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-tighter">Active Units</h3>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-500 border border-slate-200">
                  {existingDepts.length} TOTAL
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {fetching ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : existingDepts.map((dept) => (
                  <div 
                    key={dept._id} 
                    onClick={() => handleEditClick(dept)}
                    className={`bg-white border p-6 rounded-3xl shadow-sm transition-all group cursor-pointer active:scale-95 ${editId === dept._id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-slate-900 font-bold text-sm leading-tight uppercase tracking-tight">{dept.department}</h4>
                      <Pencil size={14} className={`transition-colors ${editId === dept._id ? 'text-indigo-500' : 'text-slate-300'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmAction}
        loading={loading}
        title={editId ? "Update Department?" : "Initialize Department?"}
        message={editId 
          ? `You are updating "${departmentName}".` 
          : `This will create the "${departmentName}" department.`
        }
        theme={editId ? "indigo" : "green"}
      >
        {editId ? "Confirm Update" : "Confirm Registration"}
      </ConfirmModal>
    </div>
  );
}