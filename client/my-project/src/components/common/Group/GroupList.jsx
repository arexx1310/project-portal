import React from "react";
import { Users, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GroupCard = ({ group, onView }) => {
  // Helper for Status colors
  const getStatusConfig = (status) => {
    const config = {
      active: "bg-green-500/10 text-green-600 border-green-200",
      formed: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      "supervisor requested": "bg-blue-500/10 text-blue-600 border-blue-200",
      closed: "bg-slate-500/10 text-slate-600 border-slate-200",
    };
    return config[status?.toLowerCase()] || config.formed;
  };
  console.log(group?.isPG);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
      {/* Header: Name & Action */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusConfig(group.status)}`}>
            {group.status}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
            {group.name}
          </h3>
        </div>
        <button 
          className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white hover:scale-95 transition-all"
          onClick={() => onView(group._id)} // Correctly passing the _id
        >
          View Details
        </button>
      </div>

      {/* Supervisors Section - Adjusted for Object Array */}
      <div className="mt-6 flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Supervised By</p>
          <p className="text-sm font-bold text-slate-700 truncate">
            {/* Map the names from the supervisors array */}
            {group.supervisors?.length > 0 
              ? group.supervisors.map(s => s.name).join(", ") 
              : "No Supervisor"}
          </p>
        </div>
      </div>

      
      {/* Students Section */}
      {!group.isPG && (
        <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={12} /> {group.students?.length || 0} Members
          </span>
        </div>
        
        <div className="flex flex-col gap-2">
          {group.students?.map((student, idx) => (
            <div key={idx} className="flex items-center gap-3 px-1">
              <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-none">{student.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-1">
                  {student.email} 
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

const GroupList = ({ groupData }) => {
  const navigate = useNavigate();

  if (!groupData || groupData.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-300">
        <p className="text-slate-400 font-bold italic text-lg">No groups found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groupData.map((group) => (
          <GroupCard 
            key={group._id} 
            group={group} 
            onView={(id) => navigate(`/faculty/my-groups/${id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default GroupList;