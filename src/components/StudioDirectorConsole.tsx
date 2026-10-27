"use client";

import React, { useState, useEffect, useRef } from "react";
import FluxaxNetLogo from "@/components/FluxaxNetLogo";
import {
  Sliders,
  Mic,
  MicOff,
  Radio,
  Tv,
  DoorOpen,
  DoorClosed,
  Plus,
  Star,
  Trash2,
  Download,
  Info,
  LogOut,
  ExternalLink,
  Video,
  Monitor,
  Share2,
  FileAudio,
  FileVideo,
  FileText,
  Volume2,
  VolumeX,
  Maximize2,
  Users,
  Timer,
  Euro,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Copy,
  Check,
  Wrench,
} from "lucide-react";
import StudioPreFlightModal from "@/components/StudioPreFlightModal";
import {
  SessionItem,
  SessionTake,
  SessionAttendee,
  ProjectFileItem,
} from "@/app/api/studio/status/route";
import { format24Time } from "@/lib/formatTime";
import { APP_CONFIG } from "@/config/appConfig";
import { realtimeAudioMeter } from "@/lib/realtimeAudioMeter";

interface StudioDirectorConsoleProps {
  session: SessionItem;
  onExitSession: () => void;
  onUpdateSession: () => void;
}

export default function StudioDirectorConsole({
  session,
  onExitSession,
  onUpdateSession,
}: StudioDirectorConsoleProps) {
  // StudioBridge Connection & Master VU
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(true);
  const [masterVuL, setMasterVuL] = useState<number>(0);
  const [masterVuR, setMasterVuR] = useState<number>(0);
  const [masterDbL, setMasterDbL] = useState<string>("-inf dB");
  const [masterDbR, setMasterDbR] = useState<string>("-inf dB");
  const rawVuLRef = useRef<number>(0);
  const rawVuRRef = useRef<number>(0);
  const volClientRef = useRef<number>(90);

  const applyVuLevels = (rawL: number, rawR: number, currentVol: number) => {
    rawVuLRef.current = rawL;
    rawVuRRef.current = rawR;
    if (currentVol <= 0) {
      setMasterVuL(0);
      setMasterVuR(0);
      setMasterDbL("-inf dB");
      setMasterDbR("-inf dB");
      return;
    }
    const mult = Math.pow(currentVol / 100, 1.8);
    const finalL = Math.min(100, Math.max(0, Math.round(rawL * mult)));
    const finalR = Math.min(100, Math.max(0, Math.round(rawR * mult)));
    setMasterVuL(finalL);
    setMasterVuR(finalR);
    if (finalL <= 0) {
      setMasterDbL("-inf dB");
    } else {
      const db = -60 + (finalL / 100) * 60;
      setMasterDbL(`${db.toFixed(1)} dB`);
    }
    if (finalR <= 0) {
      setMasterDbR("-inf dB");
    } else {
      const db = -60 + (finalR / 100) * 60;
      setMasterDbR(`${db.toFixed(1)} dB`);
    }
  };

  // Talkback Tonca ON / OFF Toggle
  const [talkbackOn, setTalkbackOn] = useState<boolean>(false);

  // REC ON AIR Stanje & Timer
  const [isOnAir, setIsOnAir] = useState<boolean>(session.isOnAir || false);
  const [recElapsedSeconds, setRecElapsedSeconds] = useState<number>(0);

  // Vrata Studija (Lobby Access)
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(session.isDoorOpen || false);

  // Focus Mode: Audio Focus vs Video Screening Focus (Videographer Son's feature)
  const [focusMode, setFocusMode] = useState<"audio" | "video">(session.focusMode || "audio");

  // Komunikacijski nivoi (čuvaju nivoe audio interfejs izlaza)
  const [volCR, setVolCR] = useState<number>(85);
  const [volBooth, setVolBooth] = useState<number>(75);
  const [volClient, setVolClient] = useState<number>(90);

  // Fleksibilni Tejkovi po Segmentima
  const [segments, setSegments] = useState(session.segments || []);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);

  // Multi-Client Attendees & Project Files
  const [attendees, setAttendees] = useState<SessionAttendee[]>(session.attendees || []);
  const [projectFiles, setProjectFiles] = useState<ProjectFileItem[]>(session.projectFiles || []);
  const [exchangeFolder, setExchangeFolder] = useState<string>("D:\\AudioProjects\\Intesa2026");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fluxax_exchange_folder");
      if (saved) setExchangeFolder(saved);
    }
  }, []);

  const handlePickExchangeFolder = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const folderName = "D:\\AudioProjects\\" + dirHandle.name;
          setExchangeFolder(folderName);
          localStorage.setItem("fluxax_exchange_folder", folderName);
          return;
        }
      }
    } catch (_) {}
    const manual = window.prompt("Unesite ili potvrdite lokalnu putanju foldera za razmjenu materijala:", exchangeFolder);
    if (manual && manual.trim()) {
      setExchangeFolder(manual.trim());
      localStorage.setItem("fluxax_exchange_folder", manual.trim());
    }
  };

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("uploadedBy", "Studio TAF (Režija)");
      formData.append("sessionId", session.id || "taf-coca-cola-2026");

      const res = await fetch("/api/studio/upload-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setProjectFiles((prev) => [...data.files, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Screen / Video Share Stream
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Session Billing Timer
  const [sessionBillingElapsed, setSessionBillingElapsed] = useState<number>(
    session.billing?.totalElapsedSeconds || 0
  );
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Live Clock
  const [clockTime, setClockTime] = useState(new Date());

  // Remote role talkback states
  const [roleTalkbacks, setRoleTalkbacks] = useState<{
    agency_tenant?: boolean;
    guest_participant?: boolean;
  }>({});

  // Studio Setup / Pre-Flight Diagnostic Modal
  const [showPreFlightModal, setShowPreFlightModal] = useState<boolean>(false);

  // Invite Links Generator Modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  const handleCopyInviteLink = (role: "agency_tenant" | "guest_participant") => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://fluxax.ba";
    const link = `${origin}/?session=${session.id}&role=${role}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkType(role);
    setTimeout(() => setCopiedLinkType(null), 2500);
  };

  const wsRef = useRef<WebSocket | null>(null);
  const [isDirectWebAudio, setIsDirectWebAudio] = useState<boolean>(false);

  // Subscribe to real-time 60 FPS Web Audio Engine on the host
  useEffect(() => {
    realtimeAudioMeter.setVolume(volClientRef.current);
    const unsubscribe = realtimeAudioMeter.subscribe((reading) => {
      setMasterVuL(reading.vuL);
      setMasterVuR(reading.vuR);
      setMasterDbL(reading.dbL);
      setMasterDbR(reading.dbR);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleDirectAudio = async () => {
    if (isDirectWebAudio) {
      realtimeAudioMeter.stopDirectHardwareAudio();
      setIsDirectWebAudio(false);
    } else {
      const ok = await realtimeAudioMeter.startDirectHardwareAudio();
      if (ok) setIsDirectWebAudio(true);
    }
  };

  // WebSocket connect to StudioBridge for real hardware meters and controls
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      // Connect to local StudioBridge daemon on 127.0.0.1
      ws = new WebSocket("ws://127.0.0.1:4040/ws");
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setIsBridgeOnline(true);
        // Request raw live audio PCM stream
        try {
          ws?.send(JSON.stringify({ type: "SUBSCRIBE_AUDIO" }));
        } catch (_) {}
      };
      ws.onclose = () => setIsBridgeOnline(false);

      ws.onmessage = (e) => {
        // Binary raw float32 PCM frame from StudioBridge
        if (e.data instanceof ArrayBuffer) {
          const pcmData = new Float32Array(e.data);
          realtimeAudioMeter.feedPcmChunk(pcmData);
          return;
        }

        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "METERS_TICK") {
            const out7 = msg.outputs?.find((o: any) => o.id === 7 || o.id === 1);
            const out8 = msg.outputs?.find((o: any) => o.id === 8 || o.id === 2);
            const rawL = out7 && typeof out7.level === "number" ? out7.level : 0;
            const rawR = out8 && typeof out8.level === "number" ? out8.level : 0;
            realtimeAudioMeter.feedLevels(rawL, rawR);
          }
          if (msg.type === "TALKBACK_STATE") {
            if (typeof msg.muted === "boolean") {
              setTalkbackOn(!msg.muted);
            }
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, []);

  // Timer loop for clock, REC timer, and session billing
  useEffect(() => {
    const fetchTalkbacks = async () => {
      try {
        const res = await fetch("/api/studio/status");
        const data = await res.json();
        if (data.roleTalkbacks) {
          setRoleTalkbacks(data.roleTalkbacks);
        }
        if (data.activeSession) {
          if (data.activeSession.attendees) setAttendees(data.activeSession.attendees);
          if (data.activeSession.projectFiles) setProjectFiles(data.activeSession.projectFiles);
          if (data.activeSession.segments) setSegments(data.activeSession.segments);
        }
        if (typeof data.isOnline === "boolean") {
          // If direct WS is not connected, use API status and relayed hardware meters
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setIsBridgeOnline(data.isOnline);
            if (data.meters) {
              const mL = data.meters.masterVuL ?? 0;
              const mR = data.meters.masterVuR ?? 0;
              realtimeAudioMeter.feedLevels(mL, mR);
            }
          }
        }
      } catch (_) {}
    };

    fetchTalkbacks();
    const timer = setInterval(() => {
      setClockTime(new Date());
      fetchTalkbacks();
      if (isOnAir) {
        setRecElapsedSeconds((prev) => prev + 1);
      }
      if (isDoorOpen || isOnAir) {
        setSessionBillingElapsed((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnAir, isDoorOpen]);

  // Video stream binding
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream, focusMode]);

  const handleToggleOnAir = async () => {
    const nextState = !isOnAir;
    setIsOnAir(nextState);
    if (!nextState) setRecElapsedSeconds(0);
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ON_AIR", isOnAir: nextState }),
      });
      onUpdateSession();
    } catch (_) {}
  };

  const handleToggleDoor = async () => {
    const nextDoor = !isDoorOpen;
    setIsDoorOpen(nextDoor);
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_DOOR", isOpen: nextDoor }),
      });
      onUpdateSession();
    } catch (_) {}
  };

  const handleToggleFocusMode = async (mode: "audio" | "video") => {
    setFocusMode(mode);
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_FOCUS_MODE", focusMode: mode }),
      });
      onUpdateSession();
    } catch (_) {}
  };

  const handleStartScreenShare = async () => {
    try {
      if (isSharingScreen && screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
        setIsSharingScreen(false);
        return;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "window",
            frameRate: { ideal: 30, max: 60 },
          },
          audio: true,
        });

        stream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
          setScreenStream(null);
        };

        setScreenStream(stream);
        setIsSharingScreen(true);
        setFocusMode("video");
      }
    } catch (_) {}
  };

  const handleToggleAttendeeMute = async (attId: string, currentMuted?: boolean) => {
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ATTENDEE_MUTE", attendeeId: attId, isMuted: !currentMuted }),
      });
      const data = await res.json();
      if (data.success && data.attendee) {
        setAttendees((prev) => prev.map((a) => (a.id === attId ? data.attendee : a)));
      }
    } catch (_) {}
  };

  const handleAddTake = async (segId: string) => {
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_TAKE", segmentId: segId }),
      });
      const data = await res.json();
      if (data.success && data.segment) {
        setSegments((prev) => prev.map((s) => (s.id === segId ? data.segment : s)));
        onUpdateSession();
      }
    } catch (_) {}
  };

  const handleSetTakeStatus = async (
    segId: string,
    takeId: number,
    status: SessionTake["status"]
  ) => {
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_TAKE_STATUS",
          segmentId: segId,
          takeId,
          status,
        }),
      });
      const data = await res.json();
      if (data.success && data.segment) {
        setSegments((prev) => prev.map((s) => (s.id === segId ? data.segment : s)));
        onUpdateSession();
      }
    } catch (_) {}
  };

  const handleSimulateExportTake = async () => {
    const takeNum = projectFiles.filter((f) => f.type === "audio").length + 1;
    const newFileName = `${session.projectName.split(" ")[0]}_Master_Take${takeNum}_48k24b.wav`;
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PROJECT_FILE",
          file: {
            name: newFileName,
            size: "24.8 MB",
            type: "audio",
            url: "#",
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.projectFiles) {
        setProjectFiles(data.projectFiles);
      }
    } catch (_) {}
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatBillingDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleTalkback = () => {
    const nextState = !talkbackOn;
    setTalkbackOn(nextState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "TALKBACK_TOGGLE",
          enabled: nextState,
          muted: !nextState,
        })
      );
    }
  };

  const handleVolCRChange = (val: number) => {
    setVolCR(val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "UPDATE_CHANNEL", channelType: "output", id: 7, level: val }));
    }
  };

  const handleVolBoothChange = (val: number) => {
    setVolBooth(val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "UPDATE_CHANNEL", channelType: "output", id: 3, level: val }));
    }
  };

  const handleVolClientChange = (val: number) => {
    setVolClient(val);
    volClientRef.current = val;
    realtimeAudioMeter.setVolume(val);
    applyVuLevels(rawVuLRef.current, rawVuRRef.current, val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "UPDATE_CHANNEL", channelType: "output", id: 1, level: val }));
    }
  };

  const currentSegment = segments[activeSegmentIndex] || segments[0];

  return (
    <div className="min-h-screen studio-light-bg text-slate-800 flex flex-col font-sans">
      {/* =========================================================================
          TOP MASTER CONTROL BAR (Light Studio Header)
      ========================================================================= */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl backdrop-blur-md text-white">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black text-white leading-tight tracking-tight">
            {session.projectName}
          </h2>
        </div>

        {/* Action Controls in Topbar (Dark Gray Professional Studio Theme) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Session Billing Timer Badge */}
          <div
            title="Aktivno vrijeme zakupa termina i snimanja"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span>{formatBillingDuration(sessionBillingElapsed)}</span>
          </div>

          {/* StudioBridge Hardware Indicator */}
          <div
            title="Veza sa lokalnim StudioBridge hardverom (port :4040)"
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              isBridgeOnline
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-600/60"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isBridgeOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>{isBridgeOnline ? "HARDWARE ONLINE" : "OFFLINE"}</span>
          </div>

          {/* IZBOR REŽIMA SNIMANJA: SAMO GLAS vs SA VIDEO PODLOGOM */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleToggleFocusMode("audio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                focusMode === "audio"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Snimanje samo glasa (Voiceover / Radio / Audio knjiga bez videa)"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Samo Glas</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleFocusMode("video")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                focusMode === "video"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Snimanje sa video podlogom (Sinkronizacija na sliku / TV spot / Video preview)"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Podloga</span>
            </button>
          </div>

          {/* REC ON AIR Toggle */}
          <button
            onClick={handleToggleOnAir}
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              isOnAir
                ? "bg-red-600 hover:bg-red-500 text-white border border-red-500 animate-pulse shadow-lg shadow-red-600/40"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnAir ? "bg-white" : "bg-red-500"}`} />
            <span>{isOnAir ? "● REC ON AIR" : "○ REC STANDBY"}</span>
          </button>

          {/* Otvaranje / Zatvaranje Vrata Studija */}
          <button
            onClick={handleToggleDoor}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
              isDoorOpen
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/60"
                : "bg-amber-950/60 text-amber-300 border-amber-600/60 hover:bg-amber-900/60"
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4 text-emerald-400" /> : <DoorClosed className="w-4 h-4 text-amber-400" />}
            <span>{isDoorOpen ? "VRATA OTVORENA" : "PRED VRATIMA"}</span>
          </button>

          {/* Setup & Hardware Kalibracija Studija */}
          <button
            onClick={() => setShowPreFlightModal(true)}
            title="Pre-flight hardverski test i kalibracija studija prije snimanja"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/80"
          >
            <Wrench className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Setup Studija</span>
          </button>

          {/* Pozivni Linkovi za Klijente i Agenciju */}
          <button
            onClick={() => setShowInviteModal(true)}
            title="Generiši i kopiraj pozivne linkove za naručioca i klijente"
            className="px-3 py-2 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-teal-600/60 shadow-2xs"
          >
            <Link2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Pozivnice</span>
          </button>

          {/* Explicit Napusti Studio / Završi Sesiju Button with Safe Modal */}
          <button
            onClick={() => setShowExitConfirm(true)}
            title="Napusti studio i vrati se u kalendar termina"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/80"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Napusti Studio</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE: FULL WIDTH WITH RIGHT VERTICAL PARTICIPANTS SIDEBAR
      ========================================================================= */}
      <main className="flex-1 p-4 sm:p-6 w-full flex flex-col xl:flex-row gap-5 items-start">
        {/* LEFT / CENTER: MAIN STUDIO WORKSPACE */}
        <div className="flex-1 min-w-0 space-y-5 w-full">

        {/* TOP ROW: MASTER VU + AUDIO INTERFACE + INFORMATIVE VIDEO MONITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
          
          {/* 1. MASTER STREAM VU-METER & TALKBACK (Col 5) */}
          <div className="lg:col-span-5 bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Master Audio Stream (Ka Klijentima)
                </span>
                <span
                  title="Stvarni hardverski signal izlazne matrice StudioBridge-a"
                  className="cursor-help text-slate-400 hover:text-teal-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleDirectAudio}
                  title="Kliknite za direktan prijem zvuka sa vaše zvučne kartice u browseru (60 FPS Web Audio)"
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    isDirectWebAudio
                      ? "bg-red-500 text-white border-red-600 animate-pulse"
                      : "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isDirectWebAudio ? "bg-white" : "bg-teal-600"}`} />
                  <span>{isDirectWebAudio ? "ASIO/WASAPI DIRECT (60 FPS)" : "48k / 24-bit PCM"}</span>
                </button>
              </div>
            </div>

            {/* Stereo VU Bars (Smooth 60 FPS analog ballistics) */}
            <div className="space-y-2.5 my-2">
              <div className="flex items-center gap-2">
                <span className="w-3 font-mono text-xs font-bold text-slate-500">L</span>
                <div className="flex-1 h-3.5 bg-slate-100 rounded border border-slate-200 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-[width] duration-75 ease-out"
                    style={{ width: `${masterVuL}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-xs font-bold text-teal-700">{masterDbL}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 font-mono text-xs font-bold text-slate-500">R</span>
                <div className="flex-1 h-3.5 bg-slate-100 rounded border border-slate-200 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-[width] duration-75 ease-out"
                    style={{ width: `${masterVuR}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-xs font-bold text-teal-700">{masterDbR}</span>
              </div>
            </div>

            {/* VU Scale Markers */}
            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-5">
              <span>-60</span>
              <span>-40</span>
              <span>-20</span>
              <span>-12</span>
              <span>-6</span>
              <span>0 dBFS</span>
            </div>

            {/* Talkback Toggle */}
            <div className="mt-4 pt-3.5 border-t border-teal-100 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                {roleTalkbacks.agency_tenant && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-900 font-bold text-[10px] animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <span>Naručilac priča</span>
                  </span>
                )}
                {roleTalkbacks.guest_participant && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 border border-teal-300 text-teal-900 font-bold text-[10px] animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    <span>Klijent priča</span>
                  </span>
                )}
                {!roleTalkbacks.agency_tenant && !roleTalkbacks.guest_participant && (
                  <span className="text-slate-600">Režija ⇄ Klijenti</span>
                )}
              </div>

              <button
                onClick={handleToggleTalkback}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                  talkbackOn
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                }`}
              >
                {talkbackOn ? <Mic className="w-3.5 h-3.5 fill-current" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{talkbackOn ? "TALKBACK UKLJUČEN" : "TALKBACK UGAŠEN"}</span>
              </button>
            </div>
          </div>

          {/* 2. AUDIO INTERFEJS / HARDWARE IZLAZI (Col 3) */}
          <div className="lg:col-span-3 bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audio Interfejs Izlazi
                </span>
              </div>
            </div>

            <div className="space-y-3.5 my-auto">
              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-700 text-[11px]">Studio (CR):</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 font-bold">1/2</span>
                  </div>
                  <span className="font-mono text-teal-700 font-bold text-xs">{volCR}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volCR}
                  onChange={(e) => handleVolCRChange(Number(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-700 text-[11px]">Spiker (Booth):</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 font-bold">3/4</span>
                  </div>
                  <span className="font-mono text-amber-700 font-bold text-xs">{volBooth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volBooth}
                  onChange={(e) => handleVolBoothChange(Number(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-700 text-[11px]">Klijenti (Stream):</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 font-bold">1/2</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold text-xs">{volClient}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volClient}
                  onChange={(e) => handleVolClientChange(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-2.5 border-t border-teal-100 flex justify-between">
              <span>Zero-Bleed</span>
              <span className="text-slate-600 font-medium">LAN / WebRTC</span>
            </div>
          </div>

          {/* 3. INFORMATIVNI VIDEO MONITOR ZA TONCA (Col 4) - KOMPAKTNI PREVIEW */}
          <div className="lg:col-span-4 bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Informativni Video Prikaz
                </span>
              </div>
            </div>

            {/* Compact Video Window */}
            <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-inner my-1">
              {isSharingScreen && screenStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    src="/branding/FluxaX animation red.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                    <p className="text-[11px] font-bold text-white leading-tight">
                      Preview
                    </p>
                    <p className="text-[9px] text-slate-300">
                      Čeka se dijeljenje ekrana
                    </p>
                  </div>
                </div>
              )}

              {isOnAir && (
                <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-400 shadow-sm animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>ON AIR</span>
                </div>
              )}
            </div>

            {/* Video Action Button & Status */}
            <div className="pt-2 border-t border-teal-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                {isSharingScreen ? "Stream aktivan ka klijentima" : "Pregled u mirovanju"}
              </span>
              <button
                onClick={handleStartScreenShare}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                  isSharingScreen
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-500"
                    : "bg-purple-600 hover:bg-purple-500 text-white border-purple-500"
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>{isSharingScreen ? "Zaustavi" : "Dijeli Ekran"}</span>
              </button>
            </div>
          </div>
        </div>


        {/* =========================================================================
            ROW 2: SCENARIO & DINAMIČKI TEJKOVI PO SEGMENTIMA
        ========================================================================= */}
        <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-teal-100 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Scenario & Dinamički Tejkovi po Cjelinama</span>
                <span
                  title="Kliknite na segment (Intro, Tijelo, Outro) da biste vidjeli i dodavali tejkove samo za taj dio."
                  className="cursor-help text-slate-400 hover:text-teal-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Naručilac i režija: označite ⭐ Odabran za final, 🟡 Rezervu ili ❌ Odbijen tejk
              </p>
            </div>

            {/* Segment Selector Tabs */}
            <div className="flex items-center gap-2">
              {segments.map((seg, idx) => (
                <button
                  key={seg.id}
                  onClick={() => setActiveSegmentIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeSegmentIndex === idx
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {seg.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Segment Content */}
          {currentSegment && (
            <div className="space-y-4">
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 shadow-inner">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span className="font-bold text-slate-900">{currentSegment.title}</span>
                  <span className="font-mono text-teal-800 font-bold">{currentSegment.targetDuration}</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-serif">
                  „{currentSegment.text}“
                </p>
              </div>

              {/* Takes List for this segment */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-xs font-bold text-slate-600 mr-1">Tejkovi:</span>
                {currentSegment.takes.map((take) => (
                  <div
                    key={take.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 text-xs font-medium"
                  >
                    <span className="font-mono text-slate-900 font-bold">{take.name}</span>

                    {/* Status Selectors */}
                    <button
                      onClick={() =>
                        handleSetTakeStatus(
                          currentSegment.id,
                          take.id,
                          take.status === "final" ? "none" : "final"
                        )
                      }
                      title="Označi kao Final (Odabrano)"
                      className={`p-1 rounded cursor-pointer ${
                        take.status === "final"
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-emerald-600"
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <button
                      onClick={() =>
                        handleSetTakeStatus(
                          currentSegment.id,
                          take.id,
                          take.status === "alt" ? "none" : "alt"
                        )
                      }
                      title="Označi kao Alternativa (Rezerva)"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        take.status === "alt"
                          ? "bg-amber-500 text-white"
                          : "text-slate-400 hover:text-amber-600"
                      }`}
                    >
                      ALT
                    </button>

                    <button
                      onClick={() =>
                        handleSetTakeStatus(
                          currentSegment.id,
                          take.id,
                          take.status === "rejected" ? "none" : "rejected"
                        )
                      }
                      title="Odbaci tejk"
                      className={`p-1 rounded cursor-pointer ${
                        take.status === "rejected"
                          ? "bg-red-500 text-white"
                          : "text-slate-400 hover:text-red-600"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add new take button */}
                <button
                  onClick={() => handleAddTake(currentSegment.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Novi Tejk</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            ROW 3: PROJECT SHARE / AUDIO TREZOR (INSTANT MASTER DOWNLOADS & UPLOAD)
        ========================================================================= */}
        <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleRealUpload}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-100 mb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Share2 className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Project Share / Audio Trezor (Dvosmjerna Razmjena Fajlova)
              </h4>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                Bez WeTransfer-a
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Lokalni folder za razmjenu */}
              <button
                type="button"
                onClick={handlePickExchangeFolder}
                title="Podesi ili izaberi lokalni folder za automatsku razmjenu materijala"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>📁</span>
                <span className="font-mono text-[11px] truncate max-w-[200px]">{exchangeFolder}</span>
                <span className="text-[10px] text-teal-700 font-bold underline ml-1">Promijeni</span>
              </button>

              {/* Upload dugme */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploading ? "Šaljem fajl..." : "Pošalji Master / Export"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projectFiles.map((file) => (
              <div
                key={file.id}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    {file.type === "audio" ? (
                      <FileAudio className="w-4 h-4" />
                    ) : file.type === "video" ? (
                      <FileVideo className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span>{file.size} • {file.uploadedAt}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                        (file.uploadedBy || "").includes("Naručilac")
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {file.uploadedBy || "Studio TAF"}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={file.url}
                  download={file.name}
                  title="Preuzmi fajl direktno u lokalni folder"
                  className="p-2 rounded-lg bg-white hover:bg-teal-600 text-slate-700 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-sm ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* RIGHT: DEDICATED VERTICAL PARTICIPANTS COLUMN (GOOGLE MEET / ZOOM STYLE) */}
        <aside className="w-full xl:w-80 shrink-0 bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Učesnici u Snimanju
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono text-[10px] font-bold">
              {attendees.length}
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Studio (Tonac) */}
            <div
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                talkbackOn
                  ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/50 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    S
                  </div>
                  {talkbackOn && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Studio</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-amber-100 text-amber-900 font-semibold">Tonac</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Glavni pult</span>
                </div>
              </div>

              {/* Speaking indicator / Audio bars */}
              {talkbackOn ? (
                <div className="flex items-center gap-0.5" title="Studio govori">
                  <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>

            {/* 2. Ostali učesnici: Naručilac, Spiker, Klijenti */}
            {attendees
              .filter((att) => att.role !== "studio_director")
              .map((att) => {
                const isAgency = att.role === "agency_tenant";
                const isSpeaker = att.role === "speaker";
                const isSpeaking = att.isSpeaking || (isAgency && roleTalkbacks.agency_tenant) || (!isAgency && !isSpeaker && roleTalkbacks.guest_participant);

                return (
                  <div
                    key={att.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSpeaking
                        ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-sm shadow-emerald-500/10"
                        : "bg-slate-50/60 border-slate-200 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white shadow-xs ${
                            isSpeaker
                              ? "bg-teal-600"
                              : isAgency
                              ? "bg-purple-600"
                              : "bg-slate-700"
                          }`}
                        >
                          {att.name.charAt(0)}
                        </div>
                        {isSpeaking && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>

                      <div className="leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{att.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1 rounded font-semibold ${
                              isSpeaker
                                ? "bg-teal-100 text-teal-800"
                                : isAgency
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isSpeaker ? "Spiker" : isAgency ? "Naručilac" : "Klijent"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {att.company || (isSpeaker ? "Glumačka soba" : "Online")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active audio speaking bars (Zoom / Teams / Meet style) */}
                      {isSpeaking && (
                        <div className="flex items-center gap-0.5" title="Učesnik govori...">
                          <span className="w-1 h-3.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}

                      {/* Mute / Unmute Button */}
                      <button
                        onClick={() => handleToggleAttendeeMute(att.id, att.isMuted)}
                        title={att.isMuted ? "Uključi mikrofon učesnika" : "Privremeno utišaj učesnika"}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          att.isMuted
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-white border border-slate-200 text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {att.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>
      </main>

      {/* =========================================================================
          EXIT STUDIO CONFIRMATION MODAL
      ========================================================================= */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-teal-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Napustiti Studio?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Da li ste sigurni da želite napustiti studio i vratiti se u raspored termina?  
              Sesija i snimljeni tejkovi ostaju bezbjedno sačuvani u bazi.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Ostani u Studiju
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitSession();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-red-600/20"
              >
                Da, Izađi u Kalendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDIO PRE-FLIGHT HARDWARE DIAGNOSTIC MODAL */}
      <StudioPreFlightModal
        isOpen={showPreFlightModal}
        onClose={() => setShowPreFlightModal(false)}
        studioName="Studio TAF"
        projectName={session.projectName}
      />

      {/* INVITE LINKS GENERATOR MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-teal-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pozivni Linkovi za Sesiju</h3>
                  <p className="text-[11px] text-slate-500">{session.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pošaljite odgovarajući link učesnicima. Klijenti i naručilac se direktno priključuju u browseru bez registracije.
            </p>

            <div className="space-y-3.5">
              {/* 1. Link za Naručioca */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Link za Naručioca (Agencija)
                  </span>
                  <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-100 px-2 py-0.5 rounded">
                    Puna prava + Download
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://fluxax.ba"}/?session=${session.id}&role=agency_tenant`}
                    className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono select-all outline-none"
                  />
                  <button
                    onClick={() => handleCopyInviteLink("agency_tenant")}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {copiedLinkType === "agency_tenant" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLinkType === "agency_tenant" ? "Kopirano!" : "Kopiraj"}</span>
                  </button>
                </div>
              </div>

              {/* 2. Link za Klijente / Goste */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                    Link za Klijente (Gosti / Slušanje)
                  </span>
                  <span className="text-[10px] text-teal-700 font-mono font-bold bg-teal-100 px-2 py-0.5 rounded">
                    Slušanje + Talkback
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://fluxax.ba"}/?session=${session.id}&role=guest_participant`}
                    className="flex-1 bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono select-all outline-none"
                  />
                  <button
                    onClick={() => handleCopyInviteLink("guest_participant")}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {copiedLinkType === "guest_participant" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLinkType === "guest_participant" ? "Kopirano!" : "Kopiraj"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
