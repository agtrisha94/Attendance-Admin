// lib/types.ts
export interface Program {
  id: string;
  name: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
}

export interface TeacherAssignment {
  programId: string;
  programName: string;
  branchId: string;
  branchName: string;
  year: string;
  section: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  assignments?: TeacherAssignment[];
}