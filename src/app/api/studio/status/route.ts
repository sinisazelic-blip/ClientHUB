import { NextResponse } from "next/server";

// In-memory global bridge status cache
let bridgeStatus = {
  isOnline: false,
  studioName: "Studio TAF",
  lastSeen: 0,
  ip: "127.0.0.1",
};

export async function GET() {
  const isStale = Date.now() - bridgeStatus.lastSeen > 30000;
  return NextResponse.json({
    success: true,
    isOnline: bridgeStatus.isOnline && !isStale,
    studioName: bridgeStatus.studioName,
    lastSeen: bridgeStatus.lastSeen,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    bridgeStatus = {
      isOnline: Boolean(body.isOnline),
      studioName: body.studioName || bridgeStatus.studioName,
      lastSeen: Date.now(),
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    };
    return NextResponse.json({
      success: true,
      acknowledged: true,
      bridgeStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
