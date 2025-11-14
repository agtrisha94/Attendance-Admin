"use client";

import React, { useEffect, useState } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";

/**
 * Final AttendanceContent (Program -> Year -> Branch -> Class)
 */

export default function AttendanceContent() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [loading, setLoading] = useState({
    programs: false,
    years: false,
    branches: false,
    classes: false,
  });

  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    setYears([]);
    setSelectedYearId(null);
    setBranches([]);
    setSelectedBranch(null);
    setClasses([]);
    setSelectedClass(null);
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

  useEffect(() => {
    setBranches([]);
    setSelectedBranch(null);
    setClasses([]);
    setSelectedClass(null);
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

  useEffect(() => {
    setClasses([]);
    setSelectedClass(null);
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

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Attendance Dashboard</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <option key={c.id ?? c.name} value={c.name ?? c.id}>
                {c.name ?? c.className ?? c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 text-gray-700">
        Selected: {selectedProgramName ?? "-"} / {years.find((y) => y.id === selectedYearId)?.number ?? "-"} /{" "}
        {selectedBranch ?? "-"} / {selectedClass ?? "-"}
      </div>

      <button
        className="mt-4 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        disabled={!selectedProgramName || !selectedYearId || !selectedBranch || !selectedClass}
        onClick={() =>
          console.log("Load attendance →", {
            program: selectedProgramName,
            yearNumber: years.find((y) => y.id === selectedYearId)?.number,
            branch: selectedBranch,
            className: selectedClass,
          })
        }
      >
        Load Attendance
      </button>
    </div>
  );
}
