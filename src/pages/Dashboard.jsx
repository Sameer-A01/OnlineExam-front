import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) return JSON.parse(stored);
    return true; // 👈 Default to collapsed
  });

  return (
    <div className="flex">
      <Sidebar onCollapseChange={setIsCollapsed} />

      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        } bg-gray-100 h-screen`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
