import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) return JSON.parse(stored);
    return true; // Default to collapsed
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const handleCollapseChange = (collapsed, visible) => {
    setIsCollapsed(collapsed);
 setIsSidebarVisible(visible);
  };

  return (
    <div className="flex">
      <Sidebar onCollapseChange={handleCollapseChange} />

      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarVisible ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
        } md:ml-${isCollapsed ? '16' : '64'} bg-gray-100 h-screen z-0`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;