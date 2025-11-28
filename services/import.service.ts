// src/services/import.service.ts
import api from "@/lib/api";
import type { AxiosProgressEvent } from "axios"; // requires axios types available

export async function uploadExcel(file: File, onProgress?: (percent: number) => void) {
  if (!file) throw new Error("No file provided");
  const form = new FormData();
  form.append("file", file);

  const resp = await api.post("/teachers/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt: AxiosProgressEvent | ProgressEvent) => {
      // Normalize loaded/total for both AxiosProgressEvent and DOM ProgressEvent
      const loaded = (evt as AxiosProgressEvent).loaded ?? (evt as ProgressEvent).loaded;
      const total = (evt as AxiosProgressEvent).total ?? (evt as ProgressEvent).total;

      // If total is not present or 0, skip percent calculation
      if (!total || !loaded) return;
      const percent = Math.round((Number(loaded) / Number(total)) * 100);
      if (onProgress) onProgress(percent);
    },
    timeout: 5 * 60 * 1000,
  });

  return resp?.data;
}
