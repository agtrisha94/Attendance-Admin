"use client";
import React, { useState } from "react";
import Link from "next/link";
import { mockSessions, Session } from "@/lib/mockApi";

type ProgramType = "B.Tech" | "BBA" | "MBA";

const programDurations: Record<ProgramType, number> = {
  "B.Tech": 4,
  "BBA": 3,
  "MBA": 2,
};

const SessionManagementContent: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<ProgramType>("B.Tech");
  const [newStartYear, setNewStartYear] = useState<number>(2025);
  const [newBranches, setNewBranches] = useState<string>("");
  const [newSections, setNewSections] = useState<string>("");

  const createSession = () => {
    const duration = programDurations[newProgram];
    const newSession: Session = {
      id: Date.now().toString(),
      program: newProgram,
      name: `${newStartYear}-${newStartYear + duration}`,
      duration,
      branches: newBranches.split(",").map(b => b.trim()),
      sections: newSections.split(",").map(s => s.trim()),
      years: {},
    };
    setSessions((prev) => [...prev, newSession]);
    setIsModalOpen(false);
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
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Session</th>
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
                    {/* extra actions here */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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

            <label className="block mb-2 text-sm">Branches (comma separated)</label>
            <input
              type="text"
              value={newBranches}
              onChange={(e) => setNewBranches(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-4"
            />

            <label className="block mb-2 text-sm">Sections (comma separated)</label>
            <input
              type="text"
              value={newSections}
              onChange={(e) => setNewSections(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-4"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
              <button onClick={createSession} className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementContent;
