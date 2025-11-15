// services/teacher.service.ts
import api from "@/lib/api";

export type Teacher = {
  id: string;
  name: string;
  department?: string | null;
  email?: string | null;
  status?: string | null;
  assignedProgram?: string | null;
  assignedBranch?: string | null;
  assignedYear?: string | null;
  assignedSection?: string | null;
};

/**
 * Fetch all teachers
 */
export const fetchTeachers = async (): Promise<Teacher[]> => {
  // Tell axios we expect Teacher[] so res.data is typed correctly
  const res = await api.get<Teacher[]>("/teachers");
  return res.data;
};

/**
 * Fetch one teacher by id
 */
export const fetchTeacherById = async (teacherId: string): Promise<Teacher> => {
  const res = await api.get<Teacher>(`/teachers/${teacherId}`);
  return res.data;
};

/**
 * Fetch classes for a teacher (shape depends on your backend)
 */
export const fetchClassesByTeacherId = async (teacherId: string): Promise<any[]> => {
  const res = await api.get<any[]>(`/teachers/${teacherId}/classes`);
  return res.data;
};

/**
 * Upload CSV file containing teachers.
 * Backend should return created teachers or some success response.
 */
export const uploadTeachersCsv = async (file: File): Promise<any> => {
  const form = new FormData();
  form.append("file", file);
  // Let axios set the Content-Type (multipart boundary)
  const res = await api.post("/teachers/upload", form);
  return res.data;
};

/**
 * Assign administrative fields for a teacher
 */
export const assignTeacherAdmin = async (
  teacherId: string,
  payload: {
    assignedProgram?: string | null;
    assignedBranch?: string | null;
    assignedYear?: string | null;
    assignedSection?: string | null;
  }
): Promise<Teacher> => {
  const res = await api.put<Teacher>(`/teachers/${teacherId}/assign`, payload);
  return res.data;
};
