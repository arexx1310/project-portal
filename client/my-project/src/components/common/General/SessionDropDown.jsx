import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

const SessionDropdown = ({ data, onSelect, placeholder = "Select Session" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (session) => {
    setSelectedSession(session);
    setIsOpen(false);
    if (onSelect) onSelect(session);
  };

  return (
    <div className="relative w-full max-w-[240px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-2.5 
          bg-white/70 backdrop-blur-md border rounded-xl transition-all duration-200
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 shadow-sm hover:border-slate-300'}
        `}
      >
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar size={18} className="text-blue-500" />
          <span className="text-sm font-semibold truncate">
            {selectedSession ? selectedSession.name : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {data && data.length > 0 ? (
              data.map((session) => (
                <button
                  key={session._id}
                  onClick={() => handleSelect(session)}
                  className={`
                    w-full text-left px-4 py-3 text-sm transition-colors
                    ${selectedSession?._id === session._id 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  {session.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 italic">No sessions found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDropdown;