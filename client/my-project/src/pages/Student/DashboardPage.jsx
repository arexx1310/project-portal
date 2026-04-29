import React, { useState, useEffect } from "react";
import notificationService from "../../services/Student/notificationService";
import { Bell, Clock, BellRing, Info } from "lucide-react";
import Header from "../../components/common/Header";
import { toast } from "react-hot-toast";

const StudentDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications();
        setNotifications(res.data);
      } catch (err) {
        toast.error("Could not sync notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-5">
      <div className="max-w-8xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
        <Header 
          title="Notifications" 
          subtitle="Stay updated with your academic activities" 
          icon={Bell}
        />

        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-4">
                  <BellRing size={40} />
                </div>
                {/* Fixed: Removed uppercase and font-black */}
                <h3 className="text-xl font-bold text-slate-900">
                  Quiet for now
                </h3>
                {/* Fixed: Removed uppercase */}
                <p className="text-slate-400 font-medium text-xs mt-2">
                  No notifications found
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationCard key={notif._id} notif={notif} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCard = ({ notif }) => {
  return (
    <div className="group relative overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Info size={24} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Badge - Fixed: Added capitalize, removed uppercase and font-black */}
              <span className="text-xs font-bold px-3 py-1 rounded-lg border text-blue-600 border-blue-100 bg-blue-50 capitalize">
                {notif.event?.type?.replace(/_/g, ' ') || "Update"}
              </span>
            </div>
            
            {/* Message - Fixed: Removed font-black, uppercase, and tracking */}
            <h4 className="text-lg leading-tight font-semibold text-slate-900">
              {notif.event?.message}
            </h4>
            
            {/* Timestamp - Fixed: Removed uppercase and tracking */}
            <div className="flex items-center gap-4 text-slate-400 text-xs font-medium italic">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-500" />
                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;