import api from '@/lib/api';

type Student = {
  name: string;
  email: string;
  roll: number;
};

export const getStudentsBySubjectCode = async (
  subjectCode: string,
  classId: string | number
): Promise<Student[]> => {
  const res = await api.get(`/elective/students/subject/${subjectCode}/class/${classId}`);
  return res.data; // now expected to be Student[]
};
