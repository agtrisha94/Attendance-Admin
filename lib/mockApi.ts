
export async function getSessions() {
  return [
    { id: '1', name: '2024-25 Session' },
    { id: '2', name: '2023-24 Session' },
    { id: '3', name: '2022-23 Session' },
  ];
}

export async function getPrograms() {
  return ['B.Tech', 'M.Tech'];
}

export async function getYears(program: string) {
  return ['1', '2', '3', '4'];
}

export async function getBranches(program: string, year: string) {
  return ['CSE', 'ECE', 'ME'];
}

export async function getSections(program: string, year: string, branch: string) {
  return ['A', 'B', 'C'];
}

export async function getSubjects(program: string, branch: string, year: string, section: string) {
  return [
    'Mathematics (MATH101)',
    'Intro to Programming (CS101)',
    'Physics (PHY101)',
    'Digital Logic (EE101)',
  ];
}

export async function getTeachers() {
  return ['Dr. Emily White', 'Prof. John Doe', 'Ms. Priya Kapoor'];
}

export async function assignTeacher(data: {
  program: string;
  year: string;
  branch: string;
  section: string;
  subject: string;
  teacher: string;
}) {
  console.log('Assigned Teacher:', data);
  return true;
}

// lib/mockApi.ts
export type Subject = { name: string; teacher: string };
export type SectionSubjects = { [section: string]: Subject[] };
export type YearData = { [year: number]: { [branch: string]: SectionSubjects } };

export interface Session {
  id: string;
  program: string;
  name: string;
  duration: number;
  years: YearData;
  branches: string[];
  sections: string[];
}

export const mockSessions: Session[] = [
  {
    id: "1",
    program: "B.Tech",
    name: "2023-2027",
    duration: 4,
    branches: ["Computer Science", "Mechanical", "Electrical", "Civil"],
    sections: ["A", "B", "C"],
    years: {
      1: {
        "Computer Science": {
          A: [
            { name: "Mathematics I", teacher: "Mr. Sharma" },
            { name: "Physics I", teacher: "Ms. Gupta" },
          ],
          B: [
            { name: "Mathematics I", teacher: "Mr. Sharma" },
            { name: "Physics I", teacher: "Ms. Gupta" },
          ],
        },
        "Mechanical": {
          A: [{ name: "Engineering Mechanics", teacher: "Mr. Singh" }],
        },
      },
      2: {
        "Computer Science": {
          A: [{ name: "Data Structures", teacher: "Mr. Khan" }],
        },
      },
    },
  },
];
