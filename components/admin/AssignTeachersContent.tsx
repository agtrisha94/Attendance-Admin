// src/components/AssignTeachersContent.tsx
"use client";
import React, { useEffect, useState } from "react";
import { fetchTeachers, Teacher } from "@/services/teacher.service";
import { fetchPrograms } from "@/services/program.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import { fetchSubjectsByClass } from "@/services/fetchSubjectsbyClass";
import { assignTeacherToSubjectForClass } from "@/services/assignTeacherToSubject";
import { fetchYearsByProgramName } from "@/services/year.service";

type RowStatus = "idle" | "saving" | "success" | "error";

interface Assignment {
  key: string;
  programId?: number;
  programName?: string;
  branchName?: string;
  classId?: number;
  year?: number; // numeric year id/number from backend
  subjectId?: string;
  status?: RowStatus;
  error?: string | null;
}

const makeKey = (teacherId: string) =>
  `${teacherId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const AssignTeachersContent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState({ teachers: false, programs: false });
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});

  // caches
  const [yearsByProgram, setYearsByProgram] = useState<Record<string, any[]>>({});
  const [branchesByYear, setBranchesByYear] = useState<Record<number, any[]>>({});
  const [classesByRow, setClassesByRow] = useState<Record<string, any[]>>({});
  const [subjectsByRow, setSubjectsByRow] = useState<Record<string, any[]>>({});

  const [globalSaving, setGlobalSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading((s) => ({ ...s, teachers: true, programs: true }));
        setFetchError(null);

        const [teachersRes, programsRes] = await Promise.all([fetchTeachers(), fetchPrograms()]);

        if (!mounted) return;
        setTeachers(teachersRes);
        setPrograms(programsRes);
      } catch (err: any) {
        console.error("Error loading initial data:", err);
        setFetchError(err?.message ?? "Failed to load initial data");
      } finally {
        if (mounted) setLoading((s) => ({ ...s, teachers: false, programs: false }));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ====== Years (per-program) ====== */
  const loadYearsForProgram = async (programName: string) => {
    if (!programName) return [];

    if (yearsByProgram[programName]) return yearsByProgram[programName];

    try {
      const res = await fetchYearsByProgramName(programName);
      // expected shape per item: { id, yearNumber?, yearName?, label? } — be flexible in render
      setYearsByProgram((prev) => ({ ...prev, [programName]: res }));
      return res;
    } catch (err) {
      console.error("Failed to fetch years for program", programName, err);
      setYearsByProgram((prev) => ({ ...prev, [programName]: [] }));
      return [];
    }
  };

  /* ====== CRUD for rows ====== */
  const addAssignment = (teacherId: string) => {
    setAssignments((prev) => {
      const arr = prev[teacherId] ? [...prev[teacherId]] : [];
      arr.push({
        key: makeKey(teacherId),
        programId: undefined,
        programName: undefined,
        branchName: undefined,
        classId: undefined,
        year: undefined,
        subjectId: undefined,
        status: "idle",
        error: null,
      });
      return { ...prev, [teacherId]: arr };
    });
  };

  const removeAssignment = (teacherId: string, index: number) => {
    setAssignments((prev) => {
      const arr = prev[teacherId] ? [...prev[teacherId]] : [];
      if (index < 0 || index >= arr.length) return prev;
      const removed = arr.splice(index, 1);
      // clear cached classes/subjects for removed row
      setClassesByRow((c) => {
        const copy = { ...c };
        delete copy[removed[0].key];
        return copy;
      });
      setSubjectsByRow((s) => {
        const copy = { ...s };
        delete copy[removed[0].key];
        return copy;
      });
      if (arr.length === 0) {
        const { [teacherId]: _r, ...rest } = prev;
        return rest;
      }
      return { ...prev, [teacherId]: arr };
    });
  };

  const handleChange = (teacherId: string, index: number, field: keyof Assignment, value?: any) => {
    setAssignments((prev) => {
      const arr = prev[teacherId] ? [...prev[teacherId]] : [];
      const prevRow = arr[index] || ({} as Assignment);
      const row = { ...(arr[index] || { key: makeKey(teacherId) }) } as Assignment;

      if (field === "programId") {
        const num = value === "" || value === undefined ? undefined : Number(value);
        const newProgramId = Number.isNaN(num) ? undefined : num;
        const prevProgramName = prevRow.programName;
        row.programId = newProgramId;
        row.programName = programs.find((p) => p.id === row.programId)?.name;

        // cascading clears: year/branch/class/subject when program changes
        row.year = undefined;
        row.branchName = undefined;
        row.classId = undefined;
        row.subjectId = undefined;

        // clear cached years for previous program (optional)
        if (prevProgramName) {
          setYearsByProgram((y) => {
            const copy = { ...y };
            delete copy[prevProgramName];
            return copy;
          });
        }

        // clear other caches
        setBranchesByYear({});
        setClassesByRow((c) => {
          const copy = { ...c };
          delete copy[row.key];
          return copy;
        });
        setSubjectsByRow((s) => {
          const copy = { ...s };
          delete copy[row.key];
          return copy;
        });
      } else if (field === "year") {
        const num = value === "" || value === undefined ? undefined : Number(value);
        row.year = Number.isNaN(num) ? undefined : num;
        // clear branches/classes/subject when year changes
        row.branchName = undefined;
        row.classId = undefined;
        row.subjectId = undefined;
        setClassesByRow((c) => {
          const copy = { ...c };
          delete copy[row.key];
          return copy;
        });
        setSubjectsByRow((s) => {
          const copy = { ...s };
          delete copy[row.key];
          return copy;
        });
      } else if (field === "branchName") {
        row.branchName = value;
        row.classId = undefined;
        row.subjectId = undefined;
        setClassesByRow((c) => {
          const copy = { ...c };
          delete copy[row.key];
          return copy;
        });
        setSubjectsByRow((s) => {
          const copy = { ...s };
          delete copy[row.key];
          return copy;
        });
      } else if (field === "classId") {
        const num = value === "" || value === undefined ? undefined : Number(value);
        row.classId = Number.isNaN(num) ? undefined : num;
        // clear previously selected subject for changed class
        row.subjectId = undefined;
        setSubjectsByRow((s) => {
          const copy = { ...s };
          delete copy[row.key];
          return copy;
        });
      } else if (field === "subjectId") {
        row.subjectId = value;
      } else {
        (row as any)[field] = value;
      }

      arr[index] = row;
      return { ...prev, [teacherId]: arr };
    });
  };

  /* ====== Branches fetching (by year) ====== */
  const loadBranchesForYear = async (yearNumber: number) => {
    if (!yearNumber) return [];

    if (branchesByYear[yearNumber]) return branchesByYear[yearNumber];

    try {
      const res = await fetchBranchesByAcademicYear(yearNumber);
      setBranchesByYear((prev) => ({ ...prev, [yearNumber]: res }));
      return res;
    } catch (err) {
      console.error("Failed to fetch branches by year", err);
      setBranchesByYear((prev) => ({ ...prev, [yearNumber]: [] }));
      return [];
    }
  };

  /* ====== Classes fetching (on-demand by row) ====== */
  const loadClassesForRow = async (rowKey: string, programName?: string, year?: number, branchName?: string) => {
    // require programName, yearNumber, branchName
    if (!programName || !year || !branchName) {
      setClassesByRow((prev) => ({ ...prev, [rowKey]: [] }));
      return [];
    }

    // avoid duplicate fetch
    if (classesByRow[rowKey]?.length) return classesByRow[rowKey];

    try {
      const res = await fetchClassesByBranch(programName, year, branchName);
      setClassesByRow((prev) => ({ ...prev, [rowKey]: res }));
      return res;
    } catch (err) {
      console.error("Failed to fetch classes for row", err);
      setClassesByRow((prev) => ({ ...prev, [rowKey]: [] }));
      return [];
    }
  };

  /* ====== Subjects fetching (by classId) ====== */
  const loadSubjectsForRow = async (rowKey: string, classId: number) => {
    if (!classId) {
      setSubjectsByRow((prev) => ({ ...prev, [rowKey]: [] }));
      return [];
    }
    if (subjectsByRow[rowKey]?.length) return subjectsByRow[rowKey];

    try {
      const res = await fetchSubjectsByClass(classId);
      setSubjectsByRow((prev) => ({ ...prev, [rowKey]: res }));
      return res;
    } catch (err) {
      console.error("Failed to fetch subjects for row", err);
      setSubjectsByRow((prev) => ({ ...prev, [rowKey]: [] }));
      return [];
    }
  };

  const validateRow = (r: Assignment) =>
    !!(r.programId && r.branchName && r.classId && r.year && r.subjectId);

  const isTeacherAssignmentsValid = (teacherId: string) => {
    const arr = assignments[teacherId] || [];
    if (arr.length === 0) return false;
    return arr.every(validateRow);
  };

  /* ====== Save (calls assignTeacherToSubjectForClass) ====== */
  const handleSaveAllForTeacher = async (teacherId: string) => {
    const arr = assignments[teacherId] || [];
    if (arr.length === 0) {
      alert("No assignments to save.");
      return;
    }
    const invalidIndex = arr.findIndex((r) => !validateRow(r));
    if (invalidIndex !== -1) {
      alert(`Please fill all fields for assignment #${invalidIndex + 1} before saving.`);
      return;
    }

    setGlobalSaving(true);
    try {
      for (let i = 0; i < arr.length; i++) {
        const row = arr[i];

        // optimistic
        setAssignments((prev) => {
          const copy = [...(prev[teacherId] || [])];
          copy[i] = { ...copy[i], status: "saving", error: null };
          return { ...prev, [teacherId]: copy };
        });

        try {
          await assignTeacherToSubjectForClass(row.subjectId as string, teacherId, row.classId as number);

          setAssignments((prev) => {
            const copy = [...(prev[teacherId] || [])];
            copy[i] = { ...copy[i], status: "success", error: null };
            return { ...prev, [teacherId]: copy };
          });
        } catch (err: any) {
          console.error("Assign failed", err);
          setAssignments((prev) => {
            const copy = [...(prev[teacherId] || [])];
            copy[i] = { ...copy[i], status: "error", error: err?.message ?? String(err) };
            return { ...prev, [teacherId]: copy };
          });
          // continue saving other rows
        }
      }
      alert("Save finished. Check per-row statuses.");
    } finally {
      setGlobalSaving(false);
    }
  };

  /* ====== Render ====== */
  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Assign Teachers</h2>

      {fetchError && <div className="text-red-500 mb-4">Error loading data: {fetchError}</div>}

      {loading.teachers ? (
        <div>Loading teachers...</div>
      ) : teachers.length === 0 ? (
        <div className="text-sm text-gray-500">No teachers found.</div>
      ) : (
        teachers.map((teacher) => (
          <div key={teacher.id} className="mb-8 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">{teacher.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">{teacher.department}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addAssignment(teacher.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  type="button"
                >
                  + Add Assignment
                </button>
              </div>
            </div>

            {/* rows */}
            {(assignments[teacher.id] || []).map((assign, idx) => {
              const availableBranches = assign.year ? branchesByYear[Number(assign.year)] ?? [] : [];
              const availableClasses = classesByRow[assign.key] ?? [];
              const availableSubjects = subjectsByRow[assign.key] ?? [];

              return (
                <div key={assign.key} className="grid grid-cols-6 gap-3 mb-3 items-center">
                  {/* Program */}
                  <select
                    value={assign.programId ?? ""}
                    onChange={(e) => handleChange(teacher.id, idx, "programId", e.target.value === "" ? "" : Number(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {/* Year (loaded from backend based on programName) */}
                  <select
                    value={assign.year ?? ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      handleChange(teacher.id, idx, "year", val === "" ? undefined : Number(val));
                      if (val) await loadBranchesForYear(Number(val)); // pre-load branches
                    }}
                    onFocus={() => assign.programName && loadYearsForProgram(assign.programName)}
                    className="border rounded px-2 py-1"
                    disabled={!assign.programName}
                  >
                    <option value="">Year</option>
                    {(assign.programName ? yearsByProgram[assign.programName] ?? [] : []).map((y: any) => {
                      const val = y.yearNumber ?? y.id;
                      const label = y.yearName ?? y.label ?? `Year ${val}`;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  {/* Branch */}
                  <select
                    value={assign.branchName ?? ""}
                    onChange={(e) => handleChange(teacher.id, idx, "branchName", e.target.value)}
                    className="border rounded px-2 py-1"
                    disabled={!assign.year}
                  >
                    <option value="">Branch</option>
                    {availableBranches.map((b: any) => (
                      <option key={b.id ?? b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  {/* Class */}
                  <select
                    value={assign.classId ?? ""}
                    onChange={(e) => handleChange(teacher.id, idx, "classId", e.target.value === "" ? "" : Number(e.target.value))}
                    onFocus={() => loadClassesForRow(assign.key, assign.programName, assign.year, assign.branchName)}
                    className="border rounded px-2 py-1"
                    disabled={!assign.programId || !assign.branchName || !assign.year}
                  >
                    <option value="">Class</option>
                    {availableClasses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? `Class ${c.id}`}
                      </option>
                    ))}
                  </select>

                  {/* Subject (loaded by class) */}
                  <select
                    value={assign.subjectId ?? ""}
                    onChange={(e) => handleChange(teacher.id, idx, "subjectId", e.target.value)}
                    onFocus={() => assign.classId && loadSubjectsForRow(assign.key, assign.classId)}
                    className="border rounded px-2 py-1"
                    disabled={!assign.classId}
                  >
                    <option value="">Subject</option>
                    {availableSubjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Remove */}
                  <button
                    onClick={() => removeAssignment(teacher.id, idx)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    type="button"
                  >
                    Remove
                  </button>

                  {/* row status */}
                  <div className="col-span-6 mt-1 text-sm">
                    {assign.status === "saving" && <span>Saving...</span>}
                    {assign.status === "success" && <span className="text-green-500">Saved ✓</span>}
                    {assign.status === "error" && <span className="text-red-400">Error: {assign.error ?? "Failed to save"}</span>}
                  </div>
                </div>
              );
            })}

            {/* Save */}
            {assignments[teacher.id]?.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSaveAllForTeacher(teacher.id)}
                  disabled={!isTeacherAssignmentsValid(teacher.id) || globalSaving}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
                  type="button"
                >
                  {globalSaving ? "Saving..." : "Save All"}
                </button>

                {!isTeacherAssignmentsValid(teacher.id) && <span className="text-sm text-gray-500">Fill all fields to enable Save</span>}
              </div>
            )}
          </div>
        ))
      )}

      <div className="mt-4 text-sm text-gray-500">{Object.keys(assignments).length > 0 ? "You have unsaved assignments." : "No pending assignments."}</div>
    </div>
  );
};

export default AssignTeachersContent;
