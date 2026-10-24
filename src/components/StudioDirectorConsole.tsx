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
} from "lucide-react";
import {
  SessionItem,
  SessionTake,
  SessionAttendee,
  ProjectFileItem,
} from "@/app/api/studio/status/route";
import { format24Time } from "@/lib/formatTime";
import { APP_CONFIG } from "@/config/appConfig";

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

  // Talkback Tonca ON / OFF Toggle
  const [talkbackOn, setTalkbackOn] = useState<boolean>(false);

  // REC ON AIR Stanje & Timer
  const [isOnAir, setIsOnAir] = useState<boolean>(session.isOnAir || false);
  const [recElapsedSeconds, setRecElapsedSeconds] = useState<number>(0);

  // Vrata Studija (Lobby Access)
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(session.isDoorOpen || false);

  // Focus Mode: Audio Focus vs Video Screening Focus (Videographer Son's feature)
  const [focusMode, setFocusMode] = useState<"audio" | "video">(session.focusMode || "audio");

  // Komunikacijski nivoi (čuvaju nivoe RME izlaza)
  const [volCR, setVolCR] = useState<number>(85);
  const [volBooth, setVolBooth] = useState<number>(75);
  const [volClient, setVolClient] = useState<number>(90);

  // Fleksibilni Tejkovi po Segmentima
  const [segments, setSegments] = useState(session.segments || []);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);

  // Multi-Client Attendees & Project Files
  const [attendees, setAttendees] = useState<SessionAttendee[]>(session.attendees || []);
  const [projectFiles, setProjectFiles] = useState<ProjectFileItem[]>(session.projectFiles || []);

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

  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connect to StudioBridge for real hardware meters and controls
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const host = window.location.hostname || "127.0.0.1";
      ws = new WebSocket(`ws://${host}:4040/ws`);
      wsRef.current = ws;

      ws.onopen = () => setIsBridgeOnline(true);
      ws.onclose = () => setIsBridgeOnline(false);

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "METERS_TICK") {
            const out7 = msg.outputs?.find((o: any) => o.id === 7 || o.id === 1);
            const out8 = msg.outputs?.find((o: any) => o.id === 8 || o.id === 2);
            if (out7) {
              setMasterVuL(out7.level);
              setMasterDbL(out7.db <= -59.5 ? "-inf dB" : `${out7.db.toFixed(1)} dB`);
            }
            if (out8) {
              setMasterVuR(out8.level);
              setMasterDbR(out8.db <= -59.5 ? "-inf dB" : `${out8.db.toFixed(1)} dB`);
            }
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
      <header className="bg-white/95 border-b border-teal-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <FluxaxNetLogo size="sm" />
          <div className="border-l border-teal-200 pl-3">
            <div className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span>{session.projectName}</span>
              <span className="text-[10px] text-teal-800 font-mono px-2 py-0.5 rounded bg-teal-100/80 border border-teal-300 font-bold">
                REŽIJA
              </span>
              <span className="text-[10px] text-teal-700 font-mono px-2 py-0.5 rounded bg-teal-50 border border-teal-200 font-bold" title="Aktivni build Client HUB-a">
                Build {APP_CONFIG.build}
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Naručilac: <strong className="text-slate-900">{session.clientName}</strong> • Spiker:{" "}
              <strong className="text-teal-700">{session.speakerName}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls in Topbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* FOCUS MODE TOGGLE: Audio Focus vs Video Screening Focus */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-inner">
            <button
              onClick={() => handleToggleFocusMode("audio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                focusMode === "audio"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Audio Fokus</span>
            </button>
            <button
              onClick={() => handleToggleFocusMode("video")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                focusMode === "video"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Screening Fokus</span>
            </button>
          </div>

          {/* Session Billing Timer Badge */}
          <div
            title="Aktivno vrijeme zakupa termina i snimanja"
            className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-teal-600 animate-spin" style={{ animationDuration: "6s" }} />
            <span>{formatBillingDuration(sessionBillingElapsed)}</span>
          </div>

          {/* StudioBridge Hardware Indicator */}
          <div
            title="Veza sa lokalnim StudioBridge hardverom (port :4040)"
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              isBridgeOnline
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isBridgeOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>{isBridgeOnline ? "HARDWARE ONLINE" : "OFFLINE"}</span>
          </div>

          {/* REC ON AIR Toggle */}
          <button
            onClick={handleToggleOnAir}
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              isOnAir
                ? "bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse shadow-red-500/30"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
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
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4 text-emerald-600" /> : <DoorClosed className="w-4 h-4 text-amber-600" />}
            <span>{isDoorOpen ? "VRATA OTVORENA" : "PRED VRATIMA"}</span>
          </button>

          {/* Explicit Napusti Režiju / Završi Sesiju Button with Safe Modal */}
          <button
            onClick={() => setShowExitConfirm(true)}
            title="Napusti režiju i vrati se u kalendar termina"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Napusti Režiju</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          DYNAMIC MULTI-CLIENT BAR (17+ ATTENDEES SUPPORT WITH ZERO-BLEED MIX-MINUS)
      ========================================================================= */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-2.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pr-3 border-r border-slate-800">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>Učesnici ({attendees.length}):</span>
          </div>

          {attendees.map((att) => {
            const isSpeaker = att.role === "speaker";
            const isDirector = att.role === "studio_director";
            const isAgency = att.role === "agency_tenant";

            return (
              <div
                key={att.id}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs ${
                  att.isSpeaking
                    ? "bg-teal-950/80 border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.5)] ring-1 ring-teal-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-200"
                }`}
              >
                {/* Initial Badge */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isDirector
                      ? "bg-amber-500 text-slate-950"
                      : isSpeaker
                      ? "bg-teal-500 text-slate-950"
                      : isAgency
                      ? "bg-purple-500 text-white"
                      : "bg-slate-600 text-white"
                  }`}
                >
                  {att.name.charAt(0)}
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-slate-100 text-[11px] flex items-center gap-1">
                    {att.name}
                    {att.isSpeaking && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {att.company || (isDirector ? "Režija" : isSpeaker ? "Glumačka soba" : "Klijent")}
                  </span>
                </div>

                {/* Mute button */}
                <button
                  onClick={() => handleToggleAttendeeMute(att.id, att.isMuted)}
                  title={att.isMuted ? "Uključi mikrofon učesnika" : "Privremeno utišaj učesnika"}
                  className={`p-1 rounded-md transition-colors cursor-pointer ml-1 ${
                    att.isMuted
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {att.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE (AUDIO FOCUS VS VIDEO SCREENING FOCUS)
      ========================================================================= */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* =====================================================================
            VIDEO SCREENING FOCUS MODE (Videographer son's DaVinci / Premiere preview)
        ===================================================================== */}
        {focusMode === "video" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 1. Large 16:9 Video Screening Cinema Frame */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
              {/* Cinema Topbar */}
              <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Video Screening Feed • 1080p Ultra-Low Latency
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700">
                    DaVinci Resolve / Premiere Pro
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Real-time Timecode Display */}
                  <div className="font-mono text-xs font-black text-amber-400 bg-black/60 px-3 py-1 rounded-lg border border-amber-500/30">
                    TC: 01:24:12:08
                  </div>

                  {/* Share Screen / Video Button */}
                  <button
                    onClick={handleStartScreenShare}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                      isSharingScreen
                        ? "bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse"
                        : "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-purple-600/30"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{isSharingScreen ? "Zaustavi Dijeljenje" : "Dijeli Montažni Ekran"}</span>
                  </button>
                </div>
              </div>

              {/* Video Player Display */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                {isSharingScreen && screenStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-8 max-w-lg space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-700/50 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                      <Tv className="w-8 h-8 opacity-90" />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Ekran za Pregled Montaže i Video Sinhronizaciju
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kliknite na dugme <strong>„Dijeli Montažni Ekran“</strong> iznad i odaberite prozor vašeg programa (Premiere Pro, DaVinci Resolve, After Effects). Klijenti prate video sinhronizovan sa tonom.
                    </p>
                    <button
                      onClick={handleStartScreenShare}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      <span>Pokreni Video Screening</span>
                    </button>
                  </div>
                )}

                {/* Overlaid Subtle REC Beacon if ON AIR */}
                {isOnAir && (
                  <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[11px] font-bold font-mono px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-2 border border-red-400 shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>REC ON AIR • {formatTimer(recElapsedSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Unobtrusive Floating Audio Control Strip at bottom of video */}
              <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  {/* Talkback quick button */}
                  <button
                    onClick={handleToggleTalkback}
                    className={`py-2 px-4 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-sm ${
                      talkbackOn
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    {talkbackOn ? <Mic className="w-4 h-4 fill-current" /> : <MicOff className="w-4 h-4" />}
                    <span>{talkbackOn ? "TALKBACK UKLJUČEN" : "TALKBACK UGAŠEN"}</span>
                  </button>

                  {/* Compact Stereo VU */}
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span>L</span>
                    <div className="w-24 h-2 bg-slate-800 rounded border border-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${masterVuL}%` }} />
                    </div>
                    <span>R</span>
                    <div className="w-24 h-2 bg-slate-800 rounded border border-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${masterVuR}%` }} />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Audio radi u pozadini (Zero-Bleed 48k Opus)</span>
                  <button
                    onClick={() => handleToggleFocusMode("audio")}
                    className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer text-xs"
                  >
                    Otvori pune fjdere
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            AUDIO FOCUS MODE: MASTER HARDWARE VU & COMMUNICATIONS
        ===================================================================== */}
        {focusMode === "audio" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
            {/* Master Stream VU-Meter */}
            <div className="lg:col-span-8 bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Outgoing Master Audio Stream (Ka Klijentima)
                  </span>
                  <span
                    title="Stvarni hardverski signal izlazne matrice StudioBridge-a"
                    className="cursor-help text-slate-400 hover:text-teal-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-500">
                  48.0 kHz / 24-bit Broadcast
                </div>
              </div>

              {/* Stereo VU Bars */}
              <div className="space-y-2.5 my-2">
                <div className="flex items-center gap-3">
                  <span className="w-4 font-mono text-xs font-bold text-slate-500">L</span>
                  <div className="flex-1 h-3.5 bg-slate-100 rounded border border-slate-200 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                      style={{ width: `${masterVuL}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs font-bold text-teal-700">{masterDbL}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-4 font-mono text-xs font-bold text-slate-500">R</span>
                  <div className="flex-1 h-3.5 bg-slate-100 rounded border border-slate-200 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                      style={{ width: `${masterVuR}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs font-bold text-teal-700">{masterDbR}</span>
                </div>
              </div>

              {/* VU Scale Markers */}
              <div className="flex justify-between text-[9px] font-mono text-slate-400 px-7">
                <span>-60</span>
                <span>-40</span>
                <span>-20</span>
                <span>-12</span>
                <span>-6</span>
                <span>-2</span>
                <span>0 dBFS</span>
              </div>

              {/* Talkback Toggle */}
              <div className="mt-4 pt-4 border-t border-teal-100 flex items-center justify-between">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>Komunikacija:</span>
                  {roleTalkbacks.agency_tenant && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-900 font-bold text-[10px] animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      <span>Naručilac priča</span>
                    </span>
                  )}
                  {roleTalkbacks.guest_participant && (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 border border-teal-300 text-teal-900 font-bold text-[10px] animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>Klijent priča</span>
                    </span>
                  )}
                  {!roleTalkbacks.agency_tenant && !roleTalkbacks.guest_participant && (
                    <strong className="text-slate-800">Režija ⇄ Glumačka soba ⇄ Klijenti</strong>
                  )}
                </div>

                <button
                  onClick={handleToggleTalkback}
                  className={`py-2 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-sm ${
                    talkbackOn
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-amber-500/20"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                  }`}
                >
                  {talkbackOn ? <Mic className="w-4 h-4 fill-current" /> : <MicOff className="w-4 h-4" />}
                  <span>{talkbackOn ? "🔴 TALKBACK UKLJUČEN" : "⚪ TALKBACK ISKLJUČEN"}</span>
                </button>
              </div>
            </div>

            {/* Preslušavanje / Monitoring */}
            <div className="lg:col-span-4 bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Preslušavanje (RME Izlazi)
                  </span>
                </div>
              </div>

              <div className="space-y-4 my-auto">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700">Režija Zvučnici (CR):</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        Izlaz 7/8
                      </span>
                    </div>
                    <span className="font-mono text-teal-700 font-bold">{volCR}%</span>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700">Slušalice Spikera (Booth):</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        Izlaz 3/4
                      </span>
                    </div>
                    <span className="font-mono text-amber-700 font-bold">{volBooth}%</span>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700">Klijentski Laptopi (Stream):</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        Izlaz 1/2
                      </span>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold">{volClient}%</span>
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

              <div className="text-[10px] text-slate-500 pt-3 border-t border-teal-100 flex justify-between">
                <span>Zero-Bleed zaštićeno</span>
                <span className="text-slate-600 font-medium">LAN / WebRTC</span>
              </div>
            </div>
          </div>
        )}

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
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-100 mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Project Share / Audio Trezor (Eksportovani Materijali)
              </h4>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                Bez WeTransfer-a
              </span>
            </div>

            <button
              onClick={handleSimulateExportTake}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
              <span>Dodaj Novi Master Export</span>
            </button>
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
                    <h5 className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {file.size} • {file.uploadedAt}
                    </span>
                  </div>
                </div>

                <a
                  href={file.url}
                  download
                  title="Preuzmi fajl direktno"
                  className="p-2 rounded-lg bg-white hover:bg-teal-600 text-slate-700 hover:text-white border border-slate-200 transition-all cursor-pointer shadow-sm ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* =========================================================================
          EXIT REŽIJA CONFIRMATION MODAL
      ========================================================================= */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-teal-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Napustiti Režiju?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Da li ste sigurni da želite napustiti kontrolnu sobu i vratiti se u raspored termina?  
              Sesija i snimljeni tejkovi ostaju bezbjedno sačuvani u bazi.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Ostani u Režiji
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
    </div>
  );
}
