"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import { fetchAttendanceForClass, AttendanceRecord } from "@/services/attendance.service";
import { fetchUsersByIds, UserLite } from "@/services/user.service";

/**
 * Dashboard-style AttendanceContent
 * - Left filter panel
 * - Right content: summary cards + table
 * - Persist filters to sessionStorage so switching tabs doesn't reset them
 * - Avoid clearing dependents on initial mount using prev refs
 */

const STORAGE_KEY = "attendance.filters.v1";

type PersistedState = {
  selectedProgramName: string | null;
  selectedYearId: number | null;
  selectedBranch: string | null;
  selectedClass: string | null;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  pageSize: number;
  page: number;
};

const defaultPersist: PersistedState = {
  selectedProgramName: null,
  selectedYearId: null,
  selectedBranch: null,
  selectedClass: null,
  dateFrom: "",
  dateTo: "",
  searchQuery: "",
  pageSize: 10,
  page: 1,
};

export default function AttendanceContent() {
  // Selections
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // --- persisted selections (init from sessionStorage) ---
  const loadPersist = (): PersistedState => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultPersist;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return { ...defaultPersist, ...parsed };
    } catch (e) {
      console.warn("Failed to load persisted attendance filters:", e);
      return defaultPersist;
    }
  };

  const initial = typeof window !== "undefined" ? loadPersist() : defaultPersist;

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(initial.selectedProgramName);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(initial.selectedYearId);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(initial.selectedBranch);
  const [selectedClass, setSelectedClass] = useState<string | null>(initial.selectedClass);

  // Filters & UI
  const [dateFrom, setDateFrom] = useState<string | "">(initial.dateFrom);
  const [dateTo, setDateTo] = useState<string | "">(initial.dateTo);
  const [searchQuery, setSearchQuery] = useState<string>(initial.searchQuery);

  const [loading, setLoading] = useState({
    programs: false,
    years: false,
    branches: false,
    classes: false,
    attendance: false,
    users: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Attendance + users
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<Map<string, UserLite>>(new Map());

  // Pagination (small)
  const [pageSize, setPageSize] = useState<number>(initial.pageSize);
  const [page, setPage] = useState<number>(initial.page);

  // --- refs to detect real changes (prevent clearing on initial mount) ---
  const prevProgramRef = useRef<string | null | undefined>(undefined);
  const prevYearRef = useRef<number | null | undefined>(undefined);
  const prevBranchRef = useRef<string | null | undefined>(undefined);

  // Persist filters whenever important bits change
  useEffect(() => {
    const p: PersistedState = {
      selectedProgramName,
      selectedYearId,
      selectedBranch,
      selectedClass,
      dateFrom,
      dateTo,
      searchQuery,
      pageSize,
      page,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (e) {
      console.warn("Failed to persist attendance filters:", e);
    }
  }, [selectedProgramName, selectedYearId, selectedBranch, selectedClass, dateFrom, dateTo, searchQuery, pageSize, page]);

  // --- load programs ---
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading((s) => ({ ...s, programs: true }));
        const data = await fetchPrograms();
        setPrograms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("loadPrograms err:", err);
        setError("Failed to load programs");
      } finally {
        setLoading((s) => ({ ...s, programs: false }));
      }
    };
    loadPrograms();
  }, []);

  // dependent loads: Program -> Years
  useEffect(() => {
    const prev = prevProgramRef.current;
    // only clear dependents when program actually changed after mount
    if (prev !== undefined && prev !== selectedProgramName) {
      setYears([]);
      setSelectedYearId(null);
      setBranches([]);
      setSelectedBranch(null);
      setClasses([]);
      setSelectedClass(null);
      setAttendance([]);
      setUserMap(new Map());
      setError(null);
    }

    if (!selectedProgramName) {
      prevProgramRef.current = selectedProgramName;
      return;
    }

    const loadYears = async () => {
      try {
        setLoading((s) => ({ ...s, years: true }));
        const res = await fetchYearsByProgramName(selectedProgramName);
        setYears(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("loadYears err:", err);
        setError("Failed to load years");
      } finally {
        setLoading((s) => ({ ...s, years: false }));
      }
    };

    loadYears();
    prevProgramRef.current = selectedProgramName;
  }, [selectedProgramName]);

  // dependent loads: Year -> Branches
  useEffect(() => {
    const prev = prevYearRef.current;
    // only clear dependents when year actually changed after mount
    if (prev !== undefined && prev !== selectedYearId) {
      setBranches([]);
      setSelectedBranch(null);
      setClasses([]);
      setSelectedClass(null);
      setAttendance([]);
      setUserMap(new Map());
      setError(null);
    }

    if (!selectedYearId) {
      prevYearRef.current = selectedYearId;
      return;
    }

    const loadBranches = async () => {
      try {
        setLoading((s) => ({ ...s, branches: true }));
        const res = await fetchBranchesByAcademicYear(selectedYearId);
        setBranches(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("loadBranches err:", err);
        setError("Failed to load branches");
      } finally {
        setLoading((s) => ({ ...s, branches: false }));
      }
    };

    loadBranches();
    prevYearRef.current = selectedYearId;
  }, [selectedYearId]);

  // dependent loads: Branch -> Classes
  useEffect(() => {
    const prev = prevBranchRef.current;
    // only clear classes when branch actually changed after mount
    if (prev !== undefined && prev !== selectedBranch) {
      setClasses([]);
      setSelectedClass(null);
      setAttendance([]);
      setUserMap(new Map());
      setError(null);
    }

    if (!selectedProgramName || !selectedYearId || !selectedBranch) {
      prevBranchRef.current = selectedBranch;
      return;
    }

    const loadClasses = async () => {
      try {
        setLoading((s) => ({ ...s, classes: true }));
        const yearObj = years.find((y) => y.id === selectedYearId);
        const yearNumber = yearObj?.number;
        const res = await fetchClassesByBranch(selectedProgramName, Number(yearNumber), selectedBranch);
        setClasses(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("loadClasses err:", err);
        setError("Failed to load classes");
      } finally {
        setLoading((s) => ({ ...s, classes: false }));
      }
    };

    loadClasses();
    prevBranchRef.current = selectedBranch;
  }, [selectedProgramName, selectedYearId, selectedBranch, years]);

  // name resolver helper
  const readableName = (id?: string, relation?: { name?: string; firstName?: string; lastName?: string }) => {
    if (!id && !relation) return "-";
    if (relation) {
      if (relation.name) return relation.name;
      const combined = `${relation.firstName ?? ""} ${relation.lastName ?? ""}`.trim();
      if (combined) return combined;
    }
    if (id && userMap.has(id)) {
      const u = userMap.get(id)!;
      if (u.name) return u.name;
      const combined = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      if (combined) return combined;
    }
    return id ?? "-";
  };

  // load attendance
  const loadAttendance = async () => {
    setError(null);
    setAttendance([]);
    setUserMap(new Map());
    setPage(1);

    try {
      if (!selectedClass) {
        setError("Please select a class first.");
        return;
      }

      const selectedClassObj = classes.find(
        (c) => String(c.id) === String(selectedClass) || c.name === selectedClass || c.className === selectedClass
      );
      const classId = Number(selectedClassObj?.id ?? selectedClass);

      if (!classId || Number.isNaN(classId)) {
        setError("Could not determine classId.");
        return;
      }

      setLoading((s) => ({ ...s, attendance: true }));
      const records = await fetchAttendanceForClass(classId);
      const recs = Array.isArray(records) ? records : [];
      setAttendance(recs);

      const ids = new Set<string>();
      recs.forEach((r) => {
        if (r.studentId) ids.add(r.studentId);
        if (r.markedById) ids.add(r.markedById);
        if ((r as any).student?.id) ids.add((r as any).student.id);
        if ((r as any).markedBy?.id) ids.add((r as any).markedBy.id);
      });

      const idArray = Array.from(ids);
      if (idArray.length > 0) {
        setLoading((s) => ({ ...s, users: true }));
        const users = await fetchUsersByIds(idArray);
        const map = new Map<string, UserLite>(users.map((u) => [u.id, u]));
        setUserMap(map);
      }
    } catch (err) {
      console.error("loadAttendance err:", err);
      setError("Failed to load attendance or user details");
    } finally {
      setLoading((s) => ({ ...s, attendance: false, users: false }));
    }
  };

  // filtering & pagination
  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    const q = (searchQuery || "").trim().toLowerCase();

    return attendance.filter((r) => {
      const d = new Date(r.date);
      if (from && d < from) return false;
      if (to && d > new Date(new Date(to).setHours(23, 59, 59, 999))) return false;

      if (!q) return true;

      const studentName = readableName(r.studentId, (r as any).student).toLowerCase();
      const markedName = readableName(r.markedById, (r as any).markedBy).toLowerCase();
      const studentId = (r.studentId ?? "").toLowerCase();
      const markedById = (r.markedById ?? "").toLowerCase();
      const status = (r.status ?? "").toLowerCase();

      return (
        studentName.includes(q) ||
        markedName.includes(q) ||
        studentId.includes(q) ||
        markedById.includes(q) ||
        status.includes(q)
      );
    });
  }, [attendance, dateFrom, dateTo, searchQuery, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => (r.status ?? "").toUpperCase() === "PRESENT").length;
    const absent = filtered.filter((r) => (r.status ?? "").toUpperCase() === "ABSENT").length;
    return { total, present, absent };
  }, [filtered]);

  // csv export (current filtered)
  const exportCsv = () => {
    const rows = [
      ["Student", "Date", "Status", "MarkedBy", "StudentId", "MarkedById"],
      ...filtered.map((r) => [
        readableName(r.studentId, (r as any).student),
        new Date(r.date).toLocaleString(),
        r.status ?? "",
        readableName(r.markedById, (r as any).markedBy),
        r.studentId ?? "",
        r.markedById ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // helpers
  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setPage(1);
    // keep selections (program/year/branch/class) intact — if you want to clear everything, also clear those here
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <div className="text-sm text-gray-500 mt-1">Dashboard · Manage and review attendance</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 bg-white border rounded shadow-sm text-sm"
            onClick={() => {
              setAttendance([]);
              setUserMap(new Map());
              setError(null);
            }}
          >
            Reset
          </button>

          <button
            className="px-3 py-2 bg-blue-600 text-white rounded shadow-sm text-sm"
            onClick={exportCsv}
            disabled={attendance.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Filters */}
        <aside className="lg:col-span-3 bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium mb-3">Filters</div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600">Program</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedProgramName ?? ""}
                onChange={(e) => setSelectedProgramName(e.target.value || null)}
              >
                <option value="">Select program</option>
                {loading.programs && <option disabled>Loading...</option>}
                {programs.map((p: any) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Year</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedYearId ?? ""}
                onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedProgramName}
              >
                <option value="">Year</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Branch</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedBranch ?? ""}
                onChange={(e) => setSelectedBranch(e.target.value || null)}
                disabled={!selectedYearId}
              >
                <option value="">Select branch</option>
                {branches.map((b: any) => (
                  <option key={b.id ?? b.name} value={b.name ?? b.id}>
                    {b.name ?? b.branchName ?? b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Class</label>
              <select
                className="mt-1 block w-full border rounded p-2"
                value={selectedClass ?? ""}
                onChange={(e) => setSelectedClass(e.target.value || null)}
                disabled={!selectedBranch}
              >
                <option value="">Select class</option>
                {classes.map((c: any) => (
                  <option key={c.id ?? c.name} value={c.id ?? c.name}>
                    {c.name ?? c.className ?? c.label ?? c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600">From</label>
                <input type="date" className="mt-1 block w-full border rounded p-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600">To</label>
                <input type="date" className="mt-1 block w-full border rounded p-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Search</label>
              <input
                placeholder="Student, teacher or id..."
                className="mt-1 block w-full border rounded p-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded"
                onClick={loadAttendance}
                disabled={!selectedProgramName || !selectedYearId || !selectedBranch || !selectedClass || loading.attendance}
              >
                {loading.attendance ? "Loading…" : "Load Attendance"}
              </button>
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={clearFilters}>
                Clear
              </button>
            </div>

            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          </div>
        </aside>

        {/* Right: Content */}
        <main className="lg:col-span-9 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Total Records</div>
              <div className="text-2xl font-semibold mt-1">{summary.total}</div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Present</div>
              <div className="text-2xl font-semibold mt-1 text-green-600">{summary.present}</div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Absent</div>
              <div className="text-2xl font-semibold mt-1 text-red-600">{summary.absent}</div>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Attendance Records</div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">Rows</div>
                <select className="border rounded p-1" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Marked By</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No records to display</td>
                    </tr>
                  )}

                  {pageItems.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">{readableName(r.studentId, (r as any).student)}</div>
                        <div className="text-xs text-gray-500">{(r as any).student?.enrollmentNumber ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 align-top">{new Date(r.date).toLocaleString()}</td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.status === "PRESENT" ? "bg-green-50 text-green-700" : r.status === "ABSENT" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-800"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">{readableName(r.markedById, (r as any).markedBy)}</td>
                      <td className="px-4 py-3 align-top">{(r as any).subject?.name ?? r.subjectId ?? "-"}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 text-sm bg-blue-50 border rounded"
                            onClick={() => {
                              alert(`Attendance: ${readableName(r.studentId, (r as any).student)} — ${r.status}`);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* footer: pagination */}
            <div className="p-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)} - {Math.min(filtered.length, page * pageSize)} of {filtered.length} records</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <div className="px-3 py-1 text-sm">Page {page} / {totalPages}</div>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                <button className="px-3 py-1 border rounded" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
