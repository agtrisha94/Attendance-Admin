"use client";
import React, { useState } from "react";

interface Teacher {
  id: string;
  name: string;
  department: string;
}

interface Program {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  programId: number;
}

const mockTeachers: Teacher[] = [
  { id: "T001", name: "Dr. Emily White", department: "Computer Science" },
  { id: "T002", name: "Prof. John Davis", department: "Physics" },
  { id: "T003", name: "Dr. Sarah Connor", department: "Mathematics" },
];

const mockPrograms: Program[] = [
  { id: 1, name: "B.Tech" },
  { id: 2, name: "BBA" },
  { id: 3, name: "MBA" },
];

const mockBranches: Branch[] = [
  { id: 101, name: "Computer Science", programId: 1 },
  { id: 102, name: "Electrical", programId: 1 },
  { id: 103, name: "Mechanical", programId: 1 },
  { id: 201, name: "Marketing", programId: 2 },
  { id: 202, name: "Finance", programId: 2 },
  { id: 301, name: "HR", programId: 3 },
  { id: 302, name: "Operations", programId: 3 },
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const sections = ["A", "B", "C"];
const courses = ["Data Structures", "Physics", "Mathematics", "Marketing 101", "HR Management"];

const AssignTeachersContent: React.FC = () => {
  const [assignments, setAssignments] = useState<
    Record<string, { program?: string; branch?: string; year?: string; section?: string; course?: string }[]>
  >({});

  const handleChange = (
    teacherId: string,
    index: number,
    field: "program" | "branch" | "year" | "section" | "course",
    value: string
  ) => {
    setAssignments((prev) => {
      const updated = [...(prev[teacherId] || [])];
      updated[index] = { ...updated[index], [field]: value };
      // Reset branch when program changes
      if (field === "program") updated[index].branch = "";
      return { ...prev, [teacherId]: updated };
    });
  };

  const addAssignment = (teacherId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [teacherId]: [...(prev[teacherId] || []), {}],
    }));
  };

  const removeAssignment = (teacherId: string, index: number) => {
    setAssignments((prev) => {
      const updated = [...(prev[teacherId] || [])];
      updated.splice(index, 1);
      return { ...prev, [teacherId]: updated };
    });
  };

  const handleSave = (teacherId: string) => {
    alert(
      `Saved assignments for ${teacherId}:\n${JSON.stringify(assignments[teacherId], null, 2)}`
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Assign Teachers</h2>
      {mockTeachers.map((teacher) => (
        <div key={teacher.id} className="mb-8 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold">{teacher.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">{teacher.department}</p>
            </div>
            <button
              onClick={() => addAssignment(teacher.id)}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              + Add Assignment
            </button>
          </div>

          {(assignments[teacher.id] || []).map((assign, index) => (
            <div key={index} className="grid grid-cols-6 gap-3 mb-3 items-center">
              <select
                value={assign.program || ""}
                onChange={(e) =>
                  handleChange(teacher.id, index, "program", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Program</option>
                {mockPrograms.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={assign.branch || ""}
                onChange={(e) =>
                  handleChange(teacher.id, index, "branch", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Branch</option>
                {mockBranches
                  .filter(
                    (b) =>
                      b.programId ===
                      mockPrograms.find((p) => p.name === assign.program)?.id
                  )
                  .map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>

              <select
                value={assign.year || ""}
                onChange={(e) =>
                  handleChange(teacher.id, index, "year", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={assign.section || ""}
                onChange={(e) =>
                  handleChange(teacher.id, index, "section", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Section</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={assign.course || ""}
                onChange={(e) =>
                  handleChange(teacher.id, index, "course", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Course</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                onClick={() => removeAssignment(teacher.id, index)}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}

          {assignments[teacher.id]?.length > 0 && (
            <button
              onClick={() => handleSave(teacher.id)}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Save All
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AssignTeachersContent;
