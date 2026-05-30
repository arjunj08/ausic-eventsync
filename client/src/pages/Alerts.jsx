import React, { useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Bell, CheckSquare, Globe, GitMerge, DollarSign, Check, Info } from 'lucide-react';

export default function Alerts() {
  const { 
    notifications, 
    markAllNotificationsAsRead, 
    markNotificationAsRead,
    refreshNotifications 
  } = useContext(SocketContext);

  useEffect(() => {
    refreshNotifications();
  }, []);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="h-5 w-5 text-[#00BFFF]" />;
      case 'event_published':
        return <Globe className="h-5 w-5 text-green-500" />;
      case 'cross_team_request':
        return <GitMerge className="h-5 w-5 text-purple-500" />;
      case 'expense_submitted':
      case 'expense_updated':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotifTitle = (type) => {
    switch (type) {
      case 'task_assigned':
        return 'New Task Assigned';
      case 'event_published':
        return 'Event Published';
      case 'cross_team_request':
        return 'Cross-Team Request';
      case 'expense_submitted':
        return 'Expense Submitted';
      case 'expense_updated':
        return 'Expense Update';
      default:
        return 'Notification Alert';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pb-24 px-6 max-w-4xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">Stay up to date with task assignments and approvals</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 hover:border-gray-700 text-[#00BFFF] font-semibold px-4 py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">All Clear!</h3>
            <p className="text-gray-400 text-sm font-medium">You have no new alerts or notifications at this time.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif._id}
              onClick={() => { if (!notif.read) markNotificationAsRead(notif._id); }}
              className={`bg-[#111111] border border-gray-850 hover:border-gray-800 rounded-2xl p-4 flex items-start justify-between gap-4 transition-all relative ${
                !notif.read ? 'border-l-4 border-l-[#00BFFF] cursor-pointer bg-[#141414]' : 'opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                {/* Icon wrapper */}
                <div className="p-2 bg-black/35 rounded-xl border border-gray-850">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="text-left">
                  <h4 className="font-bold text-white text-sm">{getNotifTitle(notif.type)}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap self-start mt-0.5">
                {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
