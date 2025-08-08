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
