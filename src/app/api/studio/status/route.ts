import { NextResponse } from "next/server";

export interface SessionTake {
  id: number;
  name: string;
  status: "final" | "alt" | "rejected" | "none";
}

export interface SessionSegment {
  id: string;
  title: string;
  text: string;
  targetDuration: string;
  takes: SessionTake[];
}

export interface SessionItem {
  id: string;
  projectName: string;
  clientName: string;
  speakerName: string;
  date: string;
  time: string;
  isDoorOpen: boolean;
  isOnAir: boolean;
  videoEnabled: boolean;
  recStartTime: number | null;
  fluxaDownloadUrl?: string;
  segments: SessionSegment[];
}

// Global in-memory state
let bridgeStatus = {
  isOnline: true,
  studioName: "Studio TAF",
  lastSeen: Date.now(),
  ip: "127.0.0.1",
};

let sessionsList: SessionItem[] = [
  {
    id: "taf-coca-cola-2026",
    projectName: "Coca-Cola (Ljetna kampanja 2026)",
    clientName: "Studio Ritem / Media Focus",
    speakerName: "Goran (Glavni glas)",
    date: new Date().toISOString().split("T")[0],
    time: "20:30",
    isDoorOpen: true,
    isOnAir: false,
    videoEnabled: false, // Default: Radio / Voiceover Info Box
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-coca-cola-final",
    segments: [
      {
        id: "seg-1",
        title: "Intro (Početak spot 1)",
        text: "Zaboravite sve što ste mislili o kompromisima. Nova sezona donosi više stila i neponovljivu energiju u svakom gutljaju.",
        targetDuration: "00:00 - 00:10",
        takes: [
          { id: 1, name: "Tejk 1 (Toplo)", status: "alt" },
          { id: 2, name: "Tejk 2 (Dinamično)", status: "final" },
          { id: 3, name: "Tejk 3 (Neutralno)", status: "none" },
        ],
      },
      {
        id: "seg-2",
        title: "Glavna poruka & Ponuda",
        text: "Potražite označena pakovanja u svim prodajnim objektima širom regije. Iskoristite posebne pogodnosti do kraja ovog mjeseca.",
        targetDuration: "00:10 - 00:22",
        takes: [
          { id: 1, name: "Tejk 1", status: "final" },
          { id: 2, name: "Tejk 2", status: "none" },
        ],
      },
      {
        id: "seg-3",
        title: "Outro / Slogan & CTA",
        text: "Vaš pouzdan partner na svakom koraku. Osjeti čaroliju.",
        targetDuration: "00:22 - 00:30",
        takes: [
          { id: 1, name: "Tejk 1 (Brzo)", status: "rejected" },
          { id: 2, name: "Tejk 2 (Smireno)", status: "final" },
        ],
      },
    ],
  },
  {
    id: "taf-intesa-radio",
    projectName: "Banka Intesa (Radio Džingl 2x30s)",
    clientName: "McCann Beograd",
    speakerName: "Jelena (Ženski vokal)",
    date: new Date().toISOString().split("T")[0],
    time: "22:00",
    isDoorOpen: false, // Vrata zatvorena - čekaonica
    isOnAir: false,
    videoEnabled: false,
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-intesa",
    segments: [
      {
        id: "seg-intesa-1",
        title: "Radio Spot A (Keš krediti)",
        text: "Rješenje za vaše planove uz fiksnu kamatnu stopu. Prijavite se online za samo 15 minuta.",
        targetDuration: "30s",
        takes: [{ id: 1, name: "Tejk 1", status: "none" }],
      },
    ],
  },
];

let activeSessionId = "taf-coca-cola-2026";

export async function GET() {
  const isStale = Date.now() - bridgeStatus.lastSeen > 30000;
  const activeSession = sessionsList.find((s) => s.id === activeSessionId) || sessionsList[0];

  return NextResponse.json({
    success: true,
    isOnline: bridgeStatus.isOnline && !isStale,
    studioName: bridgeStatus.studioName,
    lastSeen: bridgeStatus.lastSeen,
    activeSessionId,
    activeSession,
    sessions: sessionsList,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Heartbeat from StudioBridge
    if (body.type === "HEARTBEAT" || typeof body.isOnline === "boolean") {
      bridgeStatus = {
        isOnline: Boolean(body.isOnline),
        studioName: body.studioName || bridgeStatus.studioName,
        lastSeen: Date.now(),
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      };
      return NextResponse.json({ success: true, acknowledged: true, bridgeStatus });
    }

    // Session switching
    if (body.action === "SWITCH_SESSION" && body.sessionId) {
      activeSessionId = body.sessionId;
      return NextResponse.json({ success: true, activeSessionId });
    }

    // Door Toggle (Button 6: Otvori/Zatvori vrata)
    if (body.action === "TOGGLE_DOOR") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.isDoorOpen = typeof body.isOpen === "boolean" ? body.isOpen : !s.isDoorOpen;
        return NextResponse.json({ success: true, isDoorOpen: s.isDoorOpen });
      }
    }

    // ON AIR Toggle (Button 5: REC ON AIR)
    if (body.action === "TOGGLE_ON_AIR") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.isOnAir = typeof body.isOnAir === "boolean" ? body.isOnAir : !s.isOnAir;
        if (s.isOnAir) s.recStartTime = Date.now();
        else s.recStartTime = null;
        return NextResponse.json({ success: true, isOnAir: s.isOnAir, recStartTime: s.recStartTime });
      }
    }

    // Video Preview Toggle (Slika 1: Video ON/OFF)
    if (body.action === "TOGGLE_VIDEO") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.videoEnabled = typeof body.enabled === "boolean" ? body.enabled : !s.videoEnabled;
        return NextResponse.json({ success: true, videoEnabled: s.videoEnabled });
      }
    }

    // Take Status update (Slika 4: Oznaka tejka: final / alt / rejected / none)
    if (body.action === "SET_TAKE_STATUS") {
      const { segmentId, takeId, status } = body;
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        const seg = s.segments.find((x) => x.id === segmentId);
        if (seg) {
          const t = seg.takes.find((x) => x.id === takeId);
          if (t) t.status = status;
          return NextResponse.json({ success: true, segment: seg });
        }
      }
    }

    // Add new take to segment (Slika 4: Dinamički tejkovi)
    if (body.action === "ADD_TAKE") {
      const { segmentId, name } = body;
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        const seg = s.segments.find((x) => x.id === segmentId);
        if (seg) {
          const nextId = seg.takes.length > 0 ? Math.max(...seg.takes.map((t) => t.id)) + 1 : 1;
          const newTake: SessionTake = {
            id: nextId,
            name: name || `Tejk ${nextId}`,
            status: "none",
          };
          seg.takes.push(newTake);
          return NextResponse.json({ success: true, take: newTake, segment: seg });
        }
      }
    }

    // Schedule new session from Reception
    if (body.action === "CREATE_SESSION") {
      const { projectName, clientName, speakerName, date, time } = body;
      const newSession: SessionItem = {
        id: `sess-${Date.now()}`,
        projectName: projectName || "Novi Projekat",
        clientName: clientName || "Klijent",
        speakerName: speakerName || "Spiker",
        date: date || new Date().toISOString().split("T")[0],
        time: time || "12:00",
        isDoorOpen: false,
        isOnAir: false,
        videoEnabled: false,
        recStartTime: null,
        segments: [
          {
            id: "seg-1",
            title: "Spot 1",
            text: "Unesite tekst scenarija ovdje...",
            targetDuration: "30s",
            takes: [{ id: 1, name: "Tejk 1", status: "none" }],
          },
        ],
      };
      sessionsList.push(newSession);
      return NextResponse.json({ success: true, session: newSession });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
