// lib/mockApi.ts
export type Subject = { name: string; teacher: string };
export type SectionData = Record<string, Subject[]>; // section -> subjects
export type YearData = { sections: SectionData };
export type BranchData = Record<number, YearData>; // year -> YearData
export type Subjects = Record<string, BranchData>; // branch -> BranchData

export type Session = {
  id: string;
  program: string;
  name: string;
  duration: number;
  branches: string[];
  subjects: Subjects;
};

export const mockSessions: Session[] = [
  {
    id: "1",
    program: "B.Tech",
    name: "2023-2027",
    duration: 4,
    branches: ["Computer Science", "Mechanical"],
    subjects: {
      "Computer Science": {
        1: {
          sections: {
            A: [
              { name: "Mathematics I", teacher: "Mr. Sharma" },
              { name: "Physics I", teacher: "Ms. Gupta" }
            ],
            B: [{ name: "Mathematics I", teacher: "Mr. Sharma" }]
          }
        },
        2: {
          sections: {
            A: [{ name: "Data Structures", teacher: "Mr. Khan" }]
          }
        }
      },
      Mechanical: {
        1: {
          sections: {
            A: [{ name: "Engineering Mechanics", teacher: "Mr. Singh" }]
          }
        }
      }
    }
  },
  {
    id: "2",
    program: "B.Tech",
    name: "2022-2026",
    duration: 4,
    branches: ["CSE", "ECE"],
    subjects: {}
  }
];

// ------------------ API-like helper functions ------------------

export async function getSessions() {
  return mockSessions.map(({ id, name }) => ({ id, name }));
}

export async function getPrograms() {
  return Array.from(new Set(mockSessions.map((s) => s.program)));
}

export async function getYears(program: string) {
  const session = mockSessions.find((s) => s.program === program);
  return session ? Array.from({ length: session.duration }, (_, i) => String(i + 1)) : [];
}

export async function getBranches(program: string, year: string) {
  const session = mockSessions.find((s) => s.program === program);
  return session?.branches ?? [];
}

export async function getSections(program: string, year: string, branch: string) {
  const session = mockSessions.find((s) => s.program === program);
  if (!session) return [];
  const branchData = session.subjects[branch];
  const yearData = branchData?.[Number(year)];
  return yearData ? Object.keys(yearData.sections) : [];
}

export async function getSubjects(
  program: string,
  branch: string,
  year: string,
  section: string
) {
  const session = mockSessions.find((s) => s.program === program);
  if (!session) return [];
  const branchData = session.subjects[branch];
  const yearData = branchData?.[Number(year)];
  const sectionData = yearData?.sections[section];
  return sectionData?.map((sub) => `${sub.name}`) ?? [];
}

export async function getTeachers() {
  // You can make this dynamic from mockSessions if needed
  return ["Dr. Emily White", "Prof. John Doe", "Ms. Priya Kapoor"];
}

export async function assignTeacher(data: {
  program: string;
  year: string;
  branch: string;
  section: string;
  subject: string;
  teacher: string;
}) {
  console.log("Assigned Teacher:", data);
  return true;
}
