import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Inbox } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { formatDate } from '../utils/formatDate';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-brand-blue hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-brand-orange rounded-full min-w-[18px]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Notifications
              <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-medium">
                {notifications.length} total
              </span>
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-brand-blue hover:text-blue-700 transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 transition-colors flex gap-3 items-start ${
                    n.isRead ? 'bg-white' : 'bg-blue-50/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n._id)}
                        className="p-1 text-slate-400 hover:text-brand-success hover:bg-slate-100 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="p-1 text-slate-400 hover:text-brand-error hover:bg-slate-100 rounded transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
