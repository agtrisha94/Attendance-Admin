"use client";
import React, { useEffect } from "react";
import { useAcademicData } from "@/hooks/useAcademicData"; 
import type { Program, Year, Branch, Class } from "@/type";

type Selection = {
  program?: Program | null;
  year?: Year | null;
  branch?: Branch | null;
  class?: Class | null;
};

type Props = {
  onChange?: (selection: Selection) => void;
  // optional initial preselect values (names/numbers)
  initialProgramName?: string;
  initialYearNumber?: string;
  initialBranchName?: string;
  initialClassName?: string;
};

const AcademicFilterOnly: React.FC<Props> = ({
  onChange,
  initialProgramName,
  initialYearNumber,
  initialBranchName,
  initialClassName,
}) => {
  const {
    programs,
    years,
    branches,
    classes,
    selectedProgram,
    selectedYear,
    selectedBranch,
    selectedClass,
    loading,
    error,
    loadPrograms,
    handleProgramSelect,
    handleYearSelect,
    handleBranchSelect,
    handleClassSelect,
    resetAll,
  } = useAcademicData();

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    onChange?.({
      program: selectedProgram,
      year: selectedYear,
      branch: selectedBranch,
      class: selectedClass,
    });
  }, [selectedProgram, selectedYear, selectedBranch, selectedClass, onChange]);

  // best-effort initial preselects (calls handlers which now support empty -> clear)
  useEffect(() => {
    if (initialProgramName) handleProgramSelect(initialProgramName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProgramName, programs]);

  useEffect(() => {
    if (initialYearNumber) handleYearSelect(initialYearNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialYearNumber, years]);

  useEffect(() => {
    if (initialBranchName) handleBranchSelect(initialBranchName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBranchName, branches]);

  useEffect(() => {
    if (initialClassName) handleClassSelect(initialClassName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassName, classes]);

  return (
    <div className="p-4 bg-white rounded shadow dark:bg-gray-800 dark:text-gray-100">
      <h4 className="text-lg font-medium mb-3">Academic Filter</h4>

      {error && <div className="mb-2 text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Program</label>
          <select
            value={selectedProgram?.name ?? ""}
            onChange={(e) => handleProgramSelect(e.target.value)}
            disabled={loading.programs}
            className="w-full rounded p-2 bg-white dark:bg-gray-900"
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id ?? p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Year</label>
          <select
            value={selectedYear?.number.toString() ?? ""}
            onChange={(e) => handleYearSelect(e.target.value)}
            disabled={!selectedProgram || loading.years}
            className="w-full rounded p-2 bg-white dark:bg-gray-900"
          >
            <option value="">All Years</option>
            {years.map((y) => <option key={y.id ?? y.number} value={y.number}>{y.number}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Branch</label>
          <select
            value={selectedBranch?.name ?? ""}
            onChange={(e) => handleBranchSelect(e.target.value)}
            disabled={!selectedYear || loading.branches}
            className="w-full rounded p-2 bg-white dark:bg-gray-900"
          >
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b.id ?? b.name} value={b.name}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Class</label>
          <select
            value={selectedClass?.name ?? ""}
            onChange={(e) => handleClassSelect(e.target.value)}
            disabled={!selectedBranch || loading.classes}
            className="w-full rounded p-2 bg-white dark:bg-gray-900"
          >
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id ?? c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => resetAll()}
          className="py-2 px-3 bg-gray-200 rounded text-sm dark:bg-gray-600"
        >
          Reset
        </button>

        <div className="text-sm text-gray-600">
          {selectedProgram ? selectedProgram.name : "Program: all"} · {selectedYear ? String(selectedYear.number) : "Year: all"} · {selectedBranch ? selectedBranch.name : "Branch: all"} · {selectedClass ? selectedClass.name : "Class: all"}
        </div>
      </div>
    </div>
  );
};

export default AcademicFilterOnly;
