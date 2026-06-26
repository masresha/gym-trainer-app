import "server-only";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Image storage that works in both environments:
 *  - If BLOB_READ_WRITE_TOKEN is set (Vercel), files go to Vercel Blob (durable,
 *    works on serverless where the local filesystem is ephemeral).
 *  - Otherwise files are written under public/uploads (local dev / persistent servers).
 *
 * The returned `url` is stored on the ProgressPhoto row: an absolute https URL for
 * Blob, or a site-relative /uploads/... path for local disk.
 */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function saveImage(args: {
  clientId: string;
  fileName: string;
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  const key = `progress-photos/${args.clientId}/${args.fileName}`;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, args.bytes, {
      access: "public",
      contentType: args.contentType,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", args.clientId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, args.fileName), args.bytes);
  return `/uploads/${args.clientId}/${args.fileName}`;
}

export async function deleteImage(url: string): Promise<void> {
  try {
    if (url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    } else {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    /* best-effort: the DB row is the source of truth */
  }
}
