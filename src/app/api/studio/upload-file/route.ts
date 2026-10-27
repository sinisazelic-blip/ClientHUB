import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const uploadedBy = (formData.get("uploadedBy") as string) || "Korisnik";
    const sessionId = (formData.get("sessionId") as string) || "taf-coca-cola-2026";

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "Nema odabranih fajlova" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedItems: Array<{
      id: string;
      name: string;
      size: string;
      type: "audio" | "video" | "doc";
      uploadedAt: string;
      url: string;
      uploadedBy: string;
    }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const ext = path.extname(file.name).toLowerCase();
      let type: "audio" | "video" | "doc" = "doc";
      if ([".wav", ".mp3", ".aif", ".aiff", ".flac", ".m4a", ".aac"].includes(ext)) {
        type = "audio";
      } else if ([".mp4", ".mov", ".mkv", ".webm", ".avi"].includes(ext)) {
        type = "video";
      }

      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;

      savedItems.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: sizeStr,
        type,
        uploadedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        url: `/uploads/${safeName}`,
        uploadedBy,
      });
    }

    // Call status endpoint internally to persist in activeSession
    try {
      const origin = req.nextUrl.origin || "http://localhost:3000";
      for (const item of savedItems) {
        await fetch(`${origin}/api/studio/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ADD_PROJECT_FILE", file: item }),
        }).catch(() => {});
      }
    } catch (_) {}

    return NextResponse.json({ success: true, files: savedItems });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: err.message || "Greška pri uploadu" }, { status: 500 });
  }
}
