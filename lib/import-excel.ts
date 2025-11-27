// pages/api/import-excel.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { handleUploadedExcelFile } from "@/lib/importService";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Protect this route (require admin session/token) before using in production.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 50 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("formidable parse error", err);
      return res.status(400).json({ error: "File upload parse error" });
    }

    const f = files?.file as formidable.File | undefined;
    if (!f) return res.status(400).json({ error: 'No file uploaded in field "file"' });

    const tmpPath = (f as any).filepath || (f as any).path;
    try {
      const result = await handleUploadedExcelFile(tmpPath);
      return res.status(200).json(result);
    } catch (e: any) {
      console.error("import error", e);
      return res.status(500).json({ error: "Import failed", details: e?.message ?? String(e) });
    }
  });
}
