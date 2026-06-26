import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { localMediaDir } from "@/lib/local-data/paths";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const basename = decodeURIComponent(segments.join("/"));
  if (
    !basename ||
    basename.includes("..") ||
    basename.includes("/") ||
    basename.includes("\\")
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const mediaRoot = path.resolve(localMediaDir());
  const filePath = path.resolve(mediaRoot, basename);
  if (!filePath.startsWith(`${mediaRoot}${path.sep}`) && filePath !== mediaRoot) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = fs.readFileSync(filePath);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
