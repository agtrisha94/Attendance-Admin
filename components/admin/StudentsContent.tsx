// src/components/admin/StudentsContent.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";
import api from "@/lib/api";
import { JSX } from "react/jsx-runtime";

/**
 * Improved UI version of StudentsContent
 * - modern cards, drag & drop csv upload, progress bar, toasts
 * - retains all previous functionality
 */

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
    manualAdd: false,
    csvUpload: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // pagination & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // UI helpers
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [csvUploadPercent, setCsvUploadPercent] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);

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
        const res = await fetchClassesByBranch(
          selectedProgramName as string,
          Number(yearNumber),
          selectedBranch as string
        );
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
      setToast({ type: "error", text: "Failed to load students for this class." });
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
      setToast({ type: "success", text: `Loaded ${arr.length} students.` });
    } catch (err) {
      console.error("loadAllStudents err:", err);
      setError("Failed to load all students.");
      setToast({ type: "error", text: "Failed to load all students." });
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
    setToast({ type: "success", text: "CSV exported." });
  };

  // ---------- Manual add student form state ----------
  const [manualForm, setManualForm] = useState<StudentRow>({
    name: "",
    email: "",
    roll: "",
    group: null,
    program: "",
    year: "",
    branch: "",
    className: "",
  });

  const resetManualForm = () =>
    setManualForm({
      name: "",
      email: "",
      roll: "",
      group: null,
      program: "",
      year: "",
      branch: "",
      className: "",
    });

  // ---------- Handle manual add ----------
  const handleManualAdd = async () => {
    setError(null);
    setStatusMessage(null);

    if (!manualForm.name || manualForm.name.trim().length === 0) {
      setError("Student name is required.");
      setToast({ type: "error", text: "Student name is required." });
      return;
    }

    try {
      setLoading((s) => ({ ...s, manualAdd: true }));
      // Prepare payload; adapt to backend fields if necessary
      const payload = {
        name: manualForm.name,
        email: manualForm.email || undefined,
        roll: manualForm.roll || undefined,
        group: manualForm.group || undefined,
        program: manualForm.program || undefined,
        year: manualForm.year || undefined,
        branch: manualForm.branch || undefined,
        className: manualForm.className || undefined,
      };

      // Try single create endpoint
      const res = await api.post("/students", payload);
      const created = res?.data ?? payload;
      const normalized = normalizeStudent(created);
      setStudents((s) => [normalized, ...s]);
      resetManualForm();
      setStatusMessage("Student added successfully.");
      setToast({ type: "success", text: "Student added." });
    } catch (err) {
      console.error("handleManualAdd err:", err);
      setError("Failed to add student. Check console for details.");
      setToast({ type: "error", text: "Failed to add student." });
    } finally {
      setLoading((s) => ({ ...s, manualAdd: false }));
      // clear status after a while
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // ---------- CSV Upload: parsing and preview ----------
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<StudentRow[]>([]);
  const [csvRawPreview, setCsvRawPreview] = useState<string[][]>([]);

  // Basic CSV parser that handles quoted fields and commas inside quotes.
  function parseCSV(text: string): string[][] {
    const lines = text.split(/\r\n|\n|\r/).filter((ln) => ln.trim().length > 0);
    const rows: string[][] = [];
    const splitter = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/; // splits on commas not inside quotes
    for (const line of lines) {
      const parts = line.split(splitter).map((p) => {
        let cell = p.trim();
        if (cell.startsWith('"') && cell.endsWith('"')) {
          cell = cell.slice(1, -1).replace(/""/g, '"');
        }
        return cell;
      });
      rows.push(parts);
    }
    return rows;
  }

  const handleCsvFile = (file: File | null) => {
    setError(null);
    setStatusMessage(null);
    setCsvFileName(null);
    setCsvPreviewRows([]);
    setCsvRawPreview([]);
    setCsvFile(null);
    setCsvUploadPercent(0);
    if (!file) return;
    setCsvFile(file);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      try {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError("CSV is empty or couldn't be parsed.");
          setToast({ type: "error", text: "CSV is empty or couldn't be parsed." });
          return;
        }

        // treat first row as header if it looks like a header
        const header = rows[0].map((h) => h.toLowerCase().trim());
        const expected = ["name", "email", "roll", "group", "program", "year", "branch", "class"];
        const hasHeader = expected.some((col) => header.includes(col));

        const dataRows = hasHeader ? rows.slice(1) : rows;

        const mappedRows: StudentRow[] = dataRows.map((r) => {
          // map by position if no header; if header exists, map by header name
          if (hasHeader) {
            const map: any = {};
            for (let i = 0; i < header.length; i++) {
              map[header[i]] = r[i] ?? "";
            }
            return {
              name: map["name"] ?? map["fullName"] ?? map["fullname"] ?? "",
              email: map["email"] ?? "",
              roll: map["roll"] ?? map["enrollment"] ?? "",
              group: map["group"] ?? null,
              program: map["program"] ?? null,
              year: map["year"] ?? null,
              branch: map["branch"] ?? null,
              className: map["class"] ?? map["className"] ?? null,
            } as StudentRow;
          } else {
            // positional: try to map positions: name, email, roll, group, program, year, branch, class
            return {
              name: r[0] ?? "",
              email: r[1] ?? "",
              roll: r[2] ?? "",
              group: r[3] ?? null,
              program: r[4] ?? null,
              year: r[5] ?? null,
              branch: r[6] ?? null,
              className: r[7] ?? null,
            } as StudentRow;
          }
        });

        setCsvRawPreview(rows.slice(0, 8)); // show up to first 8 raw rows
        setCsvPreviewRows(mappedRows.slice(0, 30)); // preview up to 30 parsed student rows
      } catch (err) {
        console.error("CSV parse err:", err);
        setError("Failed to parse CSV. Ensure it's valid CSV and uses commas.");
        setToast({ type: "error", text: "Failed to parse CSV." });
      }
    };
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      setError("Failed to read the CSV file.");
      setToast({ type: "error", text: "Failed to read the CSV file." });
    };
    reader.readAsText(file);
  };

  // drag & drop handlers
  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragActive(false);
    const f = ev.dataTransfer.files?.[0] ?? null;
    if (f && f.type.includes("csv") || f.name.endsWith(".csv")) {
      handleCsvFile(f);
    } else {
      setToast({ type: "error", text: "Please drop a valid CSV file." });
    }
  };
  const handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragActive(false);
  };

  // ---------- CSV upload to server ----------
  const uploadCsvToServer = async (file: File | null) => {
    setError(null);
    setStatusMessage(null);
    setCsvUploadPercent(0);
    if (!file) {
      setError("No CSV file selected.");
      setToast({ type: "error", text: "No CSV file selected." });
      return;
    }

    try {
      setLoading((s) => ({ ...s, csvUpload: true }));
      // parse fully
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError("CSV is empty or couldn't be parsed.");
        setToast({ type: "error", text: "CSV is empty." });
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase().trim());
      const expected = ["name", "email", "roll", "group", "program", "year", "branch", "class"];
      const hasHeader = expected.some((col) => header.includes(col));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const mappedPayload = dataRows.map((r) => {
        if (hasHeader) {
          const map: any = {};
          for (let i = 0; i < header.length; i++) {
            map[header[i]] = r[i] ?? "";
          }
          return {
            name: map["name"] ?? map["fullName"] ?? map["fullname"] ?? "",
            email: map["email"] ?? "",
            roll: map["roll"] ?? map["enrollment"] ?? "",
            group: map["group"] ?? null,
            program: map["program"] ?? null,
            year: map["year"] ?? null,
            branch: map["branch"] ?? null,
            className: map["class"] ?? map["className"] ?? null,
          };
        } else {
          return {
            name: r[0] ?? "",
            email: r[1] ?? "",
            roll: r[2] ?? "",
            group: r[3] ?? null,
            program: r[4] ?? null,
            year: r[5] ?? null,
            branch: r[6] ?? null,
            className: r[7] ?? null,
          };
        }
      });

      // Basic validation: require name
      const bad = mappedPayload.filter((p) => !p.name || String(p.name).trim().length === 0);
      if (bad.length > 0) {
        setError(`CSV contains ${bad.length} row(s) missing a name. Fix CSV and try again.`);
        setToast({ type: "error", text: `CSV has ${bad.length} invalid rows.` });
        return;
      }

      // Try bulk endpoint first; if it fails, fallback to per-item POST
      try {
        // show progress during bulk (fake incremental progress until server responds)
        setCsvUploadPercent(20);
        const res = await api.post("/students/bulk", { students: mappedPayload });
        const created = res?.data ?? mappedPayload;
        const normalized = Array.isArray(created) ? created.map(normalizeStudent) : mappedPayload.map(normalizeStudent);
        setStudents((s) => [...normalized, ...s]);
        setCsvUploadPercent(100);
        setToast({ type: "success", text: `Uploaded ${normalized.length} students.` });
        // clear preview & file
        setCsvFile(null);
        setCsvFileName(null);
        setCsvPreviewRows([]);
        setCsvRawPreview([]);
      } catch (bulkErr) {
        console.warn("bulk upload failed, falling back to single creates:", bulkErr);
        // fallback: post sequentially and update progress
        const createdArr: StudentRow[] = [];
        const total = mappedPayload.length;
        for (let idx = 0; idx < mappedPayload.length; idx++) {
          const payload = mappedPayload[idx];
          try {
            const r = await api.post("/students", payload);
            const created = r?.data ?? payload;
            createdArr.push(normalizeStudent(created));
          } catch (singleErr) {
            console.error("single create failed for", payload, singleErr);
            // continue with next; collect partial results
          } finally {
            // update progress
            setCsvUploadPercent(Math.round(((idx + 1) / total) * 100));
          }
        }
        if (createdArr.length === 0) {
          setError("CSV upload failed (bulk failed and individual creates failed).");
          setToast({ type: "error", text: "CSV upload failed." });
        } else {
          setStudents((s) => [...createdArr, ...s]);
          setToast({ type: "success", text: `Uploaded ${createdArr.length} students (fallback).` });
          setCsvFile(null);
          setCsvFileName(null);
          setCsvPreviewRows([]);
          setCsvRawPreview([]);
        }
      }
    } catch (err) {
      console.error("uploadCsvToServer err:", err);
      setError("Failed to upload CSV. See console for details.");
      setToast({ type: "error", text: "Failed to upload CSV." });
    } finally {
      setLoading((s) => ({ ...s, csvUpload: false }));
      // reset percent after a moment
      setTimeout(() => setCsvUploadPercent(0), 1200);
      setTimeout(() => setToast(null), 3500);
    }
  };

  // ---------- Manual CSV upload trigger helper ----------
  const triggerCsvUpload = () => {
    const file = csvFile;
    uploadCsvToServer(file);
  };

  // ---------- Manual add & CSV states UI helpers ----------
  useEffect(() => {
    if (statusMessage) setToast({ type: "success", text: statusMessage });
    // clear after short while
    if (statusMessage) setTimeout(() => setToast(null), 2500);
  }, [statusMessage]);

  // ---------- JSX UI ----------
  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      <div className="fixed top-6 right-6 z-50">
        {toast && (
          <div
            className={`px-4 py-2 rounded shadow-md text-sm ${
              toast.type === "success" ? "bg-green-600 text-white" : toast.type === "error" ? "bg-red-600 text-white" : "bg-indigo-600 text-white"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight">Students</h1>
          <div className="text-sm text-gray-500 mt-1">Browse, add, or bulk upload students. Filters on the left — results on the right.</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50"
            onClick={() => {
              setSelectedProgramName("");
              setSelectedYearId("");
              setSelectedBranch("");
              setSelectedClass("");
              setStudents([]);
              setSearchQuery("");
              setPage(1);
              setError(null);
              setStatusMessage(null);
              setToast({ type: "info", text: "Filters reset." });
              setTimeout(() => setToast(null), 1500);
            }}
          >
            Reset
          </button>

          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm shadow hover:opacity-95 flex items-center gap-2"
            onClick={loadAllStudents}
            disabled={loading.students}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3v12a2 2 0 002 2h10" />
              <path d="M16 3H8v6" />
            </svg>
            {loading.students ? "Loading…" : "Load All"}
          </button>

          <button
            className="px-4 py-2 bg-white border rounded text-sm shadow hover:bg-gray-50 flex items-center gap-2"
            onClick={exportCsv}
            disabled={students.length === 0}
            title="Export filtered students as CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3v12a2 2 0 002 2h10" />
              <path d="M8 7h4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel: filters + add controls */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Filters</h2>

            <div className="grid grid-cols-1 gap-3">
              {/* Program */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Program</label>
                <select
                  className="w-full border rounded p-2 text-sm bg-white"
                  value={selectedProgramName}
                  onChange={(e) => setSelectedProgramName(e.target.value || "")}
                >
                  <option value="">All programs</option>
                  {Array.isArray(programs) &&
                    programs.map((p: any) => (
                      <option key={p.id ?? p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Year</label>
                <select
                  className="w-full border rounded p-2 text-sm bg-white disabled:opacity-70"
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : "")}
                  disabled={!selectedProgramName}
                >
                  <option value="">All years</option>
                  {Array.isArray(years) &&
                    years.map((y: any) => (
                      <option key={y.id ?? y.number} value={y.id}>
                        {y.number ?? y.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Branch</label>
                <select
                  className="w-full border rounded p-2 text-sm bg-white disabled:opacity-70"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value || "")}
                  disabled={!selectedYearId}
                >
                  <option value="">All branches</option>
                  {Array.isArray(branches) &&
                    branches.map((b: any) => (
                      <option key={b.id ?? b.name} value={b.name ?? b.id}>
                        {b.name ?? b.branchName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Class</label>
                <select
                  className="w-full border rounded p-2 text-sm bg-white disabled:opacity-70"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value || "")}
                  disabled={!selectedBranch}
                >
                  <option value="">All classes</option>
                  {Array.isArray(classes) &&
                    classes.map((c: any) => (
                      <option key={c.id ?? c.name} value={c.id ?? c.name}>
                        {c.name ?? c.className ?? c.label ?? c.id}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm"
                  onClick={loadStudentsForClass}
                  disabled={loading.students}
                >
                  {loading.students ? "Loading..." : "Apply"}
                </button>
                <button
                  className="flex-1 bg-gray-50 border rounded py-2 text-sm"
                  onClick={() => {
                    setSelectedProgramName("");
                    setSelectedYearId("");
                    setSelectedBranch("");
                    setSelectedClass("");
                    setToast({ type: "info", text: "Filters cleared." });
                    setTimeout(() => setToast(null), 1500);
                  }}
                >
                  Clear
                </button>
              </div>

              {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
            </div>
          </div>

          {/* Manual Add */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Add Student</h2>
            <div className="grid grid-cols-1 gap-2">
              <input
                placeholder="Full name *"
                className="w-full border rounded p-2 text-sm"
                value={manualForm.name}
                onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Email"
                  className="w-full border rounded p-2 text-sm"
                  value={manualForm.email}
                  onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                />
                <input
                  placeholder="Roll"
                  className="w-full border rounded p-2 text-sm"
                  value={String(manualForm.roll ?? "")}
                  onChange={(e) => setManualForm((f) => ({ ...f, roll: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Program"
                  className="w-full border rounded p-2 text-sm"
                  value={manualForm.program ?? ""}
                  onChange={(e) => setManualForm((f) => ({ ...f, program: e.target.value || null }))}
                />
                <input
                  placeholder="Year"
                  className="w-full border rounded p-2 text-sm"
                  value={String(manualForm.year ?? "")}
                  onChange={(e) => setManualForm((f) => ({ ...f, year: e.target.value || null }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Branch"
                  className="w-full border rounded p-2 text-sm"
                  value={manualForm.branch ?? ""}
                  onChange={(e) => setManualForm((f) => ({ ...f, branch: e.target.value || null }))}
                />
                <input
                  placeholder="Class"
                  className="w-full border rounded p-2 text-sm"
                  value={manualForm.className ?? ""}
                  onChange={(e) => setManualForm((f) => ({ ...f, className: e.target.value || null }))}
                />
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm"
                  onClick={handleManualAdd}
                  disabled={loading.manualAdd}
                >
                  {loading.manualAdd ? "Adding..." : "Add Student"}
                </button>
                <button
                  className="flex-1 bg-gray-50 border rounded py-2 text-sm"
                  onClick={() => {
                    resetManualForm();
                    setToast({ type: "info", text: "Form reset." });
                    setTimeout(() => setToast(null), 1200);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Bulk Upload (CSV)</h2>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-dashed border-2 rounded p-3 text-center transition-colors ${
                dragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v12" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7l4-4 4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21H3" />
                </svg>
                <div>
                  <div className="text-sm font-medium">Drag & drop CSV here</div>
                  <div className="text-xs text-gray-500">or click to choose file (columns: name,email,roll,group,program,year,branch,class)</div>
                </div>
              </div>

              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                id="students-csv-input"
                onChange={(e) => handleCsvFile(e.target.files ? e.target.files[0] : null)}
              />
              <label htmlFor="students-csv-input" className="mt-3 inline-block text-xs text-indigo-600 hover:underline cursor-pointer">
                Choose a file
              </label>

              {csvFileName && <div className="mt-3 text-xs text-gray-600">Selected: <strong>{csvFileName}</strong></div>}

              {csvRawPreview.length > 0 && (
                <div className="mt-3 text-xs border rounded p-2 max-h-44 overflow-auto bg-gray-50">
                  <div className="font-medium text-sm mb-1">CSV quick preview</div>
                  <table className="text-xs w-full table-auto border-collapse">
                    <tbody>
                      {csvRawPreview.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          {r.map((c, j) => (
                            <td key={j} className="px-1 py-0.5 border text-xs">{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {csvPreviewRows.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">Parsed rows preview: {csvPreviewRows.length} (first 30)</div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  className="flex-1 bg-blue-600 text-white py-2 rounded text-sm"
                  onClick={triggerCsvUpload}
                  disabled={loading.csvUpload || !csvFile}
                >
                  {loading.csvUpload ? "Uploading..." : "Upload CSV"}
                </button>

                <button
                  className="flex-1 bg-gray-50 border rounded py-2 text-sm"
                  onClick={() => {
                    setCsvFile(null);
                    setCsvFileName(null);
                    setCsvPreviewRows([]);
                    setCsvRawPreview([]);
                    const input = document.getElementById("students-csv-input") as HTMLInputElement | null;
                    if (input) input.value = "";
                    setToast({ type: "info", text: "CSV cleared." });
                    setTimeout(() => setToast(null), 1200);
                  }}
                >
                  Clear
                </button>
              </div>

              {csvUploadPercent > 0 && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                    <div className="h-2 bg-indigo-600 rounded" style={{ width: `${csvUploadPercent}%`, transition: "width 300ms ease" }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{csvUploadPercent}%</div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">Tip: small CSVs upload quickly. If you have many rows, the UI will show progress.</div>
            </div>
          </div>

          {/* Quick stats card */}
          <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Showing</div>
              <div className="text-lg font-semibold">{filteredStudents.length}</div>
              <div className="text-xs text-gray-400">filtered students</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Current page</div>
              <div className="text-lg font-semibold">{page} / {totalPages}</div>
              <div className="text-xs text-gray-400">Rows per page: {pageSize}</div>
            </div>
          </div>
        </aside>

        {/* Right: Students table */}
        <main className="lg:col-span-8 space-y-4">
          <div className="bg-white border rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-lg font-medium">Students List</div>
                <div className="text-sm text-gray-500 hidden sm:block">Manage and export student records</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    placeholder="Search name, email, roll, program, branch, class..."
                    className="border rounded p-2 pl-9 text-sm w-72"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.386a1 1 0 01-1.414 1.415l-4.387-4.387zM10 16a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div>Rows</div>
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
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
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
                      <td colSpan={8} className="text-center py-10 text-gray-500">
                        {loading.students ? "Loading..." : "No students found"}
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((s, i) => (
                      <tr
                        key={s.id ?? `${i}`}
                        className={`transition-colors hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        {/* Name with avatar initials */}
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                            {String(s.name || "-")
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>{s.name}</div>
                        </td>

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
            <div className="p-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
