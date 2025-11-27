// src/components/admin/TeachersContent.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  fetchTeachers as svcFetchTeachers,
  fetchTeacherById,
  fetchClassesByTeacherId,
  uploadTeachersCsv,
  assignTeacherAdmin,
  Teacher,
} from "@/services/teacher.service";
import { assignTeacherToSubjectForClass } from "@/services/assignTeacherToSubject";
import { attachInterceptor } from "@/lib/api"; // ensures token attach + refresh flow

// backend helpers from AttendanceContent
import { fetchPrograms } from "@/services/program.service";
import { fetchYearsByProgramName } from "@/services/year.service";
import { fetchBranchesByAcademicYear } from "@/services/fetchBranches.service";
import { fetchClassesByBranch } from "@/services/fetchclasses.service";

import { uploadExcel } from "@/services/import.service"; // support Excel (.xlsx) uploads

// event bus for cross-component sync
import { AppEvents } from "@/lib/events";

export default function TeachersContent() {
  // data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // add teacher modal (frontend-only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherDepartment, setNewTeacherDepartment] = useState("");
  const [newTeacherId, setNewTeacherId] = useState<string | undefined>(undefined);

  // assignment modal (backed by backend lists)
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  // assignment: program name, branch name, yearId (number|null), classId (number|string|null)
  const [assignment, setAssignment] = useState<{
    program: string;
    branch: string;
    yearId: number | null;
    classId: string | number | null;
  }>({
    program: "",
    branch: "",
    yearId: null,
    classId: null,
  });

  // backend lists for modal selects
  const [programs, setPrograms] = useState<any[]>([]);
  const [yearsList, setYearsList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classesForSelection, setClassesForSelection] = useState<any[]>([]);

  // details modal
  const [detailsTeacher, setDetailsTeacher] = useState<Teacher | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [subjectIdInput, setSubjectIdInput] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // pagination
  const pageSize = 12;
  const [page, setPage] = useState(1);

  // file upload state (CSV & Excel unified)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // attach axios interceptor (token refresh) once on client
  useEffect(() => {
    attachInterceptor();
  }, []);

  // load teachers
  const load = async () => {
    try {
      setLoading(true);
      const data = await svcFetchTeachers();
      setTeachers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --- Listen for cross-component assignment updates ---
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail || !detail.teacherId) return;
        const teacherId: string = detail.teacherId;
        const assignmentUpdate = detail.assignment || {};

        setTeachers((prev) =>
          prev.map((t) =>
            t.id === teacherId
              ? {
                  ...t,
                  // merge assignmentUpdate fields if present; otherwise preserve existing
                  assignedProgram:
                    assignmentUpdate.assignedProgram !== undefined
                      ? assignmentUpdate.assignedProgram
                      : (t as any).assignedProgram ?? null,
                  assignedBranch:
                    assignmentUpdate.assignedBranch !== undefined
                      ? assignmentUpdate.assignedBranch
                      : (t as any).assignedBranch ?? null,
                  assignedYear:
                    assignmentUpdate.assignedYear !== undefined
                      ? assignmentUpdate.assignedYear
                      : (t as any).assignedYear ?? null,
                  assignedClassId:
                    assignmentUpdate.assignedClassId !== undefined
                      ? assignmentUpdate.assignedClassId
                      : (t as any).assignedClassId ?? null,
                }
              : t
          )
        );
      } catch (e) {
        console.error("assignments:updated handler error", e);
      }
    };

    AppEvents.addEventListener("assignments:updated", handler as EventListener);
    return () => {
      AppEvents.removeEventListener("assignments:updated", handler as EventListener);
    };
  }, []); // run once on mount

  // --- load programs for modal on mount ---
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await fetchPrograms();
        setPrograms(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchPrograms err:", err);
      }
    };
    loadPrograms();
  }, []);

  // load years when program changes
  useEffect(() => {
    setYearsList([]);
    setAssignment((a) => ({ ...a, yearId: null, branch: "", classId: null }));

    if (!assignment.program) return;

    const loadYears = async () => {
      try {
        const res = await fetchYearsByProgramName(assignment.program);
        setYearsList(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchYearsByProgramName err:", err);
      }
    };
    loadYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.program]);

  // load branches when yearId changes
  useEffect(() => {
    setBranches([]);
    setAssignment((a) => ({ ...a, branch: "", classId: null }));

    // guard: don't call with null
    if (assignment.yearId === null) return;

    const loadBranches = async () => {
      try {
        const res = await fetchBranchesByAcademicYear(assignment.yearId as number);
        setBranches(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchBranchesByAcademicYear err:", err);
      }
    };
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.yearId]);

  // load classes when program + year + branch selected
  useEffect(() => {
    setClassesForSelection([]);
    setAssignment((a) => ({ ...a, classId: null }));

    if (!assignment.program || assignment.yearId === null || !assignment.branch) return;

    const loadClasses = async () => {
      try {
        const yearObj = yearsList.find((y) => y.id === assignment.yearId) ?? yearsList[0];
        const yearNumber = yearObj?.number ?? assignment.yearId;
        const res = await fetchClassesByBranch(assignment.program, Number(yearNumber), assignment.branch);
        setClassesForSelection(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("fetchClassesByBranch err:", err);
      }
    };
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.program, assignment.yearId, assignment.branch, yearsList]);

  const handleOpenAssign = (t: Teacher) => {
    setEditingTeacherId(t.id);

    // populate assignment from teacher object (best-effort)
    // assignedYear in Teacher is likely string|null. If it's numeric, parse to number.
    const parsedYearId =
      typeof (t as any).assignedYear === "number"
        ? (t as any).assignedYear
        : typeof (t as any).assignedYear === "string" && /^\d+$/.test((t as any).assignedYear)
        ? Number((t as any).assignedYear)
        : null;

    setAssignment({
      program: (t as any).assignedProgram || "",
      branch: (t as any).assignedBranch || "",
      yearId: parsedYearId,
      classId: (t as any).assignedClassId ?? null,
    });
  };

  const handleSaveAssignment = async (teacherId: string) => {
    // optimistic update in local list — ensure assignedYear is string to match Teacher type
    setTeachers((prev) =>
      prev.map((p: Teacher) =>
        p.id === teacherId
          ? {
              ...p,
              assignedProgram: assignment.program || null,
              assignedBranch: assignment.branch || null,
              assignedYear: assignment.yearId !== null ? String(assignment.yearId) : null,
              ...(assignment.classId ? { assignedClassId: assignment.classId } : {}),
            }
          : p
      )
    );
    setEditingTeacherId(null);

    try {
      // send backward-compatible payload; send assignedYear as string (same shape as Teacher)
      const payload: any = {
        assignedProgram: assignment.program || null,
        assignedBranch: assignment.branch || null,
        assignedYear: assignment.yearId !== null ? String(assignment.yearId) : null,
      };
      if (assignment.classId) payload.assignedClassId = assignment.classId;
      await assignTeacherAdmin(teacherId, payload);
    } catch (err) {
      console.error(err);
      await load(); // revert by reloading from server
      alert("Failed to save assignment — changes reverted.");
    }
  };

  // Unified file chooser change handler
  const handleUnifiedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    const name = (f.name || "").toLowerCase();
    const mime = f.type || "";

    setSelectedFile(f);
    setSelectedFileName(f.name);

    // If CSV, keep as CSV; if Excel, we'll use uploadExcel flow on upload click
    if (name.endsWith(".csv") || mime.includes("csv")) {
      // keep selected; we'll upload via uploadTeachersCsv when user triggers upload
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || mime.includes("spreadsheet") || mime.includes("excel")) {
      // Excel selected; upload on user click via uploadExcel
    } else {
      alert("Unsupported file type. Use .csv or .xlsx/.xls");
      setSelectedFile(null);
      setSelectedFileName(null);
      e.currentTarget.value = "";
    }
  };

  // Trigger upload (CSV or Excel depending on selectedFile)
  const triggerUpload = async () => {
    if (!selectedFile) return alert("No file selected.");
    const name = (selectedFile.name || "").toLowerCase();
    const mime = selectedFile.type || "";

    if (name.endsWith(".csv") || mime.includes("csv")) {
      // CSV flow
      try {
        setLoading(true);
        setUploadProgress(10);
        const created = await uploadTeachersCsv(selectedFile);
        // uploadTeachersCsv may return array of created teachers or a status; handle both
        if (Array.isArray(created)) {
          setTeachers((prev) => [...created, ...prev]);
        } else {
          await load();
        }
        alert("CSV uploaded successfully.");
      } catch (err: any) {
        console.error("uploadTeachersCsv err:", err);
        alert("CSV upload failed: " + (err?.message || String(err)));
      } finally {
        setLoading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setSelectedFileName(null);
        const inp = document.getElementById("upload-teachers-file") as HTMLInputElement | null;
        if (inp) inp.value = "";
      }
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || mime.includes("spreadsheet") || mime.includes("excel")) {
      // Excel flow using uploadExcel wrapper (same endpoint used by Students)
      try {
        setLoading(true);
        setUploadProgress(5);
        const progressCb = (p: number) => setUploadProgress(p);
        const resp: any = await uploadExcel(selectedFile, progressCb);
        // resp expected to contain { students:..., teachers:... } as per server import
        if (resp?.teachers?.createdRows && resp.teachers.createdRows.length > 0) {
          // map created teachers into UI quickly if possible
          const created: Teacher[] = resp.teachers.createdRows.map((r: any) => {
            return {
              id: r.teacher?.id ?? `new-${Math.random()}`,
              name: r.teacher?.name ?? "",
              email: r.teacher?.email ?? null,
              department: null,
              assignedProgram: null,
              assignedBranch: null,
              assignedYear: null,
            } as Teacher;
          });
          setTeachers((prev) => [...created, ...prev]);
        } else {
          // fallback: reload
          await load();
        }
        alert(`Excel import finished. Teachers created: ${resp?.teachers?.created ?? 0}`);
      } catch (err: any) {
        console.error("uploadExcel err:", err);
        alert("Excel upload failed: " + (err?.message || String(err)));
      } finally {
        setLoading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setSelectedFileName(null);
        const inp = document.getElementById("upload-teachers-file") as HTMLInputElement | null;
        if (inp) inp.value = "";
      }
    } else {
      alert("Unsupported file type selected.");
    }
  };

  const openDetails = async (teacherId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsTeacher(null);
      setTeacherClasses([]);
      const t = await fetchTeacherById(teacherId);
      setDetailsTeacher(t);
      const classes = await fetchClassesByTeacherId(teacherId);
      setTeacherClasses(classes || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load teacher details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAssignTeacherToSubject = async (teacherId: string) => {
    if (!subjectIdInput) return alert("Please enter subject id.");
    if (!teacherClasses || teacherClasses.length === 0) return alert("No classes available for this teacher.");

    // default to first class — you can let user choose a class in the UI easily
    const classId = teacherClasses[0].id;
    if (!classId) return alert("No valid class id found.");

    try {
      setAssignLoading(true);
      await assignTeacherToSubjectForClass(subjectIdInput, teacherId, classId);
      alert("Teacher assigned to subject for class successfully.");
      // refresh details to reflect changes
      await openDetails(teacherId);
    } catch (err) {
      console.error(err);
      alert("Failed to assign teacher to subject.");
    } finally {
      setAssignLoading(false);
      setSubjectIdInput("");
    }
  };

  // --- Add Teacher handler (frontend-only) ---
  const handleAddTeacher = () => {
    const name = newTeacherName.trim();
    const email = newTeacherEmail.trim();
    const department = newTeacherDepartment.trim();
    const id = newTeacherId?.trim();

    if (!name) return alert("Name is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return alert("Please enter a valid email or leave blank.");
    }

    const newTeacher: Teacher = {
      id: id || `temp-${Date.now()}`,
      name,
      email: email || null,
      department: department || null,
      // backend-related fields left null
      assignedProgram: null,
      assignedBranch: null,
      assignedYear: null,
    } as Teacher;

    // update local list only (frontend-only)
    setTeachers((prev) => [newTeacher, ...prev]);

    // reset fields
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherDepartment("");
    setNewTeacherId(undefined);
    setShowAddModal(false);

    alert("Teacher added (frontend only).");
  };

  // filter + paginate
  const filtered = teachers.filter((t: Teacher) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [t.name, t.email, (t.department as any), t.id].some((x) => (x || "").toString().toLowerCase().includes(q));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Teachers</h2>
          <p className="text-sm text-gray-500">Manage teacher records and admin assignments</p>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, id..."
            className="border rounded px-3 py-2"
          />

          <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Add Teacher
          </button>

          {/* Unified file chooser for teachers: CSV & Excel */}
          <input
            id="upload-teachers-file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleUnifiedFileChange}
            className="hidden"
          />
          <label htmlFor="upload-teachers-file" className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700">
            Choose File
          </label>

          <button
            onClick={triggerUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded-md ml-2 hover:bg-blue-700"
            disabled={!selectedFile || loading}
            title={!selectedFile ? "Select a .csv or .xlsx file first" : "Upload selected file"}
          >
            Upload
          </button>

          <button onClick={load} className="bg-gray-200 px-3 py-2 rounded">
            Refresh
          </button>
        </div>
      </div>

      {selectedFileName && (
        <div className="mb-2 text-sm text-gray-600">Selected: <strong>{selectedFileName}</strong></div>
      )}

      {uploadProgress > 0 && (
        <div className="mb-3 w-full max-w-lg">
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-2 bg-indigo-600" style={{ width: `${uploadProgress}%`, transition: "width 200ms ease" }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{uploadProgress}%</div>
        </div>
      )}

      {loading && <div className="mb-4 text-sm">Loading...</div>}
      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <thead>
            <tr>
              <th className="py-2 px-3 border-b text-left">ID</th>
              <th className="py-2 px-3 border-b text-left">Name</th>
              <th className="py-2 px-3 border-b text-left">Email</th>
              <th className="py-2 px-3 border-b text-left">Dept</th>
              <th className="py-2 px-3 border-b text-left">Admin Assignment</th>
              <th className="py-2 px-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((t: Teacher) => (
              <tr key={t.id} className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-700 dark:even:bg-gray-800">
                <td className="py-2 px-3 border-b">{t.id}</td>
                <td className="py-2 px-3 border-b">{t.name}</td>
                <td className="py-2 px-3 border-b">{t.email || "-"}</td>
                <td className="py-2 px-3 border-b">{t.department || "-"}</td>
                <td className="py-2 px-3 border-b text-sm">
                  {t.assignedProgram ? `P: ${t.assignedProgram}` : ""}
                  {t.assignedBranch ? (
                    <>
                      <br />
                      B: {t.assignedBranch}
                    </>
                  ) : null}
                  {t.assignedYear ? (
                    <>
                      <br />
                      Y: {String(t.assignedYear)}
                    </>
                  ) : null}
                  {(t as any).assignedClassId ? (
                    <>
                      <br />
                      Class: {(t as any).assignedClassId}
                    </>
                  ) : null}
                  {!t.assignedProgram && !t.assignedBranch && !t.assignedYear && !(t as any).assignedClassId && <span>N/A</span>}
                </td>
                <td className="py-2 px-3 border-b">
                  <button onClick={() => handleOpenAssign(t)} className="text-blue-600 hover:underline mr-2">
                    Edit Assign
                  </button>
                  <button onClick={() => openDetails(t.id)} className="text-green-600 hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                  No teachers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">
            Prev
          </button>
          <div className="px-3 py-1 border rounded">
            {page} / {pages}
          </div>
          <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))} className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-700 dark:text-gray-100">
            <h3 className="text-lg font-bold mb-4">Add Teacher (frontend only)</h3>

            <div className="mb-3">
              <label className="block mb-1">Name *</label>
              <input value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div className="mb-3">
              <label className="block mb-1">Email</label>
              <input value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div className="mb-3">
              <label className="block mb-1">Department</label>
              <input value={newTeacherDepartment} onChange={(e) => setNewTeacherDepartment(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            <div className="mb-3">
              <label className="block mb-1">Teacher ID (optional)</label>
              <input value={newTeacherId ?? ""} onChange={(e) => setNewTeacherId(e.target.value || undefined)} className="w-full border rounded px-3 py-2" />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={handleAddTeacher} className="bg-green-600 text-white px-4 py-2 rounded">
                Add Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment modal */}
      {editingTeacherId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-700 dark:text-gray-100">
            <h3 className="text-lg font-bold mb-4">Edit Admin Assignment</h3>

            <div className="mb-3">
              <label className="block mb-1">Program</label>
              <select
                value={assignment.program}
                onChange={(e) => {
                  setAssignment((a) => ({ ...a, program: e.target.value, branch: "", yearId: null, classId: null }));
                }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block mb-1">Year</label>
              <select
                value={assignment.yearId ?? ""}
                onChange={(e) => setAssignment((a) => ({ ...a, yearId: e.target.value ? Number(e.target.value) : null }))}
                className="w-full border rounded px-3 py-2"
                disabled={!assignment.program}
              >
                <option value="">Select Year</option>
                {yearsList.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.number ?? y.label ?? `Year ${y.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block mb-1">Branch</label>
              <select
                value={assignment.branch}
                onChange={(e) => setAssignment((a) => ({ ...a, branch: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                disabled={assignment.yearId === null}
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id ?? b.name} value={b.name ?? b.id}>
                    {b.name ?? b.branchName ?? b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block mb-1">Select Class</label>
              <select
                value={assignment.classId ?? ""}
                onChange={(e) => setAssignment((a) => ({ ...a, classId: e.target.value || null }))}
                className="w-full border rounded px-3 py-2"
                disabled={!assignment.branch}
              >
                <option value="">Select Class</option>
                {classesForSelection.map((c) => (
                  <option key={c.id ?? c.name} value={c.id ?? c.name}>
                    {c.name ?? c.className ?? c.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTeacherId(null)} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={() => handleSaveAssignment(editingTeacherId!)} className="bg-blue-600 text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {detailsTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg dark:bg-gray-700 dark:text-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold">Teacher Details</h3>
              <button
                onClick={() => {
                  setDetailsTeacher(null);
                  setTeacherClasses([]);
                }}
                className="text-gray-500"
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-6">Loading details...</div>
            ) : (
              <div>
                <div className="mt-3 mb-4">
                  <strong>{detailsTeacher?.name}</strong>
                  <div className="text-sm text-gray-500">{detailsTeacher?.email}</div>
                  <div className="text-sm">Dept: {detailsTeacher?.department || "—"}</div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium">Classes</h4>
                  {teacherClasses.length === 0 ? (
                    <div className="text-sm text-gray-500">No classes found for this teacher.</div>
                  ) : (
                    <ul className="list-disc ml-6 text-sm">
                      {teacherClasses.map((c) => (
                        <li key={c.id}>{c.name || c.title || `Class ${c.id}`}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-medium">Assign to Subject (quick)</h4>
                  <div className="flex gap-2">
                    <input placeholder="Subject ID" value={subjectIdInput} onChange={(e) => setSubjectIdInput(e.target.value)} className="border px-3 py-2 rounded w-full" />
                    <button disabled={assignLoading} onClick={() => handleAssignTeacherToSubject(detailsTeacher!.id)} className="bg-indigo-600 text-white px-4 py-2 rounded">
                      {assignLoading ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">This picks the first class found for the teacher. Extend to allow choosing a class.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
