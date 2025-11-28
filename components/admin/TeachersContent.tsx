// src/components/admin/TeachersContent.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  fetchTeachers as svcFetchTeachers,
  uploadTeachersCsv,
  Teacher,
} from "@/services/teacher.service";
import { attachInterceptor } from "@/lib/api"; // ensures token attach + refresh flow
import { uploadExcel } from "@/services/import.service"; // support Excel (.xlsx) uploads

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

  // Unified file chooser change handler
  const handleUnifiedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    const name = (f.name || "").toLowerCase();
    const mime = f.type || "";

    setSelectedFile(f);
    setSelectedFileName(f.name);

    if (name.endsWith(".csv") || mime.includes("csv")) {
      // CSV selected
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || mime.includes("spreadsheet") || mime.includes("excel")) {
      // Excel selected
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
      // Excel flow using uploadExcel wrapper
      try {
        setLoading(true);
        setUploadProgress(5);
        const progressCb = (p: number) => setUploadProgress(p);
        const resp: any = await uploadExcel(selectedFile, progressCb);
        if (resp?.teachers?.createdRows && resp.teachers.createdRows.length > 0) {
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
      assignedProgram: null,
      assignedBranch: null,
      assignedYear: null,
    } as Teacher;

    setTeachers((prev) => [newTeacher, ...prev]);

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
          <p className="text-sm text-gray-500">Manage teacher records</p>
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
            </tr>
          </thead>
          <tbody>
            {slice.map((t: Teacher) => (
              <tr key={t.id} className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-700 dark:even:bg-gray-800">
                <td className="py-2 px-3 border-b">{t.id}</td>
                <td className="py-2 px-3 border-b">{t.name}</td>
                <td className="py-2 px-3 border-b">{t.email || "-"}</td>
                <td className="py-2 px-3 border-b">{t.department || "-"}</td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
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
    </div>
  );
}
