// src/components/admin/StudentsContent.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import api from "@/lib/api";
import { JSX } from "react/jsx-runtime";

type StudentRow = {
  id?: string | number;
  name: string;
  email?: string;
  roll?: string | number;
  group?: string | null;
  program?: string | null;
  year?: string | number | null;
  branch?: string | null;
  className?: string | null;
};

export default function StudentsContent(): JSX.Element {
  // dropdown collections
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // selections
  const [selectedProgramName, setSelectedProgramName] = useState<string | "">("");
  const [selectedYearId, setSelectedYearId] = useState<number | "">("");
  const [selectedBranch, setSelectedBranch] = useState<string | "">("");
  const [selectedClass, setSelectedClass] = useState<string | number | "">("");

  // students
  const [students, setStudents] = useState<StudentRow[]>([]);

  // loading & error
  const [loading, setLoading] = useState({
    programs: false,
    years: false,
    branches: false,
    classes: false,
    students: false,
  });
  const [error, setError] = useState<string | null>(null);

  // pagination & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // ---------- Load Programs ----------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading((s) => ({ ...s, programs: true }));
        const res = await fetchPrograms();
        setPrograms(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchPrograms err:", err);
        setError("Failed to load programs");
      } finally {
        setLoading((s) => ({ ...s, programs: false }));
      }
    };
    load();
  }, []);

  // ---------- Load Years when program changes ----------
  useEffect(() => {
    setYears([]);
    setBranches([]);
    setClasses([]);
    setSelectedYearId("");
    setSelectedBranch("");
    setSelectedClass("");
    if (!selectedProgramName) return;

    const load = async () => {
      try {
        setLoading((s) => ({ ...s, years: true }));
        const res = await fetchYearsByProgramName(selectedProgramName as string);
        setYears(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchYearsByProgramName err:", err);
        setError("Failed to load years");
      } finally {
        setLoading((s) => ({ ...s, years: false }));
      }
    };
    load();
  }, [selectedProgramName]);

  // ---------- Load Branches when year changes ----------
  useEffect(() => {
    setBranches([]);
    setClasses([]);
    setSelectedBranch("");
    setSelectedClass("");
    if (!selectedYearId) return;

    const load = async () => {
      try {
        setLoading((s) => ({ ...s, branches: true }));
        const res = await fetchBranchesByAcademicYear(Number(selectedYearId));
        setBranches(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchBranchesByAcademicYear err:", err);
        setError("Failed to load branches");
      } finally {
        setLoading((s) => ({ ...s, branches: false }));
      }
    };
    load();
  }, [selectedYearId]);

  // ---------- Load Classes when branch/program/year change ----------
  useEffect(() => {
    setClasses([]);
    setSelectedClass("");
    if (!selectedProgramName || !selectedYearId || !selectedBranch) return;

    const load = async () => {
      try {
        setLoading((s) => ({ ...s, classes: true }));
        const yearObj = years.find((y: any) => y.id === selectedYearId);
        const yearNumber = yearObj?.number ?? selectedYearId;
        const res = await fetchClassesByBranch(selectedProgramName as string, Number(yearNumber), selectedBranch as string);
        setClasses(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchClassesByBranch err:", err);
        setError("Failed to load classes");
      } finally {
        setLoading((s) => ({ ...s, classes: false }));
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramName, selectedYearId, selectedBranch, years]);

  // ---------- Helper: resolve classId ----------
  const resolveClassId = useCallback((): number | null => {
    if (!selectedClass) return null;
    const byId = classes.find((c: any) => String(c.id) === String(selectedClass));
    const byName = classes.find(
      (c: any) =>
        (c.name && String(c.name) === String(selectedClass)) ||
        (c.className && String(c.className) === String(selectedClass))
    );
    const obj = byId ?? byName;
    const id = Number(obj?.id ?? selectedClass);
    return !id || Number.isNaN(id) ? null : id;
  }, [classes, selectedClass]);

  // ---------- map raw student to StudentRow (normalizer) ----------
  const normalizeStudent = (s: any): StudentRow => {
    const program =
      s.programName ??
      s.program ??
      (s.programObj && (s.programObj.name ?? s.programObj.title)) ??
      null;
    const year =
      s.year ??
      s.academicYear ??
      s.yearNumber ??
      (s.yearObj && (s.yearObj.number ?? s.yearObj.label)) ??
      null;
    const branch =
      s.branchName ??
      s.branch ??
      (s.branchObj && (s.branchObj.name ?? s.branchObj.branchName)) ??
      null;
    const className =
      s.className ??
      s.class ??
      s.classLabel ??
      (s.classObj && (s.classObj.name ?? s.classObj.label)) ??
      null;

    return {
      id: s.id ?? s._id ?? s.studentId,
      name: String(s.name ?? s.fullName ?? s.firstName ?? ""),
      email: s.email ?? s.contactEmail ?? "",
      roll: s.enrollmentNumber ?? s.rollNo ?? s.roll ?? "",
      group: s.groupName ?? s.group ?? s.electiveGroup ?? null,
      program: program ? String(program) : null,
      year: year ?? null,
      branch: branch ? String(branch) : null,
      className: className ? String(className) : null,
    };
  };

  // ---------- Load students for the selected class ----------
  const loadStudentsForClass = useCallback(async () => {
    setError(null);
    const classId = resolveClassId();
    if (!classId) {
      setError("Please select a valid class first (or use 'Load All Students').");
      return;
    }

    try {
      setLoading((s) => ({ ...s, students: true }));
      const res = await api.get(`/students?classId=${classId}`);
      const raw = res?.data ?? [];
      const arr: StudentRow[] = Array.isArray(raw) ? raw.map(normalizeStudent) : [];
      setStudents(arr);
      setPage(1);
    } catch (err) {
      console.error("loadStudentsForClass err:", err);
      setError("Failed to load students for this class.");
    } finally {
      setLoading((s) => ({ ...s, students: false }));
    }
  }, [resolveClassId]);

  // ---------- Load ALL students (global) ----------
  const loadAllStudents = useCallback(async () => {
    setError(null);
    try {
      setLoading((s) => ({ ...s, students: true }));
      const res = await api.get(`/students`);
      const raw = res?.data ?? [];
      const arr: StudentRow[] = Array.isArray(raw) ? raw.map(normalizeStudent) : [];
      setStudents(arr);
      // clear filters/selections since we are showing all students
      setSelectedProgramName("");
      setSelectedYearId("");
      setSelectedBranch("");
      setSelectedClass("");
      setPage(1);
    } catch (err) {
      console.error("loadAllStudents err:", err);
      setError("Failed to load all students.");
    } finally {
      setLoading((s) => ({ ...s, students: false }));
    }
  }, []);

  // ---------- filteredStudents (global search includes program/year/branch/class) ----------
  const filteredStudents = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        String(s.roll ?? "").toLowerCase().includes(q) ||
        (s.group ?? "").toLowerCase().includes(q) ||
        (s.program ?? "").toLowerCase().includes(q) ||
        String(s.year ?? "").toLowerCase().includes(q) ||
        (s.branch ?? "").toLowerCase().includes(q) ||
        (s.className ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  // ---------- CSV export (include new fields) ----------
  const exportCsv = () => {
    const header = ["Name", "Email", "Roll", "Group", "Program", "Year", "Branch", "Class"];
    const rows = [
      header,
      ...filteredStudents.map((s) => [
        s.name,
        s.email ?? "",
        s.roll ?? "",
        s.group ?? "",
        s.program ?? "",
        s.year ?? "",
        s.branch ?? "",
        s.className ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const classIdOrAll = resolveClassId() ?? "all";
    a.href = url;
    a.download = `students_${classIdOrAll}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Optionally: load all students on mount
  // useEffect(() => { loadAllStudents(); }, [loadAllStudents]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <div className="text-sm text-gray-500 mt-1">View all students or by class. Use the search box to find students.</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 bg-white border rounded text-sm"
            onClick={() => {
              setSelectedProgramName("");
              setSelectedYearId("");
              setSelectedBranch("");
              setSelectedClass("");
              setStudents([]);
              setSearchQuery("");
              setPage(1);
              setError(null);
            }}
          >
            Reset
          </button>

          <button
            className="px-3 py-2 bg-indigo-600 text-white rounded text-sm"
            onClick={loadAllStudents}
            disabled={loading.students}
          >
            {loading.students ? "Loading…" : "Load All Students"}
          </button>

          <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" onClick={exportCsv} disabled={students.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel: filters */}
        <aside className="lg:col-span-3 bg-white border rounded-lg p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-2">Filters (optional)</h2>

            {/* Program */}
            <div className="mb-2">
              <label className="block text-xs text-gray-600">Program</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedProgramName}
                onChange={(e) => setSelectedProgramName(e.target.value || "")}
              >
                <option value="">Select program</option>
                {Array.isArray(programs) &&
                  programs.map((p: any) => (
                    <option key={p.id ?? p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Year */}
            <div className="mb-2">
              <label className="block text-xs text-gray-600">Year</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedProgramName}
              >
                <option value="">Select year</option>
                {Array.isArray(years) &&
                  years.map((y: any) => (
                    <option key={y.id ?? y.number} value={y.id}>
                      {y.number ?? y.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Branch */}
            <div className="mb-2">
              <label className="block text-xs text-gray-600">Branch</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value || "")}
                disabled={!selectedYearId}
              >
                <option value="">Select branch</option>
                {Array.isArray(branches) &&
                  branches.map((b: any) => (
                    <option key={b.id ?? b.name} value={b.name ?? b.id}>
                      {b.name ?? b.branchName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Class */}
            <div className="mb-2">
              <label className="block text-xs text-gray-600">Class</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value || "")}
                disabled={!selectedBranch}
              >
                <option value="">Select class</option>
                {Array.isArray(classes) &&
                  classes.map((c: any) => (
                    <option key={c.id ?? c.name} value={c.id ?? c.name}>
                      {c.name ?? c.className ?? c.label ?? c.id}
                    </option>
                  ))}
              </select>
            </div>

            {/* Load students for selected class */}
            <div className="mt-2 space-y-2">
              <button
                className="w-full bg-indigo-600 text-white py-2 rounded"
                onClick={loadStudentsForClass}
                disabled={loading.students}
              >
                {loading.students ? "Loading..." : "Load Students for Class"}
              </button>

              <div className="text-xs text-gray-500">
                Tip: Click <strong>Load All Students</strong> in the header to ignore these filters and fetch everyone.
              </div>
            </div>

            {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
          </div>
        </aside>

        {/* Right: Students table */}
        <main className="lg:col-span-9 space-y-4">
          <div className="bg-white border rounded overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-medium">Students List</div>

              <div className="flex items-center gap-3">
                <input
                  placeholder="Search name, email, roll, program, branch, class..."
                  className="border rounded p-2 text-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />

                <div className="text-sm text-gray-600">{filteredStudents.length} students</div>

                <div className="text-sm text-gray-600">Rows</div>
                <select
                  className="border rounded p-1"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Roll</th>
                    <th className="px-4 py-3 text-left">Group</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Year</th>
                    <th className="px-4 py-3 text-left">Branch</th>
                    <th className="px-4 py-3 text-left">Class</th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-500">
                        {loading.students ? "Loading..." : "No students found"}
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((s, i) => (
                      <tr key={s.id ?? `${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">{s.email ?? "-"}</td>
                        <td className="px-4 py-3">{s.roll ?? "-"}</td>
                        <td className="px-4 py-3">{s.group ?? "-"}</td>
                        <td className="px-4 py-3">{s.program ?? "-"}</td>
                        <td className="px-4 py-3">{s.year ?? "-"}</td>
                        <td className="px-4 py-3">{s.branch ?? "-"}</td>
                        <td className="px-4 py-3">{s.className ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {filteredStudents.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(filteredStudents.length, page * pageSize)} of {filteredStudents.length}
              </span>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>

                <div className="px-3 py-1 text-sm">Page {page} / {totalPages}</div>

                <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
