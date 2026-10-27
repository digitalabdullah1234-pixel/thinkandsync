import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_NAME, MEDIA_TYPES, UPLOAD_DIR } from "@/lib/store";

/**
 * The photos and films uploaded through the admin, served from the data
 * folder. Each name is a random id, so a file never changes and can be cached
 * for good. Films answer byte ranges, which phones need to play them.
 */
export async function GET(request: Request, ctx: RouteContext<"/media/[name]">) {
  const { name } = await ctx.params;
  if (!MEDIA_NAME.test(name)) return new Response("Not found", { status: 404 });
  const file = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name);
  let size: number;
  try {
    size = (await fs.stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = MEDIA_TYPES[name.split(".").pop()!];
  const base = { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }

  const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(body, { headers: { ...base, "Content-Length": String(size) } });
}
