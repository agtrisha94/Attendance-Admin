"use client";
import React, { useState, useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  course: string; // Subject name
  teacher: string; // Teacher name
  program: string;
  branch: string;
  year: string; // Simulated for display, not directly from schema join path
  section: string; // Simulated for display, not directly from schema join path
  present: number;
  absent: number;
  totalStudents: number;
}

const mockAttendanceRecords: AttendanceRecord[] = [
  { id: 'AR001', date: '2025-07-30', course: 'CS101 - Intro to Programming', teacher: 'Dr. Emily White', program: 'B.Tech', branch: 'Computer Science', year: '1st Year', section: 'A', present: 30, absent: 5, totalStudents: 35 },
  { id: 'AR002', date: '2025-07-30', course: 'PHY201 - Quantum Mechanics', teacher: 'Prof. John Davis', program: 'B.Tech', branch: 'Electrical', year: '2nd Year', section: 'B', present: 20, absent: 2, totalStudents: 22 },
  { id: 'AR003', date: '2025-07-29', course: 'MKT301 - Principles of Marketing', teacher: 'Dr. Sarah Connor', program: 'BBA', branch: 'Marketing', year: '3rd Year', section: 'C', present: 25, absent: 3, totalStudents: 28 },
  { id: 'AR004', date: '2025-07-29', course: 'OPS501 - Operations Management', teacher: 'Prof. John Davis', program: 'MBA', branch: 'Operations', year: '1st Year', section: 'A', present: 18, absent: 1, totalStudents: 19 },
  { id: 'AR005', date: '2025-07-28', course: 'CS101 - Intro to Programming', teacher: 'Dr. Emily White', program: 'B.Tech', branch: 'Computer Science', year: '1st Year', section: 'B', present: 28, absent: 7, totalStudents: 35 },
  { id: 'AR006', date: '2025-07-28', course: 'BUS101 - Business Fundamentals', teacher: 'Dr. Sarah Connor', program: 'BBA', branch: 'Finance', year: '1st Year', section: 'A', present: 40, absent: 2, totalStudents: 42 },
];

const AttendanceContent: React.FC = () => {
  const [filterProgram, setFilterProgram] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // IMPORTANT NOTE: Filtering by Year and Section is challenging with your ORIGINAL schema's
  // structure (TimetableEntry -> Branch/Subject, not directly Year/Section).
  // These filters are commented out to reflect what's realistically achievable without schema changes.
  // const [filterYear, setFilterYear] = useState('');
  // const [filterSection, setFilterSection] = useState('');

  // Mock options for filters (in a real app, these would come from your DB)
  const programs = ['B.Tech', 'BBA', 'MBA'];
  const branchesByProgram: { [key: string]: string[] } = {
    'B.Tech': ['Computer Science', 'Electrical', 'Mechanical'],
    'BBA': ['Marketing', 'Finance'],
    'MBA': ['HR', 'Operations'],
  };
  const courses = Array.from(new Set(mockAttendanceRecords.map(r => r.course)));
  const teachers = Array.from(new Set(mockAttendanceRecords.map(r => r.teacher)));
  // const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  // const sections = ['A', 'B', 'C'];

  const filteredRecords = useMemo(() => {
    return mockAttendanceRecords.filter(record => {
      if (filterProgram && record.program !== filterProgram) return false;
      if (filterBranch && record.branch !== filterBranch) return false;
      if (filterCourse && record.course !== filterCourse) return false;
      if (filterTeacher && record.teacher !== filterTeacher) return false;
      if (filterDate && record.date !== filterDate) return false;
      // if (filterYear && record.year !== filterYear) return false; // Not directly supported by schema joins
      // if (filterSection && record.section !== filterSection) return false; // Not directly supported by schema joins
      return true;
    });
  }, [filterProgram, filterBranch, filterCourse, filterTeacher, filterDate]); // Include all filter dependencies

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Attendance Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg dark:bg-blue-900 dark:text-blue-100">
          <h3 className="text-lg font-medium">Total Students Present Today</h3>
          <p className="text-3xl font-bold">450 / 500</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg dark:bg-green-900 dark:text-green-100">
          <h3 className="text-lg font-medium">Classes Held Today</h3>
          <p className="text-3xl font-bold">120</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg dark:bg-yellow-900 dark:text-yellow-100">
          <h3 className="text-lg font-medium">Upcoming Classes</h3>
          <p className="text-3xl font-bold">15</p>
        </div>
      </div>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 dark:bg-gray-700 dark:border-gray-600">
        <div>
          <label htmlFor="filterProgram" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Program</label>
          <select
            id="filterProgram"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
            value={filterProgram}
            onChange={(e) => { setFilterProgram(e.target.value); setFilterBranch(''); }}
          >
            <option value="">All Programs</option>
            {programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterBranch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
          <select
            id="filterBranch"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            disabled={!filterProgram}
          >
            <option value="">All Branches</option>
            {(branchesByProgram[filterProgram] || []).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterCourse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course</label>
          <select
            id="filterCourse"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterTeacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teacher</label>
          <select
            id="filterTeacher"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            id="filterDate"
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-3">Filtered Attendance Records</h3>
        <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Date</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Program</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Branch</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Year (Simulated)</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Section (Simulated)</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Course</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Teacher</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Present</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Absent</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="dark:text-gray-200">
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.date}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.program}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.branch}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.year}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.section}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.course}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.teacher}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.present}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.absent}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">{record.totalStudents}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-4 text-center text-gray-500 dark:text-gray-400">No attendance records found for selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceContent;