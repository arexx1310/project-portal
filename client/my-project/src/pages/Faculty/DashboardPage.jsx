import React from "react";
import { Bell } from "lucide-react";
import Header from "../../components/ui/Header";
import NotificationList from "../../components/common/Notification/Notification"; 
import facultyNotificationService from "../../services/Faculty/notificationService";

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Dashboard" 
          subtitle="Keep track of BTP updates" 
          icon={Bell}
        />

        <div className="mt-8">
          <NotificationList 
            fetchFn={facultyNotificationService.getNotifications} 
            emptyMessage="No academic alerts at the moment."
          />
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;