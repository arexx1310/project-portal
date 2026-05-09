import React, { useState, useEffect } from "react";
import { Clock, BellRing, Info, CheckCircle, Users, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import Loader from "../../ui/Loader";

// Helper to get dynamic styles based on notification type
const getStatusStyles = (type) => {
  const t = type?.toUpperCase();
  if (t?.includes("ACCEPTED") || t?.includes("FORMED") || t?.includes("SUCCESS")) {
    return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", icon: <CheckCircle size={24} /> };
  }
  if (t?.includes("REJECTED") || t?.includes("DEADLINE")) {
    return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", icon: <AlertCircle size={24} /> };
  }
  if (t?.includes("INVITE") || t?.includes("PROPOSAL")) {
    return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", icon: <Users size={24} /> };
  }
  return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", icon: <Info size={24} /> };
};

const NotificationCard = ({ notif }) => {
  const styles = getStatusStyles(notif.type);
  
  return (
    <div className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 transition-all hover:shadow-md hover:border-blue-100">
      <div className="flex gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${styles.bg} ${styles.text}`}>
          {styles.icon}
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider ${styles.bg} ${styles.text} ${styles.border}`}>
              {notif.type?.replace(/_/g, " ")}
            </span>
            
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium italic">
              <Clock size={12} className="text-slate-300" />
              {new Date(notif.createdAt).toLocaleDateString("en-IN")} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <h4 className="text-base md:text-lg leading-snug font-semibold text-slate-900">
            {notif.message}
          </h4>

          {notif.triggeredBy && (
            <div className="pt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {notif.triggeredBy.name?.charAt(0)}
              </div>
              <span className="text-xs text-slate-500">
                Action by <span className="font-semibold text-slate-700">{notif.triggeredBy.name}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationList = ({ fetchFn, emptyMessage = "No notifications found" }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchFn();
        setNotifications(res.data || []);
      } catch (err) {
        toast.error("Failed to sync notifications");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchFn]);

  if (loading) return <div className="py-20"><Loader fullScreen={false}/></div>;

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
          <BellRing size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Quiet for now</h3>
        <p className="text-slate-400 font-medium text-xs mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {notifications.map((notif, index) => (
        <NotificationCard key={notif._id || index} notif={notif} />
      ))}
    </div>
  );
};

export default NotificationList;