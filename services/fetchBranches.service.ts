// services/fetchBranchesByAcademicYear.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export const fetchBranchesByAcademicYear = async (
  year: number
): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/sessions/branches/by-year/${year}`, {
      method: "GET",
      cache: "no-store", // avoid caching issues
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error fetching branches for academic year ${year}:`,
      error
    );
    throw new Error("Failed to fetch branches by academic year");
  }
};
