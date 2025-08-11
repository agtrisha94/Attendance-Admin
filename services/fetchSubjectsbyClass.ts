// src/api/fetchSubjectsByClass.ts
import api from "@/lib/api";

export const fetchSubjectsByClass = async (classId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/subjects/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subjects for class ${classId}:`, error);
    throw new Error("Failed to fetch subjects by class ID");
  }
};
