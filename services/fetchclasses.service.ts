import api from "@/lib/api";

export const fetchClassesByBranch = async (
  programName: string,
  yearNumber: number,
  branchName: string,
  sessionName?: string
): Promise<any[]> => {
  try {
    const response = await api.get(
      `/class/${programName}/${yearNumber}/${branchName}`
    );
    return response.data as any[];
  } catch (error) {
    console.error(
      `Error fetching classes for ${programName} - Year ${yearNumber} - Branch ${branchName}:`,
      error
    );
    return [];
  }
};
