/**
 * Authenticated upload of a scenario image into public/scenarios/ on local disk.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "~/server/auth";

const SCENARIO_DIR = path.join(process.cwd(), "public", "scenarios");
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

function sanitizeBaseName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploaded = formData.get("file");

  if (!(uploaded instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const originalName = uploaded.name || "scenario-image";
  const extension = path.extname(originalName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use jpg, png, webp, or gif." },
      { status: 400 },
    );
  }

  const safeBaseName = sanitizeBaseName(originalName) || "scenario-image";
  const timestamp = Date.now();
  const fileName = `${safeBaseName}-${timestamp}${extension}`;
  const destination = path.join(SCENARIO_DIR, fileName);

  await mkdir(SCENARIO_DIR, { recursive: true });

  const bytes = await uploaded.arrayBuffer();
  await writeFile(destination, Buffer.from(bytes));

  return NextResponse.json({ fileName });
}
