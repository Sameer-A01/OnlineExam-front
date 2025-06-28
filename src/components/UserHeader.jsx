import React from 'react';
import { Bell, Plus, Sparkles } from 'lucide-react';

const UserHeader = ({ showNotifications, setShowNotifications, unreadCount, setShowCreateForm }) => {
  return (
    <>
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute top-10 right-1/3 w-24 h-24 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <header className="relative z-10 backdrop-blur-lg bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 border-b border-blue-100/50 shadow-xl sticky top-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/3 via-purple-600/3 to-indigo-600/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-4 sm:py-5">
            
            {/* Title with animated elements */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
              <div className="transform group-hover:translate-x-1 transition-all duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent sm:text-2xl">
                  Discussion Forum
                </h1>
                <div className="h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-full transition-all duration-700"></div>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Notifications with glow effect */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-slate-600 hover:text-white bg-white/70 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 rounded-xl shadow-lg backdrop-blur-sm border border-white/60 transition-all duration-500 transform hover:scale-110 hover:shadow-xl group"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse border-2 border-white min-w-0">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </button>
              </div>
              
              {/* Create Post Button with premium styling */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:from-blue-700 hover:via-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-500 flex items-center space-x-2 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105 group overflow-hidden"
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                <span className="relative z-10 hidden sm:inline">Ask Doubt</span>
                <span className="relative z-10 sm:hidden">Ask</span>
                
                {/* Button glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </button>
              
            </div>
          </div>
        </div>

        {/* Animated bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60"></div>
        
        {/* Moving gradient line */}
        <div className="absolute bottom-0 left-0 h-0.5 w-20 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
      </header>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default UserHeader;