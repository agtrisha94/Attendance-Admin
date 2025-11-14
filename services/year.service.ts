// services/year.service.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export const fetchYearsByProgramName = async (
  programName: string
): Promise<any[]> => {
  try {
    const res = await fetch(
      `${API_BASE}/years/program-name/${encodeURIComponent(programName)}`,
      {
        method: "GET",
        cache: "no-store", // ensures fresh data
      }
    );

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error fetching years for program ${programName}:`,
      error
    );
    throw new Error("Failed to fetch years by program name");
  }
};
