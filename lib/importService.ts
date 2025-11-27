// lib/importService.ts
import fs from "fs";
import * as XLSX from "xlsx";
import { PrismaClient, Role, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

type StudentRow = {
  name?: string;
  email?: string;
  enrollmentNumber?: string;
  branchName?: string;
  sessionLabel?: string;
  programName?: string;
  yearNumber?: number | string;
  semesterNumber?: number | string;
};

function parseNumber(v: any): number | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Primary entry: given a temp file path to an uploaded Excel file,
 * parse and import students & teachers. Returns summary with created & errors.
 */
export async function handleUploadedExcelFile(tmpPath: string) {
  if (!tmpPath || !fs.existsSync(tmpPath)) {
    throw new Error("Uploaded file not found");
  }

  const workbook = XLSX.readFile(tmpPath);
  const studentsResult = await processStudentsFromWorkbook(workbook);
  const teachersResult = await processTeachersFromWorkbook(workbook);

  // cleanup temp file
  try {
    fs.unlinkSync(tmpPath);
  } catch (_) {}

  return { students: studentsResult, teachers: teachersResult };
}

async function processStudentsFromWorkbook(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["Students"];
  if (!sheet)
    return {
      created: 0,
      errors: [
        {
          error: "Students sheet not found (expected sheet named 'Students')",
        },
      ],
      createdRows: [],
    };

  const rows: StudentRow[] = XLSX.utils.sheet_to_json<StudentRow>(sheet, {
    defval: "",
  });
  const result = {
    created: 0,
    errors: [] as any[],
    createdRows: [] as any[],
  };

  for (let i = 0; i < rows.length; ++i) {
    const row = rows[i];
    const excelRowNum = i + 2;

    try {
      // required validation
      if (
        !row.name ||
        !row.enrollmentNumber ||
        !row.programName ||
        !row.sessionLabel
      ) {
        result.errors.push({
          row: excelRowNum,
          error:
            "Missing required field(s): name/enrollmentNumber/programName/sessionLabel",
        });
        continue;
      }

      // program
      const program = await prisma.program.findUnique({
        where: { name: String(row.programName) },
      });
      if (!program) {
        result.errors.push({
          row: excelRowNum,
          error: `Program not found: ${row.programName}`,
        });
        continue;
      }

      // session
      const session = await prisma.session.findFirst({
        where: { label: String(row.sessionLabel), programId: program.id },
      });
      if (!session) {
        result.errors.push({
          row: excelRowNum,
          error: `Session not found: ${row.sessionLabel} for program ${program.name}`,
        });
        continue;
      }

      // year (optional)
      const yearNumber = parseNumber(row.yearNumber);
      const year = yearNumber
        ? await prisma.year.findFirst({
            where: { number: yearNumber, programId: program.id },
          })
        : null;
      if (row.yearNumber && !year) {
        result.errors.push({
          row: excelRowNum,
          error: `Year not found: ${row.yearNumber} in program ${program.name}`,
        });
        continue;
      }

      // branch
      const branch = await prisma.branch.findFirst({
        where: { name: String(row.branchName), sessionId: session.id },
      });
      if (!branch) {
        result.errors.push({
          row: excelRowNum,
          error: `Branch not found: ${row.branchName} in session ${session.label}`,
        });
        continue;
      }

      // semester (optional)
      const semNumber = parseNumber(row.semesterNumber);
      const semester = semNumber
        ? await prisma.semester.findFirst({
            where: {
              number: semNumber,
              branchId: branch.id,
              programId: program.id,
            },
          })
        : null;
      if (row.semesterNumber && !semester) {
        result.errors.push({
          row: excelRowNum,
          error: `Semester not found: ${row.semesterNumber} in branch ${branch.name}`,
        });
        continue;
      }

      // yearTrack if year present
      if (year) {
        const yearTrack = await prisma.yearTrack.findFirst({
          where: { sessionId: session.id, yearId: year.id },
        });
        if (!yearTrack) {
          result.errors.push({
            row: excelRowNum,
            error: `Year track not found for session ${session.label} and year ${year.number}`,
          });
          continue;
        }
      }

      // duplicates
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { enrollmentNumber: String(row.enrollmentNumber) },
            { email: String(row.email || "") },
          ],
        },
      });
      if (existing) {
        result.errors.push({
          row: excelRowNum,
          error: `Student already exists (email or enrollmentNumber).`,
        });
        continue;
      }

      // always string
      const fallbackEmail = row.email
        ? String(row.email)
        : `${String(row.enrollmentNumber)}@noemail.local`;

      const hashed = await bcrypt.hash(String(row.enrollmentNumber), 10);

      // --- FIXED STUDENT CREATION BLOCK (studentData typed as any, cast at create) ---
      const created = await prisma.$transaction(async (tx) => {
        // use `any` here to avoid compile-time required-property mismatch with
        // Prisma-generated nested input types while preserving runtime behavior.
        const studentData: any = {
          name: String(row.name),
          email: fallbackEmail,
          enrollmentNumber: String(row.enrollmentNumber),
          branch: { connect: { id: branch.id } },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (semester) {
          studentData.semester = { connect: { id: semester.id } };
        }

        const student = await tx.student.create({
          // cast at the call site to satisfy Prisma's expected type
          data: studentData as Prisma.StudentCreateInput,
        });

        await tx.user.create({
          data: {
            email: fallbackEmail,
            password: hashed,
            role: Role.STUDENT,
            mustChangePassword: true,
            student: { connect: { id: student.id } },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return student;
      });
      // --- END FIXED BLOCK ---

      result.created++;
      result.createdRows.push({
        row: excelRowNum,
        student: {
          id: created.id,
          name: created.name,
          enrollmentNumber: created.enrollmentNumber,
          email: created.email,
        },
      });
    } catch (err: any) {
      result.errors.push({
        row: excelRowNum,
        error: err?.message ?? String(err),
      });
    }
  }

  return result;
}

async function processTeachersFromWorkbook(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets["Teachers"];
  if (!sheet)
    return {
      created: 0,
      errors: [
        {
          error: "Teachers sheet not found (expected sheet named 'Teachers')",
        },
      ],
      createdRows: [],
    };

  const rows = XLSX.utils.sheet_to_json<{
    name?: string;
    email?: string;
    employeeNumber?: string;
  }>(sheet, { defval: "" });

  const result = {
    created: 0,
    errors: [] as any[],
    createdRows: [] as any[],
  };

  for (let i = 0; i < rows.length; ++i) {
    const r = rows[i];
    const excelRowNum = i + 2;

    try {
      if (!r.name || !r.employeeNumber) {
        result.errors.push({
          row: excelRowNum,
          error: "Missing required fields: name or employeeNumber",
        });
        continue;
      }

      const existing = await prisma.teacher.findUnique({
        where: { email: String(r.email || "") },
      });
      if (existing) {
        result.errors.push({
          row: excelRowNum,
          error: "Teacher already exists (email)",
        });
        continue;
      }

      const fallbackEmail = r.email
        ? String(r.email)
        : `${String(r.employeeNumber)}@noemail.local`;

      const hashed = await bcrypt.hash(String(r.employeeNumber), 10);

      const created = await prisma.$transaction(async (tx) => {
        const teacher = await tx.teacher.create({
          data: {
            name: String(r.name),
            email: fallbackEmail,
            employeeNumber: String(r.employeeNumber),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.user.create({
          data: {
            email: fallbackEmail,
            password: hashed,
            role: Role.TEACHER,
            mustChangePassword: true,
            teacher: { connect: { id: teacher.id } },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return teacher;
      });

      result.created++;
      result.createdRows.push({
        row: excelRowNum,
        teacher: { id: created.id, name: created.name },
      });
    } catch (err: any) {
      result.errors.push({
        row: excelRowNum,
        error: err?.message ?? String(err),
      });
    }
  }

  return result;
}
