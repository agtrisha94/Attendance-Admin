"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { mockSessions } from "@/lib/mockApi";

const SessionDetailsPage: React.FC = () => {
  const params = useParams();
  const session = mockSessions.find((s) => s.id === params.id);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  if (!session) return <div className="p-6">Session not found</div>;

  const subjects =
    selectedYear && selectedBranch && selectedSection
      ? session.years[selectedYear]?.[selectedBranch]?.[selectedSection] || []
      : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{session.program} Session {session.name}</h1>

      {/* Year Selection */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: session.duration }, (_, i) => i + 1).map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              setSelectedBranch("");
              setSelectedSection("");
            }}
            className={`px-4 py-2 rounded ${selectedYear === year ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          >
            Year {year}
          </button>
        ))}
      </div>

      {/* Branch Selection */}
      {selectedYear && (
        <div className="mt-4">
          <label className="block mb-1">Select Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedSection("");
            }}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">-- Select Branch --</option>
            {session.branches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
      )}

      {/* Section Selection */}
      {selectedBranch && (
        <div className="mt-4">
          <label className="block mb-1">Select Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">-- Select Section --</option>
            {session.sections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      )}

      {/* Subjects Table */}
      {selectedSection && (
        <>
          <h2 className="mt-6 font-bold">Subjects</h2>
          <table className="min-w-full border mt-2">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Subject</th>
                <th className="py-2 px-4 border">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length > 0 ? (
                subjects.map((subj, i) => (
                  <tr key={i}>
                    <td className="py-2 px-4 border">{subj.name}</td>
                    <td className="py-2 px-4 border">{subj.teacher}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center py-2">No subjects found</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default SessionDetailsPage;
