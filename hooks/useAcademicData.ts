// hooks/useacademicdat.ts
import { useState, useCallback } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { Program, Year, Branch, Class, BranchWithClasses, SelectionLevel } from "@/type";
export const useAcademicData = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allClassesByBranch, setAllClassesByBranch] = useState<BranchWithClasses[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [loading, setLoading] = useState({
    programs: true,
    years: false,
    branches: false,
    classes: false,
  });
  const [error, setError] = useState<string | null>(null);

  const resetSelectionsBelow = useCallback((level: SelectionLevel) => {
    if (level === "program") {
      setSelectedYear(null);
      setYears([]);
    }
    if (level === "program" || level === "year") {
      setSelectedBranch(null);
      setBranches([]);
    }
    if (level === "program" || level === "year" || level === "branch") {
      setSelectedClass(null);
      setClasses([]);
      setAllClassesByBranch([]);
    }
  }, []);

  // resets every selection
  const resetAll = useCallback(() => {
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedBranch(null);
    setSelectedClass(null);
    setYears([]);
    setBranches([]);
    setClasses([]);
    setAllClassesByBranch([]);
    setError(null);
  }, []);

  const loadPrograms = useCallback(async () => {
    try {
      setError(null);
      setLoading((prev) => ({ ...prev, programs: true }));
      const data = await fetchPrograms();
      setPrograms(data);
    } catch (err) {
      console.error("Failed to fetch programs", err);
      setError("Failed to load programs. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, programs: false }));
    }
  }, []);

  const handleProgramSelect = useCallback(
    async (programName: string) => {
      // allow clearing by passing empty string
      if (!programName) {
        setSelectedProgram(null);
        resetSelectionsBelow("program");
        setYears([]);
        return;
      }

      const program = programs.find((p) => p.name === programName);
      if (!program) return;

      setSelectedProgram(program);
      resetSelectionsBelow("program");
      setError(null);

      try {
        setLoading((prev) => ({ ...prev, years: true }));
        const yearData = await fetchYearsByProgramName(program.name);
        setYears(yearData);
      } catch (err) {
        console.error("Failed to fetch years", err);
        setError("Failed to load years for this program.");
      } finally {
        setLoading((prev) => ({ ...prev, years: false }));
      }
    },
    [programs, resetSelectionsBelow]
  );

  const handleYearSelect = useCallback(
    async (yearNumber: string) => {
      if (!yearNumber) {
        setSelectedYear(null);
        resetSelectionsBelow("year");
        setBranches([]);
        return;
      }

      const year = years.find((y) => y.number.toString() === yearNumber);
      if (!year) return;

      setSelectedYear(year);
      resetSelectionsBelow("year");
      setError(null);

      try {
        setLoading((prev) => ({ ...prev, branches: true }));
        const branchData = await fetchBranchesByAcademicYear(year.number);
        setBranches(branchData);
      } catch (err) {
        console.error("Failed to fetch branches", err);
        setError("Failed to load branches for this year.");
      } finally {
        setLoading((prev) => ({ ...prev, branches: false }));
      }
    },
    [years, resetSelectionsBelow]
  );

  const handleBranchSelect = useCallback(
    async (branchName: string) => {
      if (!branchName) {
        setSelectedBranch(null);
        resetSelectionsBelow("branch");
        setClasses([]);
        setAllClassesByBranch([]);
        return;
      }

      const branch = branches.find((b) => b.name === branchName);
      if (!branch) return;

      setSelectedBranch(branch);
      resetSelectionsBelow("branch");
      setError(null);

      if (!selectedProgram || !selectedYear || !branch) return;

      try {
        setLoading((prev) => ({ ...prev, classes: true }));
        const classData = await fetchClassesByBranch(
          selectedProgram.name,
          selectedYear.number,
          branch.name
        );
        setClasses(classData);
      } catch (err) {
        console.error("Failed to fetch classes", err);
        setError("Failed to load classes for this branch.");
      } finally {
        setLoading((prev) => ({ ...prev, classes: false }));
      }
    },
    [branches, selectedProgram, selectedYear, resetSelectionsBelow]
  );

  const handleClassSelect = useCallback(
    (className: string) => {
      if (!className) {
        setSelectedClass(null);
        return;
      }
      const cls = classes.find((c) => c.name === className);
      if (cls) {
        setSelectedClass(cls);
      }
    },
    [classes]
  );

  return {
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
  };
};
