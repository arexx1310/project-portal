import React, { useState, useEffect } from "react";
import notificationService from "../../services/Faculty/notificationService";
import { Bell, Clock, BellRing, Info } from "lucide-react";
import Header from "../../components/common/Header";
import { toast } from "react-hot-toast";

const FacultyDashboard = () => {
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
          subtitle="Stay updated with academic activities" 
          icon={Bell}
        />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-dashed border-slate-200 p-12 md:p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-slate-300 mb-4">
                  <BellRing size={32} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Quiet for now</h3>
                <p className="text-slate-400 font-medium text-xs mt-2">No notifications found</p>
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
    <div className="group relative overflow-hidden bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm p-5 md:p-8">
      <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
        {/* Icon Badge */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <Info size={20} className="md:w-6 md:h-6" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-[10px] md:text-xs font-bold px-2 py-1 rounded-md border text-blue-600 border-blue-100 bg-blue-50">
              {notif.event?.type?.replace(/_/g, ' ') || "Update"}
            </span>
          </div>
          
          <h4 className="text-base md:text-lg leading-tight font-semibold text-slate-900">
            {notif.event?.message}
          </h4>
          
          <div className="flex items-center gap-4 text-slate-400 text-[10px] md:text-xs font-medium">
            <div className="flex items-center gap-1.5 italic">
              <Clock size={12} className="text-blue-500" />
              {new Date(notif.createdAt).toLocaleDateString()}
              <span className="hidden xs:inline"> 
                at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;