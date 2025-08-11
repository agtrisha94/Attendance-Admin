"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { mockSessions, YearData } from "@/lib/mockApi";

const SessionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const session = mockSessions.find((s) => s.id === id);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");

  if (!session) return <div>Session not found</div>;

  const years = Array.from({ length: session.duration }, (_, i) => i + 1);

  const yearBranches = selectedYear
    ? Object.entries(session.subjects).filter(
        ([branch]) => session.subjects[branch][selectedYear as number]
      )
    : [];

  const filteredBranches = filterBranch
    ? yearBranches.filter(([branch]) => branch === filterBranch)
    : yearBranches;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        {session.program} {session.name}
      </h1>

      {/* Step 1: Year Selection */}
      {!selectedYear && (
        <div>
          <h2 className="mb-2 font-semibold">Select Year</h2>
          <div className="flex gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Year {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Branch + Section List */}
      {selectedYear && (
        <>
          <div className="flex gap-4 mb-4">
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setFilterSection("");
              }}
              className="border rounded px-2 py-1"
            >
              <option value="">All Branches</option>
              {yearBranches.map(([branch]) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            {filterBranch && (
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">All Sections</option>
                {Object.keys(
                  session.subjects[filterBranch][selectedYear].sections
                ).map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredBranches.map(([branch, yearsData]) => {
            const yearData: YearData = yearsData[selectedYear as number];
            if (!yearData) return null;

            const displayedSections = filterSection
              ? { [filterSection]: yearData.sections[filterSection] }
              : yearData.sections;

            return (
              <div key={branch} className="mb-6">
                <h3 className="text-lg font-bold">{branch}</h3>
                {Object.entries(displayedSections).map(([section, subjects]) => (
                  <div key={section} className="ml-4 mb-4">
                    <h4 className="font-semibold">Section {section}</h4>
                    <table className="min-w-full border border-gray-200 dark:border-gray-700">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b">Subject</th>
                          <th className="py-2 px-4 border-b">Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subj, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-4 border-b">{subj.name}</td>
                            <td className="py-2 px-4 border-b">{subj.teacher}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default SessionDetailsPage;
