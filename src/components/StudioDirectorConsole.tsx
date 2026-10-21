"use client";

import React, { useState, useEffect, useRef } from "react";
import FluxaxNetLogo from "@/components/FluxaxNetLogo";
import {
  Sliders,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Tv,
  CheckCircle,
  Users,
  Settings,
  Sparkles,
  Headphones,
  DoorOpen,
  DoorClosed,
  Clock,
  Play,
  Square,
  Plus,
  Star,
  Trash2,
  Download,
  Info,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { SessionItem, SessionTake } from "@/app/api/studio/status/route";

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
  // StudioBridge Daemon Connection & Live VU
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(true);
  const [masterVuL, setMasterVuL] = useState<number>(0);
  const [masterVuR, setMasterVuR] = useState<number>(0);
  const [masterDbL, setMasterDbL] = useState<string>("-inf dB");
  const [masterDbR, setMasterDbR] = useState<string>("-inf dB");

  // Tačka 4: Talkback Tonca je ON / OFF Toggle
  const [talkbackOn, setTalkbackOn] = useState<boolean>(false);

  // Tačka 5: REC ON AIR Stanje & Timer
  const [isOnAir, setIsOnAir] = useState<boolean>(session.isOnAir || false);
  const [recElapsedSeconds, setRecElapsedSeconds] = useState<number>(0);

  // Tačka 6: Vrata Studija (Lobby Access)
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(session.isDoorOpen || false);

  // Video Preview ON / OFF (Slika 1)
  const [isVideoOn, setIsVideoOn] = useState<boolean>(session.videoEnabled || false);

  // Komunikacijski nivoi (Tačka 2)
  const [volCR, setVolCR] = useState<number>(85);
  const [volBooth, setVolBooth] = useState<number>(75);
  const [volClient, setVolClient] = useState<number>(90);

  // Fleksibilni Tejkovi po Segmentima (Slika 4)
  const [segments, setSegments] = useState(session.segments || []);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);

  // Live Clock
  const [clockTime, setClockTime] = useState(new Date());

  // WebSocket connect to StudioBridge for real hardware meters
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const host = window.location.hostname || "127.0.0.1";
      ws = new WebSocket(`ws://${host}:4040/ws`);

      ws.onopen = () => setIsBridgeOnline(true);
      ws.onclose = () => setIsBridgeOnline(false);

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "METERS_TICK") {
            // Master stream: take Output 7/8 or Output 1/2 from hardware
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
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Timer loop when ON AIR is active
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date());
      if (isOnAir) {
        setRecElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnAir]);

  // Tačka 5: Toggle REC ON AIR
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

  // Tačka 6: Toggle Vrata Studija (Otvori / Zatvori)
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

  // Video Preview Toggle
  const handleToggleVideo = async () => {
    const nextVid = !isVideoOn;
    setIsVideoOn(nextVid);
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_VIDEO", enabled: nextVid }),
      });
      onUpdateSession();
    } catch (_) {}
  };

  // Add Take to Active Segment
  const handleAddTake = async (segId: string) => {
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_TAKE", segmentId: segId }),
      });
      const data = await res.json();
      if (data.success && data.segment) {
        setSegments((prev) =>
          prev.map((s) => (s.id === segId ? data.segment : s))
        );
        onUpdateSession();
      }
    } catch (_) {}
  };

  // Change Take Status
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
        setSegments((prev) =>
          prev.map((s) => (s.id === segId ? data.segment : s))
        );
        onUpdateSession();
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

  const currentSegment = segments[activeSegmentIndex] || segments[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* =========================================================================
          TOP MASTER CONTROL BAR (Tačke 5, 6, 7 & Status)
      ========================================================================= */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <FluxaxNetLogo size="sm" />
          <div className="border-l border-stone-800 pl-3">
            <div className="text-sm font-bold text-white leading-tight flex items-center gap-2">
              <span>{session.projectName}</span>
              <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 font-semibold">
                REŽIJA
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              Naručilac: <strong className="text-stone-300">{session.clientName}</strong> • Spiker:{" "}
              <strong className="text-cyan-400">{session.speakerName}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls in Topbar */}
        <div className="flex items-center gap-3">
          {/* StudioBridge Connection Indicator */}
          <div
            title="Veza sa lokalnim StudioBridge hardverom (port :4040)"
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isBridgeOnline
                ? "bg-emerald-950 text-emerald-400 border-emerald-600/60 shadow-sm shadow-emerald-500/20"
                : "bg-stone-800 text-stone-400 border-stone-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isBridgeOnline ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
            <span>{isBridgeOnline ? "BRIDGE ONLINE" : "BRIDGE OFFLINE"}</span>
          </div>

          {/* Tačka 5: REC ON AIR Toggle */}
          <button
            onClick={handleToggleOnAir}
            className={`px-5 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
              isOnAir
                ? "bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse shadow-red-600/40"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnAir ? "bg-white" : "bg-red-500"}`} />
            <span>{isOnAir ? "● REC ON AIR" : "○ REC STANDBY"}</span>
          </button>

          {/* Tačka 6: Otvaranje / Zatvaranje Vrata */}
          <button
            onClick={handleToggleDoor}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isDoorOpen
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-600 hover:bg-emerald-900"
                : "bg-amber-950/80 text-amber-400 border-amber-600 hover:bg-amber-900"
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
            <span>{isDoorOpen ? "VRATA OTVORENA" : "PRED VRATIMA"}</span>
          </button>

          {/* Tačka 7: Odjavi se i završi termin */}
          <button
            onClick={onExitSession}
            title="Odjavi se iz režije i zatvori termin"
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-stone-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Završi Termin</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN STUDIO WORKSPACE
      ========================================================================= */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ROW 1: MASTER VU & MONITORING & VIDEO TOGGLE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Slika 1, Tačka 1: OUTGOING MASTER STREAM VU-METER */}
          <div className="lg:col-span-8 bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Outgoing Master Audio Stream (Ka Klijentima)
                </span>
                <span
                  title="Stvarni hardverski signal izlazne matrice StudioBridge-a"
                  className="cursor-help text-stone-500 hover:text-cyan-400"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-[10px] font-mono text-stone-400">
                48.0 kHz / 24-bit Broadcast
              </div>
            </div>

            {/* Stereo VU Bars */}
            <div className="space-y-2.5 my-2">
              <div className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs font-bold text-stone-400">L</span>
                <div className="flex-1 h-3.5 bg-black rounded border border-stone-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                    style={{ width: `${masterVuL}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-xs font-bold text-cyan-400">{masterDbL}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs font-bold text-stone-400">R</span>
                <div className="flex-1 h-3.5 bg-black rounded border border-stone-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                    style={{ width: `${masterVuR}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-xs font-bold text-cyan-400">{masterDbR}</span>
              </div>
            </div>

            {/* VU Scale Markers */}
            <div className="flex justify-between text-[9px] font-mono text-stone-500 px-7">
              <span>-60</span>
              <span>-40</span>
              <span>-20</span>
              <span>-12</span>
              <span>-6</span>
              <span>-2</span>
              <span>0 dBFS</span>
            </div>

            {/* Tačka 4: TONAC TALKBACK TOGGLE (ON / OFF) */}
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
              <div className="text-xs text-stone-400">
                Komunikacija: <strong className="text-stone-200">Režija $\leftrightarrow$ Glumačka soba $\leftrightarrow$ Klijenti</strong>
              </div>

              <button
                onClick={() => setTalkbackOn(!talkbackOn)}
                className={`py-2 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-md ${
                  talkbackOn
                    ? "bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 shadow-amber-500/30"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                }`}
              >
                {talkbackOn ? <Mic className="w-4 h-4 fill-current" /> : <MicOff className="w-4 h-4" />}
                <span>{talkbackOn ? "🔴 TALKBACK UKLJUČEN" : "⚪ TALKBACK ISKLJUČEN"}</span>
              </button>
            </div>
          </div>

          {/* Tačka 2: KOMUNIKACIJSKI MIKSER PRESLUŠAVANJA */}
          <div className="lg:col-span-4 bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Preslušavanje (Monitoring)
                </span>
              </div>
            </div>

            <div className="space-y-4 my-auto">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-semibold">Režija Zvučnici (CR):</span>
                  <span className="font-mono text-cyan-400 font-bold">{volCR}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volCR}
                  onChange={(e) => setVolCR(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-stone-950 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-semibold">Slušalice Spikera (Booth):</span>
                  <span className="font-mono text-amber-400 font-bold">{volBooth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volBooth}
                  onChange={(e) => setVolBooth(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-stone-950 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-semibold">Klijentski Laptopi (Stream):</span>
                  <span className="font-mono text-emerald-400 font-bold">{volClient}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volClient}
                  onChange={(e) => setVolClient(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-stone-950 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="text-[10px] text-stone-500 pt-3 border-t border-stone-800 flex justify-between">
              <span>Zero-Bleed zaštićeno</span>
              <span className="text-stone-400">LAN / WebRTC</span>
            </div>
          </div>
        </div>

        {/* ROW 2: VIDEO / STUDIO RADIO INFO BOX (Slika 1 & Slika 2) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Header with Video Toggle Switch */}
          <div className="px-5 py-3 bg-stone-800/60 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Vizuelni Prikaz za Klijenta
              </span>
              <span
                title="Isključite kada se snima radio/glasovni materijal bez videa. Klijent tada vidi pregledan studio info box sa satom i štopericom."
                className="cursor-help text-stone-500 hover:text-cyan-400"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Video ON / OFF Switch */}
            <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={handleToggleVideo}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isVideoOn ? "bg-cyan-500 text-stone-950" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Audio / Radio (Info Box)
              </button>
              <button
                onClick={handleToggleVideo}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isVideoOn ? "bg-cyan-500 text-stone-950" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Video Preview (Slika)
              </button>
            </div>
          </div>

          {/* Body: Either Video Window or Studio Info Box */}
          {isVideoOn ? (
            <div className="p-8 text-center bg-black/60 flex flex-col items-center justify-center min-h-[220px]">
              <Tv className="w-12 h-12 text-cyan-400 mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-white mb-1">
                Video prozor iz montažnog / DAW programa
              </h4>
              <p className="text-xs text-stone-400 max-w-md">
                Klijenti u realnom vremenu prate video sinhronizovan sa tonom (1080p, ultra-low latency).
              </p>
            </div>
          ) : (
            /* STUDIO RADIO INFO BOX (Veliki info panel umjesto praznog ekrana) */
            <div className="p-8 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                  Projekat / Kampanja
                </span>
                <h3 className="text-xl font-bold text-white">{session.projectName}</h3>
                <span className="text-xs text-stone-400 block mt-1">
                  Naručilac: <strong className="text-stone-200">{session.clientName}</strong>
                </span>
              </div>

              <div className="text-center md:border-x md:border-stone-800 px-4">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                  Status Snimanja
                </span>
                {isOnAir ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950 border border-red-600 text-red-400 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>ON AIR - SNIMA SE</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold">
                    <span>Spreman za tejk</span>
                  </div>
                )}
                <div className="font-mono text-2xl font-black text-cyan-400 mt-2">
                  {formatTimer(recElapsedSeconds)}
                </div>
                <span className="text-[10px] text-stone-500 font-mono">Trajanje tejka</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                  Tačno Vrijeme Studija
                </span>
                <div className="font-mono text-xl font-bold text-stone-200" suppressHydrationWarning>
                  {clockTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <span className="text-xs text-cyan-400 block mt-1 font-medium">
                  Spiker: {session.speakerName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ROW 3: SCENARIO & FLEKSIBILNI TEJKOVI PO SEGMENTIMA (Slika 4) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Scenario & Dinamički Tejkovi po Cjelinama</span>
                <span
                  title="Kliknite na segment (Intro, Tijelo, Outro) da biste vidjeli i dodavali tejkove samo za taj dio."
                  className="cursor-help text-stone-500 hover:text-cyan-400"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </h4>
              <p className="text-[11px] text-stone-400">
                Označite ⭐ Odabran za final, 🟡 Rezervu ili ❌ Odbijen tejk
              </p>
            </div>

            {/* Segment Selector Tabs (Intro / Tijelo / Outro) */}
            <div className="flex items-center gap-2">
              {segments.map((seg, idx) => (
                <button
                  key={seg.id}
                  onClick={() => setActiveSegmentIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeSegmentIndex === idx
                      ? "bg-cyan-500 text-stone-950 border-cyan-400 shadow-sm"
                      : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
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
              <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs text-stone-400 mb-2">
                  <span className="font-bold text-white">{currentSegment.title}</span>
                  <span className="font-mono text-cyan-400">{currentSegment.targetDuration}</span>
                </div>
                <p className="text-sm text-stone-200 leading-relaxed font-serif">
                  „{currentSegment.text}“
                </p>
              </div>

              {/* Takes List for this segment */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-xs font-bold text-stone-400 mr-1">Tejkovi:</span>
                {currentSegment.takes.map((take) => (
                  <div
                    key={take.id}
                    className="inline-flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs font-medium"
                  >
                    <span className="font-mono text-white font-bold">{take.name}</span>

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
                          ? "bg-emerald-500 text-stone-950"
                          : "text-stone-400 hover:text-emerald-400"
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
                          ? "bg-amber-500 text-stone-950"
                          : "text-stone-400 hover:text-amber-400"
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
                          : "text-stone-500 hover:text-red-400"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add new take button */}
                <button
                  onClick={() => handleAddTake(currentSegment.id)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novi Tejk</span>
                </button>
              </div>
            </div>
          )}

          {/* Download Final Button (Slika 5) */}
          {session.fluxaDownloadUrl && (
            <div className="mt-5 pt-4 border-t border-stone-800 flex justify-end">
              <a
                href={session.fluxaDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-cyan-400 border border-stone-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Preuzmi Gotove Master Fajlove (Fluxa Drive)</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
