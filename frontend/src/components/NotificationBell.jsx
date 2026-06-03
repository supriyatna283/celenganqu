import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: poll every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Gagal menandai notifikasi.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      toast.error('Gagal menandai semua notifikasi.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white font-outfit">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Tidak ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 cursor-pointer transition-colors ${
                    !notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${!notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                      {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
