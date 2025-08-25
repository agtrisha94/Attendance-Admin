import api from '../lib/api';

export const fetchClassesByTeacherId = async (teacherId: string): Promise<any[]> => {
  try {
    const response = await api.get(`/teachers/${teacherId}/classes`);
    return response.data as any[];
  } catch (error) {
    console.error(`Error fetching classes for teacher ${teacherId}:`, error);
    throw new Error('Failed to fetch classes');
  }
};
