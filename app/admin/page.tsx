"use client";
import React, { useState } from 'react';
// Import extracted components
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import AttendanceContent from '@/components/admin/AttendanceContent';
import TeachersContent from '@/components/admin/TeachersContent';
import StudentsContent from '@/components/admin/StudentsContent';
import SettingsContent from '@/components/SettingsContent'; // Assuming SettingsContent is in src/components directly
import { useTheme } from '@/context/ThemeContext';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { theme } = useTheme();

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceContent />;
      case 'teachers':
        return <TeachersContent />;
      case 'students':
        return <StudentsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <AttendanceContent />;
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="College Admin Panel"
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;