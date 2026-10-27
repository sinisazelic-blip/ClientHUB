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

export interface ProjectFileItem {
  id: string;
  name: string;
  size: string;
  type: "audio" | "video" | "doc";
  uploadedAt: string;
  url: string;
  uploadedBy?: string;
}

export interface SessionAttendee {
  id: string;
  name: string;
  role: "studio_director" | "agency_tenant" | "guest_participant" | "speaker";
  company?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

export interface SessionBilling {
  status: "active" | "stopped" | "idle";
  startedAt: number | null;
  totalElapsedSeconds: number;
  hourlyRateEur: number;
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
  focusMode: "audio" | "video"; // Video screening focus vs Audio focus
  recStartTime: number | null;
  fluxaDownloadUrl?: string;
  segments: SessionSegment[];
  attendees: SessionAttendee[];
  projectFiles: ProjectFileItem[];
  billing: SessionBilling;
}

// Global in-memory state
let bridgeStatus = {
  isOnline: true,
  studioName: "Studio TAF",
  directorPin: "2424",
  language: "bs",
  lastSeen: Date.now(),
  ip: "127.0.0.1",
  meters: {
    masterVuL: 0,
    masterVuR: 0,
    masterDbL: "-inf dB",
    masterDbR: "-inf dB",
  },
};

// Independent talkback state tracking per role
let roleTalkbacks = {
  agency_tenant: false,
  guest_participant: false,
  studio_director: false,
};

let sessionsList: SessionItem[] = [
  {
    id: "taf-coca-cola-2026",
    projectName: "Coca-Cola (Ljetna kampanja 2026)",
    clientName: "Saatchi & Saatchi / Media Focus",
    speakerName: "Goran (Glavni glas)",
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    isDoorOpen: true,
    isOnAir: false,
    videoEnabled: false,
    focusMode: "audio",
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-coca-cola-final",
    billing: {
      status: "active",
      startedAt: Date.now() - 25 * 60 * 1000,
      totalElapsedSeconds: 1500,
      hourlyRateEur: 75,
    },
    attendees: [
      { id: "att-dir", name: "Režija (Siniša)", role: "studio_director", company: "Studio TAF", isMuted: false, isSpeaking: false },
      { id: "att-spk", name: "Goran (Spiker)", role: "speaker", company: "Glumačka soba", isMuted: false, isSpeaking: true },
      { id: "att-naru", name: "Saatchi & Saatchi", role: "agency_tenant", company: "Naručilac", isMuted: false, isSpeaking: false },
      { id: "att-1", name: "Jasna V.", role: "guest_participant", company: "Coca-Cola Brand Mgr", isMuted: true, isSpeaking: false },
      { id: "att-2", name: "Petar M.", role: "guest_participant", company: "Kreativni direktor", isMuted: true, isSpeaking: false },
      { id: "att-3", name: "John S.", role: "guest_participant", company: "Regional Supervisor", isMuted: true, isSpeaking: false },
      { id: "att-4", name: "Ana K.", role: "guest_participant", company: "Copywriter", isMuted: true, isSpeaking: false },
    ],
    projectFiles: [
      { id: "f-1", name: "CocaCola_Take2_Master_48k24b.wav", size: "24.6 MB", type: "audio", uploadedAt: "20:45", url: "#" },
      { id: "f-2", name: "CocaCola_Summer_Cut_v3_1080p.mp4", size: "142.1 MB", type: "video", uploadedAt: "20:35", url: "#" },
      { id: "f-3", name: "Scenario_i_Timing_Odobreno.pdf", size: "1.2 MB", type: "doc", uploadedAt: "20:25", url: "#" },
    ],
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
    time: "18:00",
    isDoorOpen: false,
    isOnAir: false,
    videoEnabled: false,
    focusMode: "audio",
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-intesa",
    billing: {
      status: "idle",
      startedAt: null,
      totalElapsedSeconds: 0,
      hourlyRateEur: 75,
    },
    attendees: [
      { id: "att-dir2", name: "Režija", role: "studio_director", company: "Studio TAF", isMuted: false, isSpeaking: false },
      { id: "att-spk2", name: "Jelena (Spiker)", role: "speaker", company: "Glumačka soba", isMuted: false, isSpeaking: false },
      { id: "att-naru2", name: "McCann Beograd", role: "agency_tenant", company: "Naručilac", isMuted: false, isSpeaking: false },
    ],
    projectFiles: [
      { id: "f-4", name: "Intesa_Radio_Scenario_v1.pdf", size: "0.8 MB", type: "doc", uploadedAt: "19:00", url: "#" },
    ],
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
  const isOnline = bridgeStatus.isOnline && !isStale;
  const activeSession = sessionsList.find((s) => s.id === activeSessionId) || sessionsList[0];

  return NextResponse.json({
    success: true,
    isOnline,
    studioName: bridgeStatus.studioName,
    language: bridgeStatus.language,
    lastSeen: bridgeStatus.lastSeen,
    meters: isOnline ? bridgeStatus.meters : { masterVuL: 0, masterVuR: 0, masterDbL: "-inf dB", masterDbR: "-inf dB" },
    activeSessionId,
    activeSession,
    sessions: sessionsList,
    roleTalkbacks,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Role-specific Talkback toggle
    if (body.action === "SET_TALKBACK" && body.role) {
      if (body.role === "agency_tenant") {
        roleTalkbacks.agency_tenant = Boolean(body.active);
      } else if (body.role === "guest_participant") {
        roleTalkbacks.guest_participant = Boolean(body.active);
      } else if (body.role === "studio_director") {
        roleTalkbacks.studio_director = Boolean(body.active);
      }
      return NextResponse.json({ success: true, roleTalkbacks });
    }

    // Verify Director PIN against active studio's configured PIN
    if (body.action === "VERIFY_DIRECTOR_PIN") {
      const pin = String(body.pin || "").trim();
      const currentPin = (bridgeStatus.directorPin || "2424").trim();
      const valid = pin.length > 0 && pin === currentPin;
      return NextResponse.json({ success: true, valid });
    }

    // Heartbeat from StudioBridge
    if (body.type === "HEARTBEAT" || typeof body.isOnline === "boolean") {
      bridgeStatus = {
        isOnline: Boolean(body.isOnline),
        studioName: typeof body.studioName === "string" ? body.studioName : bridgeStatus.studioName,
        language: typeof body.language === "string" ? body.language : bridgeStatus.language,
        directorPin: typeof body.directorPin === "string" && body.directorPin.trim() ? body.directorPin.trim() : bridgeStatus.directorPin,
        lastSeen: Date.now(),
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        meters: body.meters || bridgeStatus.meters,
      };
      return NextResponse.json({ success: true, acknowledged: true, bridgeStatus });
    }

    // Session switching
    if (body.action === "SWITCH_SESSION" && body.sessionId) {
      activeSessionId = body.sessionId;
      return NextResponse.json({ success: true, activeSessionId });
    }

    // Door Toggle (Otvori/Zatvori vrata)
    if (body.action === "TOGGLE_DOOR") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.isDoorOpen = typeof body.isOpen === "boolean" ? body.isOpen : !s.isDoorOpen;
        if (s.isDoorOpen && s.billing.status !== "active") {
          s.billing.status = "active";
          if (!s.billing.startedAt) s.billing.startedAt = Date.now();
        }
        return NextResponse.json({ success: true, isDoorOpen: s.isDoorOpen, billing: s.billing });
      }
    }

    // ON AIR Toggle (REC ON AIR)
    if (body.action === "TOGGLE_ON_AIR") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.isOnAir = typeof body.isOnAir === "boolean" ? body.isOnAir : !s.isOnAir;
        if (s.isOnAir) {
          s.recStartTime = Date.now();
          if (s.billing.status !== "active") {
            s.billing.status = "active";
            if (!s.billing.startedAt) s.billing.startedAt = Date.now();
          }
        } else {
          s.recStartTime = null;
        }
        return NextResponse.json({ success: true, isOnAir: s.isOnAir, recStartTime: s.recStartTime });
      }
    }

    // Focus Mode Toggle (Audio Focus vs Video Screening Focus)
    if (body.action === "SET_FOCUS_MODE" && body.focusMode) {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.focusMode = body.focusMode === "video" ? "video" : "audio";
        s.videoEnabled = s.focusMode === "video";
        return NextResponse.json({ success: true, focusMode: s.focusMode, videoEnabled: s.videoEnabled });
      }
    }

    // Video Preview Toggle
    if (body.action === "TOGGLE_VIDEO") {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.videoEnabled = typeof body.enabled === "boolean" ? body.enabled : !s.videoEnabled;
        s.focusMode = s.videoEnabled ? "video" : "audio";
        return NextResponse.json({ success: true, videoEnabled: s.videoEnabled, focusMode: s.focusMode });
      }
    }

    // Billing Timer Control
    if (body.action === "SET_BILLING_STATUS" && body.status) {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        s.billing.status = body.status;
        if (body.status === "active" && !s.billing.startedAt) {
          s.billing.startedAt = Date.now();
        } else if (body.status === "stopped" || body.status === "idle") {
          s.billing.startedAt = null;
        }
        return NextResponse.json({ success: true, billing: s.billing });
      }
    }

    // Attendee Mute / Toggle
    if (body.action === "TOGGLE_ATTENDEE_MUTE" && body.attendeeId) {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        const att = s.attendees.find((a) => a.id === body.attendeeId);
        if (att) {
          att.isMuted = typeof body.isMuted === "boolean" ? body.isMuted : !att.isMuted;
          return NextResponse.json({ success: true, attendee: att });
        }
      }
    }

    // Project File Add
    if (body.action === "ADD_PROJECT_FILE" && body.file) {
      const s = sessionsList.find((x) => x.id === activeSessionId);
      if (s) {
        const newFile: ProjectFileItem = {
          id: `f-${Date.now()}`,
          name: body.file.name || "Export_Take.wav",
          size: body.file.size || "15 MB",
          type: body.file.type || "audio",
          uploadedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          url: body.file.url || "#",
          uploadedBy: body.file.uploadedBy || "Studio",
        };
        s.projectFiles.unshift(newFile);
        return NextResponse.json({ success: true, file: newFile, projectFiles: s.projectFiles });
      }
    }

    // Take Status update
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

    // Add new take to segment
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
        focusMode: "audio",
        recStartTime: null,
        billing: {
          status: "idle",
          startedAt: null,
          totalElapsedSeconds: 0,
          hourlyRateEur: 75,
        },
        attendees: [
          { id: `att-dir-${Date.now()}`, name: "Režija", role: "studio_director", company: "Studio TAF", isMuted: false },
          { id: `att-spk-${Date.now()}`, name: speakerName || "Spiker", role: "speaker", company: "Glumačka soba", isMuted: false },
          { id: `att-cli-${Date.now()}`, name: clientName || "Naručilac", role: "agency_tenant", company: "Klijent", isMuted: false },
        ],
        projectFiles: [],
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
      activeSessionId = newSession.id;
      return NextResponse.json({ success: true, session: newSession, activeSessionId: newSession.id });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
