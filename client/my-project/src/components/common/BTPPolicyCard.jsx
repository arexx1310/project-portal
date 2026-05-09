import React from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  ShieldCheck, 
  Network, 
  Clock 
} from 'lucide-react';

const BTPPolicyCard = ({ data }) => {
  if (!data || !data.btpConfig) return null;

  const { department, btpConfig } = data;

  // Helper to format date
  const formatDate = (dateStr) => 
    new Date(dateStr).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });

  const sections = [
    {
      title: "Team Structure",
      icon: <Users className="text-blue-500" size={18} />,
      bgColor: "bg-blue-50",
      items: [
        { label: "Student Limit", value: `${btpConfig.minStudentsPerGroup} - ${btpConfig.maxStudentsPerGroup} Members` },
        { label: "Supervisors", value: `1 - ${btpConfig.maxSupervisors} per Group` },
      ]
    },
    {
      title: "Supervision",
      icon: <UserCheck className="text-purple-500" size={18} />,
      bgColor: "bg-purple-50",
      items: [
        { label: "Quota", value: `Max ${btpConfig.maxGroupsPerSupervisor} Groups / Faculty` },
        
      ]
    },
    {
      title: "Collaboration",
      icon: <Network className="text-emerald-500" size={18} />,
      bgColor: "bg-emerald-50",
      items: [
        { label: "Cross-Dept", value: btpConfig.crossDepartmentRules.isAllowed ? "Permitted" : "Restricted" },
        { label: "Requirement", value: `Min ${btpConfig.crossDepartmentRules.minSameDepartmentStudents} students and at least one supervisor from this department.` }
      ]
    },
    {
      title: "Deadlines",
      icon: <Clock className="text-orange-500" size={18} />,
      bgColor: "bg-orange-50",
      items: [
        { label: "Group Formation", value: formatDate(btpConfig.lockRecordDeadline) },
        { label: "Project Proposal", value: formatDate(btpConfig.lockRecordDeadline) }
      ]
    }
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <ShieldCheck className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-xs font-black text-indigo-500 uppercase tracking-widest">Official Policy</h2>
            <p className="text-slate-800 font-bold text-lg">{department}</p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className={`${section.bgColor} rounded-2xl p-4 transition-transform hover:scale-[1.02] duration-200`}>
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{section.title}</h4>
            </div>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i}>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.isStatus ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default BTPPolicyCard;