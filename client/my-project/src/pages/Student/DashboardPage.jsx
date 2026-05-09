import React from "react";
import { Bell } from "lucide-react";
import Header from "../../components/ui/Header";
import NotificationList from "../../components/common/Notification/Notification";
import studentNotificationService from "../../services/Student/notificationService";

import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <Header 
          title="Notifications" 
          subtitle="Updates on your groups and project proposals" 
          icon={Bell}
        />

        <div className="mt-4">
          {/* Passing the specific service method as a prop */}
          <NotificationList 
            fetchFn={studentNotificationService.getNotifications} 
            emptyMessage="Check back later for group updates"
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;