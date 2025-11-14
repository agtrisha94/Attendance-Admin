// services/attendance.service.ts
import api from "@/lib/api";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId?: number;
  subjectId?: string;
  date: string; // ISO
  status?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | string;
  markedById?: string;
  // add other backend fields if present
}

/**
 * Fetch attendance records for a class (optionally you can extend to pass subjectId)
 * Uses controller: GET /attendance?classId=...
 */
export const fetchAttendanceForClass = async (classId: number): Promise<AttendanceRecord[]> => {
  try {
    const resp = await api.get<AttendanceRecord[]>("/attendance", {
      params: { classId },
    });
    const data = resp.data;
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("fetchAttendanceForClass error:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
      classId,
    });
    throw err;
  }
};
