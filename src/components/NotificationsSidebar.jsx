import React from 'react';
import { X, Check, Bell, Clock, MessageCircle, AlertCircle, CheckCircle2, Dot, CheckCheck } from 'lucide-react';

const NotificationsSidebar = ({ 
  showNotifications, 
  setShowNotifications,
  notifications,
  setSelectedDoubt,
  generateNotificationMessage,
  markNotificationRead,
  markAllNotificationsRead, // New prop for marking all as read
  handleViewDoubt // Add new prop
}) => {
  const getNotificationIcon = (notification) => {
    // Determine icon based on notification type or content
    if (notification.type === 'doubt_answered') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (notification.type === 'new_comment') {
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    } else if (notification.type === 'system') {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    } else {
      return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (markAllNotificationsRead && unreadCount > 0) {
      await markAllNotificationsRead();
    }
  };

  if (!showNotifications) return null;

  return (
    <div className="lg:w-80 fixed lg:relative right-0 top-0 h-full lg:h-auto z-50 lg:z-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-none lg:rounded-2xl shadow-2xl lg:shadow-xl border border-gray-100 sticky top-6 h-full lg:h-auto overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
            
            {/* Mark all as read button and unread count */}
            <div className="flex items-center justify-between mt-3">
              {unreadCount > 0 && (
                <p className="text-blue-100 text-sm">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-180px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">When you get notifications, they'll show up here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 ${
                    !notification.isRead 
                      ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="p-4 flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        {getNotificationIcon(notification)}
                      </div>
                    </div>

                    {/* Content */}
                  <div 
  className="flex-1 min-w-0 cursor-pointer"
  onClick={async () => {
    if (notification.doubt) {
      // Call a prop function to handle doubt selection
      await handleViewDoubt(notification.doubt);
      setShowNotifications(false);
    }
  }}
>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm leading-relaxed ${
                            !notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          }`}>
                            {generateNotificationMessage(notification)}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 font-medium">
                              {formatTimeAgo(new Date(notification.createdAt))}
                            </p>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="flex-shrink-0 ml-2">
                            <Dot className="w-6 h-6 text-blue-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mark as read button */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(notification._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 text-gray-400 hover:text-white hover:bg-green-500 rounded-full hover:scale-110 transform"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button className="w-full text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 py-2 rounded-lg hover:bg-white">
             Scroll to View All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsSidebar;