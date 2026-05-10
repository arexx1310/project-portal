import React, { useState } from "react";
import { Bell, Plus } from "lucide-react";
import Header from "../../components/ui/Header";
import NotificationList from "../../components/common/Notification/Notification"; 
import facultyNotificationService from "../../services/Faculty/notificationService";

import CreateNotificationModal from "../../components/common/Notification/CreateNotification";


const FacultyDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Header 
            title="Dashboard" 
            subtitle="Keep track of BTP updates" 
            icon={Bell}
          />
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus size={20} />
            Create Notification
          </button>
        </div>

        <div className="mt-8">
          <NotificationList 
            key={refreshKey} // Used to trigger re-fetch
            fetchFn={facultyNotificationService.getNotifications} 
            emptyMessage="No academic alerts at the moment."
          />
        </div>
      </div>

      <CreateNotificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default FacultyDashboard;