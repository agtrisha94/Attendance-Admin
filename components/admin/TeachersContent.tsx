// src/components/admin/TeachersContent.tsx
"use client";
import React, { useState, useMemo } from 'react';
import * as Papa from 'papaparse';

// Mock Data Interfaces (matching your schema concepts)
interface Program {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  programId: number; // Link to program
}

interface Subject {
  id: string; // UUID in schema
  name: string;
  code: string;
  semesterId: number; // Link to semester
  branchId: number; // For simplicity in mock, linking subject directly to branch for filtering
  programId: number; // For simplicity in mock, linking subject directly to program for filtering
}

interface Teacher {
  id: string; // UUID in schema
  name: string;
  department: string; // Assuming department from previous mock
  email: string;
  status: string;
  // --- CLIENT-SIDE SIMULATED ASSIGNMENTS (NOT PERSISTED IN DB WITH ORIGINAL SCHEMA) ---
  assignedProgram?: string; // Administrative role simulation
  assignedBranch?: string;  // Administrative role simulation
  assignedYear?: string;    // Administrative role simulation
  assignedSection?: string; // Administrative role simulation

  teachingAssignments: { // Simulated SubjectTeacher assignments
    subjectId: string;
    subjectName: string;
    programName: string;
    branchName: string;
    classId?: number; // Optional class ID if assigned to a specific class
  }[];
}

// --- MOCK DATA FOR DROPDOWNS AND INITIAL STATE ---
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

const mockSubjects: Subject[] = [
  { id: 'sub-cs101', name: 'Intro to Programming', code: 'CS101', semesterId: 1, branchId: 101, programId: 1 },
  { id: 'sub-cs202', name: 'Data Structures', code: 'CS202', semesterId: 2, branchId: 101, programId: 1 },
  { id: 'sub-ee101', name: 'Circuit Theory', code: 'EE101', semesterId: 1, branchId: 102, programId: 1 },
  { id: 'sub-me101', name: 'Engineering Drawing', code: 'ME101', semesterId: 1, branchId: 103, programId: 1 },
  { id: 'sub-mkt301', name: 'Principles of Marketing', code: 'MKT301', semesterId: 3, branchId: 201, programId: 2 },
  { id: 'sub-fin301', name: 'Financial Management', code: 'FIN301', semesterId: 3, branchId: 202, programId: 2 },
  { id: 'sub-hr501', name: 'Human Resource Management', code: 'HR501', semesterId: 5, branchId: 301, programId: 3 },
  { id: 'sub-ops501', name: 'Operations Management', code: 'OPS501', semesterId: 5, branchId: 302, programId: 3 },
];

const mockTeachers: Teacher[] = [
  {
    id: 'T001', name: 'Dr. Emily White', department: 'Computer Science', email: 'emily.w@example.com', status: 'Active',
    assignedProgram: 'B.Tech', assignedBranch: 'Computer Science', assignedYear: '1st Year', assignedSection: 'A',
    teachingAssignments: [
      { subjectId: 'sub-cs101', subjectName: 'Intro to Programming', programName: 'B.Tech', branchName: 'Computer Science' },
    ]
  },
  {
    id: 'T002', name: 'Prof. John Davis', department: 'Physics', email: 'john.d@example.com', status: 'Active',
    assignedProgram: 'B.Tech', assignedBranch: 'Electrical', assignedYear: '2nd Year', assignedSection: 'B',
    teachingAssignments: [
      { subjectId: 'sub-ee101', subjectName: 'Circuit Theory', programName: 'B.Tech', branchName: 'Electrical' },
      { subjectId: 'sub-ops501', subjectName: 'Operations Management', programName: 'MBA', branchName: 'Operations' },
    ]
  },
  {
    id: 'T003', name: 'Dr. Sarah Connor', department: 'Mathematics', email: 'sarah.c@example.com', status: 'On Leave',
    teachingAssignments: [
      { subjectId: 'sub-mkt301', subjectName: 'Principles of Marketing', programName: 'BBA', branchName: 'Marketing' },
    ]
  },
];

const TeachersContent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);

  // State for Administrative Assignment Modal
  const [adminEditingTeacherId, setAdminEditingTeacherId] = useState<string | null>(null);
  const [currentAdminAssignment, setCurrentAdminAssignment] = useState({
    program: '', branch: '', year: '', section: ''
  });
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['A', 'B', 'C'];

  // State for Teaching Assignment Modal
  const [teachingEditingTeacherId, setTeachingEditingTeacherId] = useState<string | null>(null);
  const [currentTeachingAssignment, setCurrentTeachingAssignment] = useState({
    programId: '', branchId: '', subjectId: '' // Use IDs for internal logic
  });

  // --- HANDLERS FOR ADMINISTRATIVE ASSIGNMENT ---
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
        ? {
            ...t,
            assignedProgram: currentAdminAssignment.program,
            assignedBranch: currentAdminAssignment.branch,
            assignedYear: currentAdminAssignment.year,
            assignedSection: currentAdminAssignment.section,
          }
        : t
    ));
    setAdminEditingTeacherId(null);
    alert('Administrative assignment updated in frontend. This data is NOT persisted to the database with the current schema.');
  };

  // --- HANDLERS FOR TEACHING ASSIGNMENT ---
  const handleTeachingAssignClick = (teacher: Teacher) => {
    setTeachingEditingTeacherId(teacher.id);
    setCurrentTeachingAssignment({ programId: '', branchId: '', subjectId: '' }); // Reset for new assignment
  };

  const handleAddTeachingAssignment = (teacherId: string) => {
    const selectedProgram = mockPrograms.find(p => p.id.toString() === currentTeachingAssignment.programId);
    const selectedBranch = mockBranches.find(b => b.id.toString() === currentTeachingAssignment.branchId);
    const selectedSubject = mockSubjects.find(s => s.id === currentTeachingAssignment.subjectId);

    if (!selectedProgram || !selectedBranch || !selectedSubject) {
      alert("Please select Program, Branch, and Subject.");
      return;
    }

    setTeachers(teachers.map(t =>
      t.id === teacherId
        ? {
            ...t,
            teachingAssignments: [
              ...t.teachingAssignments,
              {
                subjectId: selectedSubject.id,
                subjectName: selectedSubject.name,
                programName: selectedProgram.name,
                branchName: selectedBranch.name,
                // classId: undefined // Could add if you implement class selection
              }
            ]
          }
        : t
    ));
    setTeachingEditingTeacherId(null);
    alert('Teaching assignment added in frontend. This data is NOT persisted to the database with the current schema (SubjectTeacher records would be created via API).');
  };

  const handleRemoveTeachingAssignment = (teacherId: string, subjectIdToRemove: string) => {
    setTeachers(teachers.map(t =>
      t.id === teacherId
        ? {
            ...t,
            teachingAssignments: t.teachingAssignments.filter(
              assign => assign.subjectId !== subjectIdToRemove
            )
          }
        : t
    ));
    alert('Teaching assignment removed in frontend. This data is NOT removed from the database with the current schema (SubjectTeacher records would be deleted via API).');
  };


  // --- FILTERED DROPDOWN OPTIONS ---
  const filteredBranches = useMemo(() => {
    if (!currentTeachingAssignment.programId) return [];
    return mockBranches.filter(b => b.programId.toString() === currentTeachingAssignment.programId);
  }, [currentTeachingAssignment.programId]);

  const filteredSubjects = useMemo(() => {
    if (!currentTeachingAssignment.branchId) return [];
    return mockSubjects.filter(s => s.branchId.toString() === currentTeachingAssignment.branchId);
  }, [currentTeachingAssignment.branchId]);


  // --- FILE UPLOAD ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Assuming CSV has basic teacher info, not assignments
          const newTeachers: Teacher[] = (results.data as Omit<Teacher, 'teachingAssignments'>[]).map(t => ({
            ...t,
            id: t.id || `T${Math.random().toString(36).substr(2, 9)}`, // Generate ID if not present
            teachingAssignments: [] // Initialize empty
          }));
          setTeachers((prev) => [...prev, ...newTeachers]);
          alert('Teachers uploaded. Assignments (if any) are for frontend display only, not persisted to DB with original schema.');
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          alert('Error parsing CSV. Check console for details.');
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
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">ID</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Name</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Email</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Department</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Admin Assignment</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Teaching Assignments</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="dark:text-gray-200">
                <td className="py-2 px-4 border-b dark:border-gray-700">{teacher.id}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{teacher.name}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{teacher.email}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{teacher.department}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700 text-sm">
                  {teacher.assignedProgram && `P: ${teacher.assignedProgram}`}<br/>
                  {teacher.assignedBranch && `B: ${teacher.assignedBranch}`}<br/>
                  {teacher.assignedYear && `Y: ${teacher.assignedYear}`}<br/>
                  {teacher.assignedSection && `S: ${teacher.assignedSection}`}
                  {!teacher.assignedProgram && !teacher.assignedBranch && !teacher.assignedYear && !teacher.assignedSection && "N/A"}
                </td>
                <td className="py-2 px-4 border-b dark:border-gray-700 text-sm">
                  {teacher.teachingAssignments.length > 0 ? (
                    <ul>
                      {teacher.teachingAssignments.map((assignment, index) => (
                        <li key={index} className="mb-1">
                          {assignment.subjectName} ({assignment.programName} - {assignment.branchName})
                          <button
                            onClick={() => handleRemoveTeachingAssignment(teacher.id, assignment.subjectId)}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          >
                            (Remove)
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : "None"}
                </td>
                <td className="py-2 px-4 border-b dark:border-gray-700">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleAdminAssignClick(teacher)} className="text-blue-600 hover:underline text-sm dark:text-blue-400">
                      Edit Admin Assign
                    </button>
                    <button onClick={() => handleTeachingAssignClick(teacher)} className="text-purple-600 hover:underline text-sm dark:text-purple-400">
                      Add Teaching Assign
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Administrative Assignment Modal */}
      {adminEditingTeacherId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-700 dark:text-gray-100">
            <h3 className="text-xl font-bold mb-4">Edit Admin Assignment for: {teachers.find(t => t.id === adminEditingTeacherId)?.name}</h3>
            <p className="text-red-500 text-sm mb-4">
              *Note: This administrative assignment is for display only and not saved to the database with the current schema.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Program</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentAdminAssignment.program}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, program: e.target.value, branch: '' })}
              >
                <option value="">Select Program</option>
                {mockPrograms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            {currentAdminAssignment.program && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Branch</label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  value={currentAdminAssignment.branch}
                  onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, branch: e.target.value })}
                >
                  <option value="">Select Branch</option>
                  {mockBranches.filter(b => b.programId === mockPrograms.find(p => p.name === currentAdminAssignment.program)?.id)
                               .map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Year</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentAdminAssignment.year}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, year: e.target.value })}
              >
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Section</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentAdminAssignment.section}
                onChange={(e) => setCurrentAdminAssignment({ ...currentAdminAssignment, section: e.target.value })}
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdminEditingTeacherId(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancel</button>
              <button onClick={() => handleSaveAdminAssignment(adminEditingTeacherId!)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">Save Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Assignment Modal */}
      {teachingEditingTeacherId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-700 dark:text-gray-100">
            <h3 className="text-xl font-bold mb-4">Add Teaching Assignment for: {teachers.find(t => t.id === teachingEditingTeacherId)?.name}</h3>
            <p className="text-red-500 text-sm mb-4">
              *Note: This teaching assignment is for display only and not saved to the database with the current schema.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Program</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentTeachingAssignment.programId}
                onChange={(e) => setCurrentTeachingAssignment({ ...currentTeachingAssignment, programId: e.target.value, branchId: '', subjectId: '' })}
              >
                <option value="">Select Program</option>
                {mockPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Branch</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentTeachingAssignment.branchId}
                onChange={(e) => setCurrentTeachingAssignment({ ...currentTeachingAssignment, branchId: e.target.value, subjectId: '' })}
                disabled={!currentTeachingAssignment.programId}
              >
                <option value="">Select Branch</option>
                {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Subject</label>
              <select
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                value={currentTeachingAssignment.subjectId}
                onChange={(e) => setCurrentTeachingAssignment({ ...currentTeachingAssignment, subjectId: e.target.value })}
                disabled={!currentTeachingAssignment.branchId}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTeachingEditingTeacherId(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">Cancel</button>
              <button
                onClick={() => handleAddTeachingAssignment(teachingEditingTeacherId!)}
                disabled={!currentTeachingAssignment.subjectId}
                className={`bg-purple-600 text-white px-4 py-2 rounded-md ${!currentTeachingAssignment.subjectId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'} dark:bg-purple-700 dark:hover:bg-purple-800`}
              >
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersContent;