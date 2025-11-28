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

interface SubjectRow {
  id: string | number;
  name: string;
  assignedTeacherId?: string | number | null;
  status?: RowStatus;
  error?: string | null;
}

const AssignTeachersContent: React.FC = () => {
  // global lists
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([]);
  const [teachersGlobal, setTeachersGlobal] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState({
    programs: false,
    teachers: false,
    branches: false,
    classes: false,
    subjects: false,
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // selectors
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
  const [selectedProgramName, setSelectedProgramName] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);

  // caches
  const [yearsByProgram, setYearsByProgram] = useState<Record<string, any[]>>({});
  const [branchesByYear, setBranchesByYear] = useState<Record<number, any[]>>({});
  const [classesByBranchCache, setClassesByBranchCache] = useState<Record<string, any[]>>({});
  const [subjectsForClass, setSubjectsForClass] = useState<Record<number, SubjectRow[]>>({});

  // UI state
  const [globalSaving, setGlobalSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        setLoading((s) => ({ ...s, programs: true, teachers: true }));
        setFetchError(null);
        const [programsRes, teachersRes] = await Promise.all([fetchPrograms(), fetchTeachers()]);
        if (!mounted) return;
        setPrograms(programsRes);
        setTeachersGlobal(teachersRes);
      } catch (err: any) {
        console.error("Initial load failed:", err);
        setFetchError(err?.message ?? "Failed to load initial data");
      } finally {
        if (mounted) setLoading((s) => ({ ...s, programs: false, teachers: false }));
      }
    };
    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  /* ====== Helpers to load hierarchical data ====== */
  const loadYearsForProgram = async (programName?: string) => {
    if (!programName) return [];
    if (yearsByProgram[programName]) return yearsByProgram[programName];
    try {
      const res = await fetchYearsByProgramName(programName);
      setYearsByProgram((p) => ({ ...p, [programName]: res }));
      return res;
    } catch (err) {
      console.error("loadYearsForProgram failed", err);
      setYearsByProgram((p) => ({ ...p, [programName]: [] }));
      return [];
    }
  };

  const loadBranchesForYear = async (yearNumber?: number) => {
    if (!yearNumber) return [];
    if (branchesByYear[yearNumber]) return branchesByYear[yearNumber];
    try {
      setLoading((s) => ({ ...s, branches: true }));
      const res = await fetchBranchesByAcademicYear(yearNumber);
      setBranchesByYear((p) => ({ ...p, [yearNumber]: res }));
      return res;
    } catch (err) {
      console.error("loadBranchesForYear failed", err);
      setBranchesByYear((p) => ({ ...p, [yearNumber]: [] }));
      return [];
    } finally {
      setLoading((s) => ({ ...s, branches: false }));
    }
  };

  const loadClassesForBranch = async (programName?: string, year?: number, branchName?: string) => {
    if (!programName || !year || !branchName) return [];
    const cacheKey = `${programName}::${year}::${branchName}`;
    if (classesByBranchCache[cacheKey]) return classesByBranchCache[cacheKey];
    try {
      setLoading((s) => ({ ...s, classes: true }));
      const res = await fetchClassesByBranch(programName, year, branchName);
      setClassesByBranchCache((p) => ({ ...p, [cacheKey]: res }));
      return res;
    } catch (err) {
      console.error("loadClassesForBranch failed", err);
      setClassesByBranchCache((p) => ({ ...p, [cacheKey]: [] }));
      return [];
    } finally {
      setLoading((s) => ({ ...s, classes: false }));
    }
  };

  const loadSubjectsForClass = async (classId?: number) => {
    if (!classId) return [];
    if (subjectsForClass[classId]) return subjectsForClass[classId];
    try {
      setLoading((s) => ({ ...s, subjects: true }));
      const res: any[] = await fetchSubjectsByClass(classId);
      const normalized: SubjectRow[] = res.map((s) => ({
        id: s.id,
        name: s.name ?? s.subjectName ?? `Subject ${s.id}`,
        assignedTeacherId: s.assignedTeacherId ?? s.teacherId ?? null,
        status: "idle",
        error: null,
      }));
      setSubjectsForClass((p) => ({ ...p, [classId]: normalized }));
      return normalized;
    } catch (err) {
      console.error("loadSubjectsForClass failed", err);
      setSubjectsForClass((p) => ({ ...p, [classId]: [] }));
      return [];
    } finally {
      setLoading((s) => ({ ...s, subjects: false }));
    }
  };

  /* ====== Determine teachers for a class using existing teacher fields (no new services) ====== */
  const getTeachersForClassFromGlobal = (classObj: any | null) => {
    // If class object is missing, return global list as fallback
    if (!classObj) return teachersGlobal;

    // pick sensible fields from class object (different backends name these differently)
    const classProgram = classObj.programName ?? classObj.program ?? selectedProgramName;
    const classYear = classObj.year ?? classObj.yearNumber ?? selectedYear;
    const classBranch = classObj.branch ?? classObj.branchName ?? selectedBranch;
    // the class *section* or *name* may represent the section/sectionName/sectionId
    const classSection =
      classObj.section ?? classObj.sectionName ?? classObj.sectionId ?? classObj.name ?? undefined;

    // filter teachers where their assignedProgram/Branch/Year/Section match the class metadata
    const matched = teachersGlobal.filter((t) => {
      try {
        // matching rules: if teacher has an assigned field, it must match; if teacher's assigned field is null/undefined -> treat as not assigned (don't match)
        if (t.assignedProgram && classProgram && String(t.assignedProgram).toLowerCase() !== String(classProgram).toLowerCase()) return false;
        if (t.assignedBranch && classBranch && String(t.assignedBranch).toLowerCase() !== String(classBranch).toLowerCase()) return false;

        // teacher.assignedYear might be string or number
        if (t.assignedYear && classYear && String(t.assignedYear) !== String(classYear)) return false;

        // assignedSection matching: teacher.assignedSection vs classSection
        if (t.assignedSection && classSection && String(t.assignedSection).toLowerCase() !== String(classSection).toLowerCase()) return false;

        // At this point, teacher either matches all assigned fields available or teacher has no assigned* fields (in which case include)
        return true;
      } catch (e) {
        return false;
      }
    });

    // If none matched (maybe backend doesn't populate teacher assigned fields), return the global teacher list as fallback
    return matched.length > 0 ? matched : teachersGlobal;
  };

  /* ====== Selector change handlers (cascade clears) ====== */
  const onProgramChange = async (programIdVal?: number) => {
    setSelectedProgramId(programIdVal);
    const pName = programs.find((p) => p.id === programIdVal)?.name;
    setSelectedProgramName(pName);
    setSelectedYear(undefined);
    setSelectedBranch(undefined);
    setSelectedClassId(undefined);
  };

  const onYearChange = async (yearVal?: number) => {
    setSelectedYear(yearVal);
    setSelectedBranch(undefined);
    setSelectedClassId(undefined);
    if (yearVal) {
      await loadBranchesForYear(yearVal);
    }
  };

  const onBranchChange = async (branchName?: string) => {
    setSelectedBranch(branchName);
    setSelectedClassId(undefined);
    if (branchName && selectedProgramName && selectedYear) {
      await loadClassesForBranch(selectedProgramName, selectedYear, branchName);
    }
  };

  const onClassChange = async (classId?: number) => {
    setSelectedClassId(classId);
    if (classId) {
      await loadSubjectsForClass(classId);
      // classesList may have the class object; fetch it from cache so we can infer section/program/year/branch
      // but we don't call any new services here — get the class object from classes cache
    }
  };

  /* ====== UI helpers & actions ====== */
  const getSubjectsRows = () => {
    if (!selectedClassId) return [];
    return subjectsForClass[selectedClassId] ?? [];
  };

  const updateSubjectRow = (classId: number, subjectIndex: number, changes: Partial<SubjectRow>) => {
    setSubjectsForClass((prev) => {
      const copy = { ...prev };
      const arr = copy[classId] ? [...copy[classId]] : [];
      arr[subjectIndex] = { ...arr[subjectIndex], ...changes };
      copy[classId] = arr;
      return copy;
    });
  };

  const validateSubjectRow = (row: SubjectRow) => !!row.assignedTeacherId;

  /* Save one subject assignment */
  const handleSaveSubject = async (classId: number, idx: number) => {
    const rows = subjectsForClass[classId] ?? [];
    const row = rows[idx];
    if (!row) return;
    if (!validateSubjectRow(row)) {
      alert("Please select a teacher before saving this subject.");
      return;
    }
    updateSubjectRow(classId, idx, { status: "saving", error: null });
    try {
      await assignTeacherToSubjectForClass(String(row.id), String(row.assignedTeacherId), classId);
      updateSubjectRow(classId, idx, { status: "success", error: null });
    } catch (err: any) {
      console.error("save subject failed", err);
      updateSubjectRow(classId, idx, { status: "error", error: err?.message ?? String(err) });
    }
  };

  /* Save all subjects for the selected class */
  const handleSaveAllSubjectsForClass = async (classId?: number) => {
    if (!classId) return;
    const rows = subjectsForClass[classId] ?? [];
    if (rows.length === 0) {
      alert("No subjects to save for this class.");
      return;
    }
    const invalid = rows.findIndex((r) => !validateSubjectRow(r));
    if (invalid !== -1) {
      alert(`Please select teacher for subject #${invalid + 1} before saving all.`);
      return;
    }

    setGlobalSaving(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        updateSubjectRow(classId, i, { status: "saving", error: null });
        try {
          await assignTeacherToSubjectForClass(String(rows[i].id), String(rows[i].assignedTeacherId), classId);
          updateSubjectRow(classId, i, { status: "success", error: null });
        } catch (err: any) {
          console.error("assign failed for subject", rows[i], err);
          updateSubjectRow(classId, i, { status: "error", error: err?.message ?? String(err) });
        }
      }
      alert("Save finished. Check per-subject statuses.");
    } finally {
      setGlobalSaving(false);
    }
  };

  /* ====== Render ====== */
  const yearsList = selectedProgramName ? yearsByProgram[selectedProgramName] ?? [] : [];
  const branchesList = selectedYear ? branchesByYear[selectedYear] ?? [] : [];
  const classesList =
    selectedProgramName && selectedYear && selectedBranch
      ? classesByBranchCache[`${selectedProgramName}::${selectedYear}::${selectedBranch}`] ?? []
      : [];

  // derive currently selected class object (if present in cache)
  const selectedClassObj =
    selectedProgramName && selectedYear && selectedBranch && selectedClassId
      ? classesList.find((c: any) => Number(c.id) === Number(selectedClassId)) ?? null
      : null;

  // compute teacher list for this class using the teacher assigned fields (no new services)
  const teachersForCurrentClass = getTeachersForClassFromGlobal(selectedClassObj);

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Assign Teachers (by Class)</h2>

      {fetchError && <div className="text-red-500 mb-4">Error loading data: {fetchError}</div>}

      <div className="grid grid-cols-6 gap-3 mb-6 items-center">
        {/* Program */}
        <select
          value={selectedProgramId ?? ""}
          onChange={async (e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            await onProgramChange(v);
            if (v) {
              const pName = programs.find((p) => p.id === v)?.name;
              if (pName) {
                await loadYearsForProgram(pName);
              }
            }
          }}
          className="border rounded px-2 py-1 col-span-1"
        >
          <option value="">Program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selectedYear ?? ""}
          onChange={async (e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            await onYearChange(v);
          }}
          onFocus={() => {
            if (selectedProgramName) loadYearsForProgram(selectedProgramName).catch((e) => console.error(e));
          }}
          disabled={!selectedProgramId}
          className="border rounded px-2 py-1 col-span-1"
        >
          <option value="">Year</option>
          {yearsList.map((y: any) => {
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
          value={selectedBranch ?? ""}
          onChange={async (e) => {
            const v = e.target.value ?? undefined;
            await onBranchChange(v);
          }}
          disabled={!selectedYear}
          className="border rounded px-2 py-1 col-span-2"
        >
          <option value="">Branch</option>
          {branchesList.map((b: any) => (
            <option key={b.id ?? b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Class */}
        <select
          value={selectedClassId ?? ""}
          onChange={async (e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            await onClassChange(v);
          }}
          onFocus={() => {
            if (selectedProgramName && selectedYear && selectedBranch) {
              loadClassesForBranch(selectedProgramName, selectedYear, selectedBranch).catch((e) =>
                console.error("classes onFocus failed", e)
              );
            }
          }}
          disabled={!selectedBranch}
          className="border rounded px-2 py-1 col-span-2"
        >
          <option value="">Class</option>
          {classesList.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name ?? `Class ${c.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Subjects table for the selected class */}
      {!selectedClassId ? (
        <div className="text-sm text-gray-500">Select a Class to load subjects and assigned teachers.</div>
      ) : loading.subjects ? (
        <div>Loading subjects...</div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Subjects for selected class</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveAllSubjectsForClass(selectedClassId)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
                disabled={globalSaving || getSubjectsRows().length === 0}
                type="button"
              >
                {globalSaving ? "Saving..." : "Save All"}
              </button>
            </div>
          </div>

          {getSubjectsRows().length === 0 ? (
            <div className="text-sm text-gray-500">No subjects found for this class.</div>
          ) : (
            <div className="space-y-3">
              {getSubjectsRows().map((sub, idx) => {
                return (
                  <div key={String(sub.id)} className="grid grid-cols-6 gap-3 items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div className="col-span-2">
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-xs text-gray-500">ID: {sub.id}</div>
                    </div>

                    <select
                      value={sub.assignedTeacherId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : e.target.value;
                        updateSubjectRow(selectedClassId as number, idx, { assignedTeacherId: val ?? null });
                      }}
                      className="border rounded px-2 py-1 col-span-2"
                    >
                      <option value="">Select Teacher</option>
                      {teachersForCurrentClass.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.department ? `- ${t.department}` : ""}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveSubject(selectedClassId as number, idx)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        type="button"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          // reset row to backend value (reload subjects)
                          loadSubjectsForClass(selectedClassId).catch((e) => console.error(e));
                        }}
                        className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400"
                        type="button"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="col-span-6 mt-1 text-sm">
                      {sub.status === "saving" && <span>Saving...</span>}
                      {sub.status === "success" && <span className="text-green-500">Saved ✓</span>}
                      {sub.status === "error" && <span className="text-red-400">Error: {sub.error ?? "Failed to save"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Tip: Teachers for the class are derived from the global teacher list by matching teacher.assignedProgram / assignedBranch /
        assignedYear / assignedSection to the selected class metadata. If your backend populates those assigned fields for teachers this will
        return only relevant teachers; otherwise it falls back to the full teacher list.
      </div>
    </div>
  );
};

export default AssignTeachersContent;
