import React, { useState, useEffect } from "react";
import { Clock, BellRing, Info, CheckCircle, Users, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import Loader from "../../ui/Loader";

const getMessageStyles = (message = "") => {
  const msg = message.toLowerCase();
  if (msg.includes("rejected") || msg.includes("failed") || msg.includes("deadline")) {
    return { bg: "bg-rose-50", text: "text-rose-600", icon: <AlertCircle size={18} /> };
  }
  if (msg.includes("accepted") || msg.includes("published") || msg.includes("reviewed") || msg.includes("finalized")) {
    return { bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle size={18} /> };
  }

  if (msg.includes("submitted") || msg.includes("invite") || msg.includes("requested") || msg.includes("received") || msg.includes("proposal")) {
    return { bg: "bg-amber-50", text: "text-amber-600", icon: <Users size={18} /> };
  }
  
  return { bg: "bg-blue-50", text: "text-blue-600", icon: <Info size={18} /> };
};

const NotificationCard = ({ notif }) => {
  const styles = getMessageStyles(notif.message);
  
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Smaller, more balanced Icon container */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.bg} ${styles.text}`}>
          {styles.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top Row: Timestamp */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
              <Clock size={10} />
              {new Date(notif.createdAt).toLocaleDateString("en-IN")} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Large Uppercase Message */}
          <h4 className="text-base md:text-lg font-black text-slate-900 leading-tight uppercase tracking-tight mt-1">
            {notif.message}
          </h4>

          {/* Action Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            {notif.triggeredBy && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                  {notif.triggeredBy.name?.charAt(0)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  ACTION BY <span className="text-slate-800 font-bold uppercase">{notif.triggeredBy.name}</span>
                </span>
              </div>
            )}

            {/* Links rendered as clean outlines */}
            {notif.links && notif.links.length > 0 && (
              <div className="flex gap-2">
                {notif.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold transition-all uppercase"
                  >
                    {link.label}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
          </div>
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
      <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mb-3 shadow-sm">
          <BellRing size={24} />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Quiet for now</h3>
        <p className="text-slate-400 font-medium text-[10px] mt-1 uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {notifications.map((notif, index) => (
        <NotificationCard key={notif._id || index} notif={notif} />
      ))}
    </div>
  );
};

export default NotificationList;