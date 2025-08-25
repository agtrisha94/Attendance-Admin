import api from "@/lib/api";

// GET timetable by class
export const fetchTimetableByClassId = async (classId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/timetable/class/${classId}`);
    return response.data as any[];
  } catch (error) {
    console.error(`Error fetching timetable for class ${classId}:`, error);
    throw new Error("Failed to fetch timetable by class ID");
  }
};

// POST new lecture for class
export const createLectureForClass = async (classId: number, lectureData: any): Promise<any> => {
  try {
    const response = await api.post(`/timetable/class/${classId}`, lectureData);
    return response.data;
  } catch (error) {
    console.error(`Error creating lecture for class ${classId}:`, error);
    throw new Error("Failed to create lecture");
  }
};

// PATCH update lecture by ID
export const updateLectureById = async (id: string, lectureData: any): Promise<any> => {
  try {
    const response = await api.patch(`/timetable/${id}`, lectureData);
    return response.data;
  } catch (error) {
    console.error(`Error updating lecture with ID ${id}:`, error);
    throw new Error("Failed to update lecture");
  }
};

// DELETE lecture by ID
export const deleteLectureById = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/timetable/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting lecture with ID ${id}:`, error);
    throw new Error("Failed to delete lecture");
  }
};
