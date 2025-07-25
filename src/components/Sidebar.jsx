import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaPenFancy, FaMedal, FaUserGraduate, FaBookOpen,
  FaChalkboardTeacher, FaBullhorn, FaComments, FaUserCircle, FaSignOutAlt,
  FaCog, FaClipboardCheck, FaChartBar, FaUserTie, FaBook, FaBars, FaStar
} from 'react-icons/fa';

const Sidebar = ({ onCollapseChange }) => {
  const starSound = new Audio('/star-sound.mp3'); // ✅ Sound file

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FaTachometerAlt />, isParent: true },
    { name: 'Exam', path: '/admin-dashboard/exam', icon: <FaPenFancy />, isParent: false },
    { name: 'Students', path: '/admin-dashboard/users', icon: <FaUserGraduate />, isParent: false },
    { name: 'Courses', path: '/admin-dashboard/Courses', icon: <FaBookOpen />, isParent: false },
    { name: 'Instructors', path: '/admin-dashboard/Instructors', icon: <FaChalkboardTeacher />, isParent: false },
    { name: 'Notice', path: '/admin-dashboard/Notice', icon: <FaBullhorn />, isParent: false },
    { name: 'Discussion Forums', path: '/admin-dashboard/Discussion', icon: <FaComments />, isParent: false },
    { name: 'Profile', path: '/admin-dashboard/profile', icon: <FaUserCircle />, isParent: true },
    { name: 'Logout', path: '/logout', icon: <FaSignOutAlt />, isParent: true }
  ];

  const userMenuItems = [
    { name: 'Dashboard', path: '/employee-dashboard/UserDashboard', icon: <FaTachometerAlt />, isParent: false },
    { name: 'My Exams', path: '/employee-dashboard/MyExams', icon: <FaClipboardCheck />, isParent: false },
    { name: 'My Result', path: '/employee-dashboard/MyResult', icon: <FaChartBar />, isParent: false },
    { name: 'Courses', path: '/employee-dashboard/MyCourses', icon: <FaBook />, isParent: false },
    { name: 'Instructors', path: '/employee-dashboard/MyInstructors', icon: <FaUserTie />, isParent: false },
    { name: 'Discussions', path: '/employee-dashboard/Discussions', icon: <FaComments />, isParent: false },
    { name: 'Notice', path: '/employee-dashboard/MyNotice', icon: <FaBullhorn />, isParent: false },
    { name: 'Profile', path: '/employee-dashboard/profile', icon: <FaUserCircle />, isParent: false },
    { name: 'Logout', path: '/logout', icon: <FaSignOutAlt />, isParent: true }
  ];

  const [itemsToRender, setItemsToRender] = useState(userMenuItems);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [stars, setStars] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('ims_user'));
    if (user && user.role === 'admin') {
      setItemsToRender(menuItems);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    if (onCollapseChange) onCollapseChange(collapsed, isSidebarVisible);
  }, [collapsed, isSidebarVisible]);

  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  const createStar = (id) => ({
    id,
    x: Math.random() * (collapsed ? 60 : 240),
    y: -20,
    size: Math.random() * 12 + 8,
    speed: Math.random() * 4 + 2,
    opacity: Math.random() * 0.4 + 0.6,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 4 + 2,
    color: ['#ffd700', '#ffeb3b', '#fff176', '#f9a825', '#ff9800', '#ffc107'][Math.floor(Math.random() * 6)]
  });

  const triggerStarAnimation = () => {
    if (isAnimating) return;

    starSound.currentTime = 0;
    starSound.play(); // ✅ Play sound

    setIsAnimating(true);

    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        const star = createStar(Date.now() + i);
        setStars(prevStars => [...prevStars, star]);
      }, i * 100);
    }

    setTimeout(() => {
      setStars([]);
      setIsAnimating(false);
    }, 5000);
  };

  useEffect(() => {
    if (stars.length === 0) return;

    const animateStars = () => {
      setStars(prevStars =>
        prevStars.map(star => ({
          ...star,
          y: star.y + star.speed,
          rotation: star.rotation + star.rotationSpeed,
          opacity: star.y > 800 ? Math.max(0, star.opacity - 0.02) : star.opacity
        })).filter(star => star.y < 900 && star.opacity > 0)
      );
    };

    const interval = setInterval(animateStars, 16);
    return () => clearInterval(interval);
  }, [stars]);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`md:hidden fixed top-4 z-[1001] p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none transition-colors ${
          isSidebarVisible ? (collapsed ? 'left-[4.5rem]' : 'left-[17rem]') : 'left-4'
        }`}
      >
        <FaBars className="text-lg" />
      </button>

      <div
        className={`fixed h-screen bg-[#1e293b] text-white transition-all duration-300 shadow-xl overflow-hidden
          ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${collapsed ? 'w-16' : 'w-64'} flex flex-col z-[1000]`}
      >
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute pointer-events-none z-10"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              transform: `rotate(${star.rotation}deg)`,
              transition: 'opacity 0.3s ease-out'
            }}
          >
            <FaStar
              style={{
                fontSize: `${star.size}px`,
                color: star.color,
                opacity: star.opacity,
                filter: `drop-shadow(0 0 8px ${star.color}) drop-shadow(0 0 16px ${star.color}40)`
              }}
            />
          </div>
        ))}

        <div className="h-16 flex items-center justify-center px-2 border-b border-slate-700 relative z-20">
          {!collapsed && (
            <span className="text-xl font-extrabold tracking-wide flex-1">
              Lakshya Classes
            </span>
          )}

          {collapsed && (
            <span className="text-xl font-extrabold tracking-wide">LC</span>
          )}

          <div className={`flex items-center ${collapsed ? 'space-x-1' : 'space-x-2'} ${collapsed ? 'absolute right-2' : ''}`}>
            {!collapsed && (
              <button
                onClick={triggerStarAnimation}
                disabled={isAnimating}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  isAnimating
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-yellow-500/50'
                }`}
                title="Trigger Falling Stars Animation"
              >
                <FaStar className={`text-sm ${isAnimating ? 'animate-spin' : 'animate-pulse'}`} />
              </button>
            )}
            <button
              onClick={toggleCollapse}
              className="text-white p-2 rounded hover:bg-slate-700 focus:outline-none hover:text-yellow-300 transition-colors"
            >
              <FaBars className="text-base" />
            </button>
          </div>
        </div>

        {collapsed && (
          <div className="px-2 py-2 border-b border-slate-700 flex justify-center">
            <button
              onClick={triggerStarAnimation}
              disabled={isAnimating}
              className={`p-2 rounded-full transition-all duration-300 ${
                isAnimating
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-yellow-500/50'
              }`}
              title="Trigger Falling Stars Animation"
            >
              <FaStar className={`text-sm ${isAnimating ? 'animate-spin' : 'animate-pulse'}`} />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
          <ul className="space-y-2 p-3">
            {itemsToRender.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  end={item.isParent}
                  onClick={() => setIsSidebarVisible(false)}
                  className={({ isActive }) =>
                    `group flex items-center p-3 rounded-lg text-sm font-medium tracking-wide transition duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && (
                    <span className="ml-4 group-hover:scale-[1.03] transition">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 text-xs text-center text-gray-400 border-t border-slate-700 relative z-20">
          {!collapsed && <span>© {new Date().getFullYear()} Lakshya</span>}
        </div>

        <style jsx>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #475569 #1e293b;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1e293b;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #475569;
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #64748b;
          }
        `}</style>
      </div>
    </>
  );
};

export default Sidebar;