"use client";
import React, { useState } from "react";
import Link from "next/link";

type ProgramType = "B.Tech" | "BBA" | "MBA";

interface Session {
  id: string;
  program: ProgramType;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

const programDurations: Record<ProgramType, number> = {
  "B.Tech": 4,
  "BBA": 3,
  "MBA": 2,
};

const SessionManagementContent: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", program: "B.Tech", name: "2023-2027", startYear: 2023, endYear: 2027, isActive: true },
    { id: "2", program: "BBA", name: "2023-2026", startYear: 2023, endYear: 2026, isActive: false },
    { id: "3", program: "MBA", name: "2024-2026", startYear: 2024, endYear: 2026, isActive: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<ProgramType>("B.Tech");
  const [newStartYear, setNewStartYear] = useState<number>(2025);

  const createSession = () => {
    const duration = programDurations[newProgram];
    const newSession: Session = {
      id: Date.now().toString(),
      program: newProgram,
      name: `${newStartYear}-${newStartYear + duration}`,
      startYear: newStartYear,
      endYear: newStartYear + duration,
      isActive: false,
    };
    setSessions((prev) => [...prev, newSession]);
    setIsModalOpen(false);
  };

  const setActiveSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === id ? true : s.isActive && s.program !== prev.find(p => p.id === id)?.program ? s.isActive : false
      }))
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Session Management</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create New Session
        </button>
      </div>

      {(["B.Tech", "BBA", "MBA"] as ProgramType[]).map((program) => (
        <div key={program} className="mb-6">
          <h3 className="text-lg font-bold mb-2">{program} Sessions</h3>
          <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Session</th>
                <th className="py-2 px-4 border-b">Active</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.filter(s => s.program === program).map((session) => (
                <tr key={session.id}>
                  <td className="py-2 px-4 border-b text-blue-600 hover:underline">
                    <Link href={`/sessions/${session.id}`}>{session.name}</Link>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {session.isActive ? (
                      <span className="text-green-600 font-bold">Yes</span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {!session.isActive && (
                      <button
                        onClick={() => setActiveSession(session.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create New Session</h3>

            <label className="block mb-2 text-sm">Program</label>
            <select
              value={newProgram}
              onChange={(e) => setNewProgram(e.target.value as ProgramType)}
              className="border rounded px-2 py-1 w-full mb-4"
            >
              <option value="B.Tech">B.Tech</option>
              <option value="BBA">BBA</option>
              <option value="MBA">MBA</option>
            </select>

            <label className="block mb-2 text-sm">Start Year</label>
            <input
              type="number"
              value={newStartYear}
              onChange={(e) => setNewStartYear(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createSession}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementContent;
