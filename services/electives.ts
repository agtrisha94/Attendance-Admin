import api from '@/lib/api';

export const getElectiveGroupsByClassId = async (classId: number) => {
  const res = await api.get(`/elective/groups/class/${classId}`);
  return res.data;
};

export const assignTeacherToSubject = async (
  subjectCode: string,
  teacherId: string,
  classId?: number
) => {
  const res = await api.post('/elective/assign-teacher', {
    subjectCode,
    teacherId,
    classId,
  });
  return res.data;
};

export const assignStudentToElective = async ({
  studentId,
  electiveCode,
  groupName,
  branchName,
  classId,
}: {
  studentId: string;
  electiveCode: string;
  groupName: string;
  branchName: string;
  classId: number;
}) => {
  const res = await api.post('/elective/assign-student', {
    studentId,
    electiveCode,
    groupName,
    branchName,
    classId,
  });
  return res.data;
};
