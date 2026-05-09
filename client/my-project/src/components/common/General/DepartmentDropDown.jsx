import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DepartmentDropdown = ({ departments = [], onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Find currently selected department label
  const selectedDept = departments.find(d => d._id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDepts = departments.filter(dept =>
    dept.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
        Select Department
      </label>
      
      {/* ─── TRIGGER BUTTON ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 bg-white shadow-sm ${
          isOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Layers size={18} className={selectedDept ? "text-indigo-600" : "text-slate-400"} />
          <span className={`text-sm font-bold truncate ${selectedDept ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedDept ? selectedDept.department : "Choose a department..."}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* ─── DROPDOWN MENU ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden shadow-slate-200/50"
          >
            {/* Search Input inside dropdown */}
            <div className="p-3 border-b border-slate-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredDepts.length > 0 ? (
                filteredDepts.map((dept) => (
                  <button
                    key={dept._id}
                    type="button"
                    onClick={() => {
                      onSelect(dept._id);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50 group ${
                      selectedId === dept._id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <span className={`text-xs font-black uppercase tracking-tight leading-tight ${
                      selectedId === dept._id ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'
                    }`}>
                      {dept.department}
                    </span>
                    {selectedId === dept._id && (
                      <Check size={16} className="text-indigo-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-slate-400">No departments found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentDropdown;