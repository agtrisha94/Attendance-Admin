// services/program.service.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://attendance-app-o83z.onrender.com";

export const fetchPrograms = async () => {
  const res = await fetch(`${API_BASE}/programs`, {
    method: "GET",
    cache: "no-store", // prevents caching so data is always fresh
  });

  if (!res.ok) {
    throw new Error("Failed to fetch programs");
  }

  return res.json();
};
