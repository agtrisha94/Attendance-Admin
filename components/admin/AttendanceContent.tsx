"use client";

import React, { useEffect, useState } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import { fetchAttendanceForClass, AttendanceRecord } from "@/services/attendance.service";
import { fetchUsersByIds, UserLite } from "@/services/user.service";

export default function AttendanceContent() {
  // --- selection state ---
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // --- loading / error ---
  const [loading, setLoading] = useState({
    programs: false,
    years: false,
    branches: false,
    classes: false,
    attendance: false,
    users: false,
  });

  const [error, setError] = useState<string | null>(null);

  // --- attendance + user map ---
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<Map<string, UserLite>>(new Map());

  // --- load programs once ---
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

  // --- when program changes, reset downstream and load years ---
  useEffect(() => {
    setYears([]);
    setSelectedYearId(null);
    setBranches([]);
    setSelectedBranch(null);
    setClasses([]);
    setSelectedClass(null);
    setAttendance([]);
    setUserMap(new Map());
    setError(null);

    if (!selectedProgramName) return;

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
  }, [selectedProgramName]);

  // --- when year changes, reset downstream and load branches ---
  useEffect(() => {
    setBranches([]);
    setSelectedBranch(null);
    setClasses([]);
    setSelectedClass(null);
    setAttendance([]);
    setUserMap(new Map());
    setError(null);

    if (!selectedYearId) return;

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
  }, [selectedYearId]);

  // --- when branch changes, reset classes and load classes ---
  useEffect(() => {
    setClasses([]);
    setSelectedClass(null);
    setAttendance([]);
    setUserMap(new Map());
    setError(null);

    if (!selectedProgramName || !selectedYearId || !selectedBranch) return;

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
  }, [selectedProgramName, selectedYearId, selectedBranch, years]);

  // --- helper to resolve a human name given id or relation object ---
  const readableName = (id?: string, relation?: { name?: string; firstName?: string; lastName?: string }) => {
    if (!id && !relation) return "-";
    // Prefer relation if backend included it
    if (relation) {
      if (relation.name) return relation.name;
      const combined = `${relation.firstName ?? ""} ${relation.lastName ?? ""}`.trim();
      if (combined) return combined;
    }
    // Then check fetched user map
    if (id && userMap.has(id)) {
      const u = userMap.get(id)!;
      if (u.name) return u.name;
      const combined = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      if (combined) return combined;
    }
    // Fallback to id if nothing else
    return id ?? "-";
  };

  // --- load attendance and then resolve user names ---
  const loadAttendance = async () => {
    setError(null);
    setAttendance([]);
    setUserMap(new Map());

    try {
      if (!selectedClass) {
        setError("Please select a class first.");
        return;
      }

      // Resolve classId (selectedClass may be id or name)
      const selectedClassObj = classes.find(
        (c) => String(c.id) === String(selectedClass) || c.name === selectedClass || c.className === selectedClass
      );
      const classId = Number(selectedClassObj?.id ?? selectedClass);

      if (!classId || Number.isNaN(classId)) {
        setError("Could not determine classId. Ensure class objects include an 'id' field.");
        return;
      }

      setLoading((s) => ({ ...s, attendance: true }));
      const records = await fetchAttendanceForClass(classId);
      setAttendance(Array.isArray(records) ? records : []);

      // Collect unique user ids
      const ids = new Set<string>();
      (records || []).forEach((r) => {
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

  // --- clear attendance and users ---
  const clearAttendance = () => {
    setAttendance([]);
    setUserMap(new Map());
    setError(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Attendance Dashboard</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Program */}
        <div>
          <label className="block text-sm font-medium">Program</label>
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

        {/* Year */}
        <div>
          <label className="block text-sm font-medium">Year</label>
          <select
            className="mt-1 block w-full border rounded p-2"
            value={selectedYearId ?? ""}
            onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedProgramName}
          >
            <option value="">Select year</option>
            {years.map((y: any) => (
              <option key={y.id} value={y.id}>
                Year {y.number}
              </option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium">Branch</label>
          <select
            className="mt-1 block w-full border rounded p-2"
            value={selectedBranch ?? ""}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            disabled={!selectedYearId || loading.branches}
          >
            <option value="">Select branch</option>
            {branches.map((b: any) => (
              <option key={b.id ?? b.name} value={b.name ?? b.id}>
                {b.name ?? b.branchName ?? b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium">Class</label>
          <select
            className="mt-1 block w-full border rounded p-2"
            value={selectedClass ?? ""}
            onChange={(e) => setSelectedClass(e.target.value || null)}
            disabled={!selectedBranch || loading.classes}
          >
            <option value="">Select class</option>
            {classes.map((c: any) => (
              <option key={c.id ?? c.name} value={c.id ?? c.name}>
                {c.name ?? c.className ?? c.label ?? c.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 text-gray-700">
        Selected: {selectedProgramName ?? "-"} / {years.find((y) => y.id === selectedYearId)?.number ?? "-"} /{" "}
        {selectedBranch ?? "-"} / {selectedClass ?? "-"}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!selectedProgramName || !selectedYearId || !selectedBranch || !selectedClass || loading.attendance}
          onClick={loadAttendance}
        >
          {loading.attendance || loading.users ? "Loading…" : "Load Attendance"}
        </button>

        <button className="px-4 py-2 rounded bg-gray-200" onClick={clearAttendance}>
          Clear
        </button>
      </div>

      {/* Attendance table */}
      <div className="mt-6">
        {loading.attendance && <div>Fetching attendance...</div>}

        {!loading.attendance && attendance.length === 0 && <div className="text-sm text-gray-500">No attendance records loaded.</div>}

        {attendance.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="border px-2 py-1">Student</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Status</th>
                  <th className="border px-2 py-1">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r) => (
                  <tr key={r.id}>
                    <td className="border px-2 py-1">{readableName(r.studentId, (r as any).student)}</td>
                    <td className="border px-2 py-1">{new Date(r.date).toLocaleString()}</td>
                    <td className="border px-2 py-1">{r.status}</td>
                    <td className="border px-2 py-1">{readableName(r.markedById, (r as any).markedBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
