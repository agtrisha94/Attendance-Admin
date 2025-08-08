"use client";
import React, { useState } from 'react';
import * as Papa from 'papaparse';

interface Program {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  programId: number;
}

interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  status: string;
  assignedProgram?: string;
  assignedBranch?: string;
  assignedYear?: string;
  assignedSection?: string;
}

const mockPrograms: Program[] = [
  { id: 1, name: 'B.Tech' },
  { id: 2, name: 'BBA' },
  { id: 3, name: 'MBA' },
];

const mockBranches: Branch[] = [
  { id: 101, name: 'Computer Science', programId: 1 },
  { id: 102, name: 'Electrical', programId: 1 },
  { id: 103, name: 'Mechanical', programId: 1 },
  { id: 201, name: 'Marketing', programId: 2 },
  { id: 202, name: 'Finance', programId: 2 },
  { id: 301, name: 'HR', programId: 3 },
  { id: 302, name: 'Operations', programId: 3 },
];

const mockTeachers: Teacher[] = [
  {
    id: 'T001', name: 'Dr. Emily White', department: 'Computer Science',
    email: 'emily.w@example.com', status: 'Active',
    assignedProgram: 'B.Tech', assignedBranch: 'Computer Science',
    assignedYear: '1st Year', assignedSection: 'A'
  },
  {
    id: 'T002', name: 'Prof. John Davis', department: 'Physics',
    email: 'john.d@example.com', status: 'Active'
  },
  {
    id: 'T003', name: 'Dr. Sarah Connor', department: 'Mathematics',
    email: 'sarah.c@example.com', status: 'On Leave'
  },
];

const TeachersContent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);

  const [adminEditingTeacherId, setAdminEditingTeacherId] = useState<string | null>(null);
  const [currentAdminAssignment, setCurrentAdminAssignment] = useState({
    program: '', branch: '', year: '', section: ''
  });

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['A', 'B', 'C'];

  const handleAdminAssignClick = (teacher: Teacher) => {
    setAdminEditingTeacherId(teacher.id);
    setCurrentAdminAssignment({
      program: teacher.assignedProgram || '',
      branch: teacher.assignedBranch || '',
      year: teacher.assignedYear || '',
      section: teacher.assignedSection || ''
    });
  };

  const handleSaveAdminAssignment = (teacherId: string) => {
    setTeachers(teachers.map(t =>
      t.id === teacherId
        ? { ...t, ...{
            assignedProgram: currentAdminAssignment.program,
            assignedBranch: currentAdminAssignment.branch,
            assignedYear: currentAdminAssignment.year,
            assignedSection: currentAdminAssignment.section
          }}
        : t
    ));
    setAdminEditingTeacherId(null);
    alert('Administrative assignment updated (frontend only).');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const newTeachers: Teacher[] = (results.data as Omit<Teacher, 'assignedProgram' | 'assignedBranch' | 'assignedYear' | 'assignedSection'>[])
            .map(t => ({
              ...t,
              id: t.id || `T${Math.random().toString(36).substr(2, 9)}`
            }));
          setTeachers((prev) => [...prev, ...newTeachers]);
        }
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Teachers Management</h2>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Teacher List</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="upload-teachers-csv"
        />
        <label
          htmlFor="upload-teachers-csv"
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Upload Teachers CSV
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Department</th>
              <th className="py-2 px-4 border-b">Admin Assignment</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="py-2 px-4 border-b">{teacher.id}</td>
                <td className="py-2 px-4 border-b">{teacher.name}</td>
                <td className="py-2 px-4 border-b">{teacher.email}</td>
                <td className="py-2 px-4 border-b">{teacher.department}</td>
                <td className="py-2 px-4 border-b text-sm">
                  {teacher.assignedProgram && `P: ${teacher.assignedProgram}`}<br/>
                  {teacher.assignedBranch && `B: ${teacher.assignedBranch}`}<br/>
                  {teacher.assignedYear && `Y: ${teacher.assignedYear}`}<br/>
                  {teacher.assignedSection && `S: ${teacher.assignedSection}`}
                  {!teacher.assignedProgram && !teacher.assignedBranch && !teacher.assignedYear && !teacher.assignedSection && "N/A"}
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleAdminAssignClick(teacher)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit Admin Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Assignment Modal */}
      {adminEditingTeacherId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-700 dark:text-gray-100">
            <h3 className="text-xl font-bold mb-4">
              Edit Admin Assignment for: {teachers.find(t => t.id === adminEditingTeacherId)?.name}
            </h3>
            <div className="mb-4">
              <label className="block mb-2">Program</label>
              <select
                value={currentAdminAssignment.program}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, program: e.target.value, branch: '' })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Program</option>
                {mockPrograms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            {currentAdminAssignment.program && (
              <div className="mb-4">
                <label className="block mb-2">Branch</label>
                <select
                  value={currentAdminAssignment.branch}
                  onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, branch: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Branch</option>
                  {mockBranches.filter(b => b.programId === mockPrograms.find(p => p.name === currentAdminAssignment.program)?.id)
                    .map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block mb-2">Year</label>
              <select
                value={currentAdminAssignment.year}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, year: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Section</label>
              <select
                value={currentAdminAssignment.section}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, section: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAdminEditingTeacherId(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveAdminAssignment(adminEditingTeacherId!)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersContent;
