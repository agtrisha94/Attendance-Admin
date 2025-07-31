"use client";
import React, { useState, ReactNode } from 'react';
import {
  Bell,
  CalendarCheck,
  GraduationCap,
  Home,
  Menu,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import * as Papa from 'papaparse';  

// Mock Data
interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  status: string;
}

interface Student {
  id: string;
  rollNo: string;
  name: string;
  major: string;
  email: string;
  status: string;
}

const mockTeachers: Teacher[] = [
  { id: 'T001', name: 'Dr. Emily White', department: 'Computer Science', email: 'emily.w@example.com', status: 'Active' },
  { id: 'T002', name: 'Prof. John Davis', department: 'Physics', email: 'john.d@example.com', status: 'Active' },
  { id: 'T003', name: 'Dr. Sarah Connor', department: 'Mathematics', email: 'sarah.c@example.com', status: 'On Leave' },
];

const mockStudents: Student[] = [
  { id: 'S001', rollNo: 'UG2023001', name: 'Alice Johnson', major: 'Computer Science', email: 'alice.j@example.com', status: 'Enrolled' },
  { id: 'S002', rollNo: 'UG2023002', name: 'Bob Williams', major: 'Physics', email: 'bob.w@example.com', status: 'Enrolled' },
  { id: 'S003', rollNo: 'UG2023003', name: 'Charlie Brown', major: 'Mathematics', email: 'charlie.b@example.com', status: 'Enrolled' },
];

// Reusable Components (simplified for this example)
const Header: React.FC<{ title: string; onMenuToggle: () => void }> = ({ title, onMenuToggle }) => (
  <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
    <button className="md:hidden" onClick={onMenuToggle}>
      <Menu size={24} />
    </button>
    <h1 className="text-2xl font-bold">{title}</h1>
    <div className="flex items-center gap-4">
      <Bell size={20} className="text-gray-600" />
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
        A
      </div>
    </div>
  </header>
);

const Sidebar: React.FC<{ activeTab: string; onTabChange: (tab: string) => void; isOpen: boolean; onMenuToggle: () => void }> = ({
  activeTab,
  onTabChange,
  isOpen,
  onMenuToggle,
}) => (
  <aside
    className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 flex flex-col transition-transform transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:relative md:translate-x-0 md:flex`}
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold">College Admin</h2>
      <button className="md:hidden" onClick={onMenuToggle}>
        <X size={24} />
      </button>
    </div>
    <nav className="flex-grow">
      <ul>
        <li className={`mb-3 ${activeTab === 'attendance' ? 'bg-gray-700 rounded' : ''}`}>
          <button
            onClick={() => onTabChange('attendance')}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded"
          >
            <CalendarCheck size={20} /> Attendance
          </button>
        </li>
        <li className={`mb-3 ${activeTab === 'teachers' ? 'bg-gray-700 rounded' : ''}`}>
          <button
            onClick={() => onTabChange('teachers')}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded"
          >
            <Users size={20} /> Teachers
          </button>
        </li>
        <li className={`mb-3 ${activeTab === 'students' ? 'bg-gray-700 rounded' : ''}`}>
          <button
            onClick={() => onTabChange('students')}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded"
          >
            <GraduationCap size={20} /> Students
          </button>
        </li>
        <li className={`mb-3 ${activeTab === 'settings' ? 'bg-gray-700 rounded' : ''}`}>
          <button
            onClick={() => onTabChange('settings')}
            className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-700 rounded"
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

const AttendanceContent: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h2 className="text-2xl font-semibold mb-4">Attendance Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-blue-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium">Total Students Present Today</h3>
        <p className="text-3xl font-bold">450 / 500</p>
      </div>
      <div className="bg-green-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium">Classes Held Today</h3>
        <p className="text-3xl font-bold">120</p>
      </div>
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium">Upcoming Classes</h3>
        <p className="text-3xl font-bold">15</p>
      </div>
    </div>
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3">Recent Attendance Records</h3>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Date</th>
            <th className="py-2 px-4 border-b text-left">Course</th>
            <th className="py-2 px-4 border-b text-left">Teacher</th>
            <th className="py-2 px-4 border-b text-left">Present</th>
            <th className="py-2 px-4 border-b text-left">Absent</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4 border-b">2025-07-30</td>
            <td className="py-2 px-4 border-b">CS101 - Intro to Programming</td>
            <td className="py-2 px-4 border-b">Dr. Emily White</td>
            <td className="py-2 px-4 border-b">30</td>
            <td className="py-2 px-4 border-b">5</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border-b">2025-07-30</td>
            <td className="py-2 px-4 border-b">PHY201 - Quantum Mechanics</td>
            <td className="py-2 px-4 border-b">Prof. John Davis</td>
            <td className="py-2 px-4 border-b">20</td>
            <td className="py-2 px-4 border-b">2</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const TeachersContent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Assuming CSV headers match Teacher interface keys
          setTeachers((prev) => [...prev, ...(results.data as Teacher[])]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Teachers Management</h2>
      <div className="flex justify-end mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="upload-teachers-csv"
        />
        <label
          htmlFor="upload-teachers-csv"
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700"
        >
          Upload Teachers CSV
        </label>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Department</th>
            <th className="py-2 px-4 border-b text-left">Email</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td className="py-2 px-4 border-b">{teacher.id}</td>
              <td className="py-2 px-4 border-b">{teacher.name}</td>
              <td className="py-2 px-4 border-b">{teacher.department}</td>
              <td className="py-2 px-4 border-b">{teacher.email}</td>
              <td className="py-2 px-4 border-b">{teacher.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StudentsContent: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Assuming CSV headers match Student interface keys
          setStudents((prev) => [...prev, ...(results.data as Student[])]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Students Management</h2>
      <div className="flex justify-end mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="upload-students-csv"
        />
        <label
          htmlFor="upload-students-csv"
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700"
        >
          Upload Students CSV
        </label>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Roll No.</th>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Major</th>
            <th className="py-2 px-4 border-b text-left">Email</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td className="py-2 px-4 border-b">{student.rollNo}</td>
              <td className="py-2 px-4 border-b">{student.name}</td>
              <td className="py-2 px-4 border-b">{student.major}</td>
              <td className="py-2 px-4 border-b">{student.email}</td>
              <td className="py-2 px-4 border-b">{student.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SettingsContent: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow">
    <h2 className="text-2xl font-semibold mb-4">Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="college-name">
          College Name
        </label>
        <input
          type="text"
          id="college-name"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          defaultValue="My College"
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notifications">
          Attendance Notifications
        </label>
        <select
          id="notifications"
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option>Enabled</option>
          <option>Disabled</option>
        </select>
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
        Save Settings
      </button>
    </div>
  </div>
);

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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
    <div className="flex h-screen bg-gray-100">
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