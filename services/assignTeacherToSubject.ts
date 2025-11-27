// src/services/assignTeacherToSubject.ts
import api from "@/lib/api";

/**
 * Assign teacher to a subject inside a class.
 * This wrapper ensures consistent error messages and logs payload for debugging.
 */
export const assignTeacherToSubjectForClass = async (
  subjectId: string,
  teacherId: string,
  classId: number
) => {
  try {
    console.log("[assignTeacher] payload:", { subjectId, teacherId, classId });
    const response = await api.post(`/subjects/${encodeURIComponent(subjectId)}/assign-teacher`, {
      teacherId,
      classId,
    });
    console.log("[assignTeacher] response:", response?.data);
    return response.data;
  } catch (err: any) {
    console.error("[assignTeacher] failed:", err);
    // unwrap axios error message if available
    const msg = err?.message || "Failed to assign teacher";
    throw new Error(msg);
  }
};
