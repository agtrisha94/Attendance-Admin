// services/assignTeacherToSubject.ts
import api from '@/lib/api';

export const assignTeacherToSubjectForClass = async (
  subjectId: string,
  teacherId: string,
  classId: number
) => {
  const response = await api.post(`/subjects/${subjectId}/assign-teacher`, {
    teacherId, // <-- make sure this is `teacherId`, not `teacherName`
    classId,
  });

  return response.data;
};
