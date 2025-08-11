"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";

type Subject = { name: string; teacher: string };
type BranchSubjects = { [year: number]: Subject[] };
type Subjects = { [branch: string]: BranchSubjects };

const mockSessionData: {
  id: string;
  program: string;
  name: string;
  branches: string[];
  duration: number;
  subjects: Subjects;
} = {
  id: "1",
  program: "B.Tech",
  name: "2023-2027",
  branches: ["Computer Science", "Mechanical", "Electrical", "Civil"],
  duration: 4,
  subjects: {
    "Computer Science": {
      1: [{ name: "Mathematics I", teacher: "Mr. Sharma" }, { name: "Physics I", teacher: "Ms. Gupta" }],
      2: [{ name: "Data Structures", teacher: "Mr. Khan" }],
      3: [{ name: "DBMS", teacher: "Mrs. Das" }],
      4: [{ name: "Machine Learning", teacher: "Dr. Mehta" }],
    },
    "Mechanical": {
      1: [{ name: "Engineering Mechanics", teacher: "Mr. Singh" }],
      2: [{ name: "Thermodynamics", teacher: "Ms. Roy" }],
      3: [{ name: "Fluid Mechanics", teacher: "Mr. Verma" }],
      4: [{ name: "Heat Transfer", teacher: "Dr. Bose" }],
    }
  }
};

const SessionDetailsPage: React.FC = () => {
  const params = useParams();
  const [selectedBranch, setSelectedBranch] = useState(mockSessionData.branches[0]);
  const [selectedYear, setSelectedYear] = useState(1);

  const branchSubjects = mockSessionData.subjects[selectedBranch]?.[selectedYear] || [];

  return (
    <div className="p-6 bg-white dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-2">{mockSessionData.program} Session {mockSessionData.name}</h1>
      <p className="mb-6 text-gray-500">Session ID: {params.id}</p>

      {/* Branch Selection */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Select Branch</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        >
          {mockSessionData.branches.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
      </div>

      {/* Year Selection */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: mockSessionData.duration }, (_, i) => i + 1).map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded ${selectedYear === year ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}
          >
            Year {year}
          </button>
        ))}
      </div>

      {/* Subjects Table */}
      <h2 className="text-lg font-bold mb-2">Subjects for {selectedBranch} - Year {selectedYear}</h2>
      <table className="min-w-full border border-gray-200 dark:border-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Subject</th>
            <th className="py-2 px-4 border-b">Assigned Teacher</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {branchSubjects.map((subj, idx) => (
            <tr key={idx}>
              <td className="py-2 px-4 border-b">{subj.name}</td>
              <td className="py-2 px-4 border-b">{subj.teacher}</td>
              <td className="py-2 px-4 border-b">
                <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                  Change Teacher
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionDetailsPage;

