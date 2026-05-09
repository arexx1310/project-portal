import React, { useState, useMemo } from 'react';
import { UserCheck, Search, Users, ShieldCheck, Info } from 'lucide-react';

const SupervisorGrid = ({ data, onSelect, selectedId }) => {
  const [search, setSearch] = useState("");

  // Sort alphabetically and filter by search
  const sortedSupervisors = useMemo(() => {
    if (!data?.availableSupervisors) return [];
    
    return [...data.availableSupervisors]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER & STATS ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck size={18} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Faculty Assignment</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Available Supervisors</h2>
          
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Find by name..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedSupervisors.map((prof) => {
          const isSelected = selectedId === prof._id;
          const isFull = prof.availableSlots === 0;
          const filledPercentage = (prof.activeGroupCount / data.maxGroupsPerSupervisor) * 100;

          return (
            <button
              key={prof._id}
              disabled={isFull}
              onClick={() => onSelect(prof._id)}
              className={`relative flex flex-col p-5 rounded-[2rem] border transition-all duration-300 text-left group
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600 ring-offset-2' 
                  : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50'
                }
                ${isFull ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
              `}
            >
              {/* Profile Initial */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm mb-4 transition-colors
                ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white group-hover:bg-indigo-600'}
              `}>
                {prof.name.charAt(0)}
              </div>

              <div className="flex-1">
                <h3 className={`text-sm font-black leading-tight uppercase tracking-tight mb-1
                  ${isSelected ? 'text-indigo-900' : 'text-slate-800'}
                `}>
                  {prof.name}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Users size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-400'} />
                  <span className="text-[10px] font-bold text-slate-500">
                    {prof.availableSlots} Slots Left
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className={isSelected ? 'text-indigo-400' : 'text-slate-400'}>Capacity</span>
                    <span className={isSelected ? 'text-indigo-600' : 'text-slate-600'}>
                      {prof.activeGroupCount}/{data.maxGroupsPerSupervisor}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-900'}`}
                      style={{ width: `${filledPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Selected Marker */}
              {isSelected && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-lg">
                  <UserCheck size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedSupervisors.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <Info className="mx-auto text-slate-300 mb-4" size={40} />
          <p className="text-slate-500 font-bold tracking-tight">No professors matching available</p>
        </div>
      )}
    </div>
  );
};

export default SupervisorGrid;