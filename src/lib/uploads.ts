import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface SavedFile {
  url: string; // path relative to web root, e.g. "/uploads/compliance/xxx.pdf"
  fileName: string;
}

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Save an uploaded File to /public/uploads/<bucket>/<uuid><ext> and return
 * its web-accessible URL.
 */
export async function saveUploadedFile(
  bucket: "compliance" | "trucks",
  file: File
): Promise<SavedFile> {
  if (!ALLOWED.has(file.type)) {
    throw new Error(
      `File type ${file.type} not allowed. Upload PDF, JPG, PNG or WebP.`
    );
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("File too large — max 8MB.");
  }
  const dir = path.join(UPLOAD_ROOT, bucket);
  await mkdir(dir, { recursive: true });
  const ext = extFor(file.type, file.name);
  const id = randomUUID();
  const fname = `${id}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fname), buf);
  return { url: `/uploads/${bucket}/${fname}`, fileName: file.name };
}

function extFor(mime: string, name: string): string {
  const fromMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  if (fromMime[mime]) return fromMime[mime];
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot) : "";
}
