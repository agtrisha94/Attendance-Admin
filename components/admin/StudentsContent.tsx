"use client";
import React, { useState } from 'react';
import * as Papa from 'papaparse';

interface Student {
  id: string;
  rollNo: string;
  name: string;
  major: string;
  email: string;
  status: string; 
}

const mockStudents: Student[] = [
  { id: 'S001', rollNo: 'UG2023001', name: 'Alice Johnson', major: 'Computer Science', email: 'alice.j@example.com', status: 'Enrolled' },
  { id: 'S002', rollNo: 'UG2023002', name: 'Bob Williams', major: 'Physics', email: 'bob.w@example.com', status: 'Enrolled' },
  { id: 'S003', rollNo: 'UG2023003', name: 'Charlie Brown', major: 'Mathematics', email: 'charlie.b@example.com', status: 'Enrolled' },
];

const StudentsContent: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setStudents((prev) => [...prev, ...(results.data as Student[])]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        }
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Upload Students CSV
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Roll No.</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Name</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Major</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Email</th>
              <th className="py-2 px-4 border-b text-left dark:border-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="dark:text-gray-200">
                <td className="py-2 px-4 border-b dark:border-gray-700">{student.rollNo}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{student.name}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{student.major}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{student.email}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{student.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsContent;