import React from "react";
import {
  CalendarCheck,
  GraduationCap,
  Settings,
  Users,
  X,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import Link from "next/link"; // Added missing import

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onMenuToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onMenuToggle,
}) => (
  <aside
    className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 flex flex-col transition-transform transform ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    } md:relative md:translate-x-0 md:flex z-40 dark:bg-gray-900`}
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-gray-100">College Admin</h2>
      <button
        className="md:hidden text-gray-400 hover:text-white"
        onClick={onMenuToggle}
      >
        <X size={24} />
      </button>
    </div>
    <nav className="flex-grow">
      <ul>
        <li
          className={`mb-3 ${
            activeTab === "attendance" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("attendance")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <CalendarCheck size={20} /> Attendance
          </button>
        </li>
        <li
          className={`mb-3 ${
            activeTab === "teachers" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("teachers")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <Users size={20} /> Teachers
          </button>
        </li>
        {/* New Assign Teachers option */}
        <li
          className={`mb-3 ${
            activeTab === "assign-teachers" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("assign-teachers")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <UserPlus size={20} /> Assign Teachers
          </button>
        </li>
        <li
          className={`mb-3 ${
            activeTab === "students" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("students")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <GraduationCap size={20} /> Students
          </button>
        </li>

        <li
          className={`mb-3 ${
            activeTab === "sessions" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("sessions")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <CalendarDays size={20} /> Session Management
          </button>
        </li>

        <li
          className={`mb-3 ${
            activeTab === "settings" ? "bg-gray-700 rounded" : ""
          } dark:hover:bg-gray-700`}
        >
          <button
            onClick={() => onTabChange("settings")}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded text-gray-200 hover:text-white dark:text-gray-300 dark:hover:text-white"
          >
            <Settings size={20} /> Settings
          </button>
        </li>
      </ul>
    </nav>
    <div className="mt-auto p-3 text-sm text-gray-400">
      &copy; 2025 College Admin Panel
    </div>
  </aside>
);

export default Sidebar;
