"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { SessionItem, SessionTake } from "@/app/api/studio/status/route";
import { format24Time } from "@/lib/formatTime";

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

  // Tačka 4: Talkback Tonca ON / OFF Toggle
  const [talkbackOn, setTalkbackOn] = useState<boolean>(false);

  // Tačka 5: REC ON AIR Stanje & Timer
  const [isOnAir, setIsOnAir] = useState<boolean>(session.isOnAir || false);
  const [recElapsedSeconds, setRecElapsedSeconds] = useState<number>(0);

  // Tačka 6: Vrata Studija (Lobby Access)
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(session.isDoorOpen || false);

  // Video Preview ON / OFF
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
                STUDIO
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Naručilac: <strong className="text-slate-900">{session.clientName}</strong> • Spiker:{" "}
              <strong className="text-teal-700">{session.speakerName}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls in Topbar */}
        <div className="flex items-center gap-3">
          {/* StudioBridge Connection Indicator */}
          <div
            title="Veza sa lokalnim StudioBridge hardverom (port :4040)"
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              isBridgeOnline
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isBridgeOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>{isBridgeOnline ? "BRIDGE ONLINE" : "BRIDGE OFFLINE"}</span>
          </div>

          {/* Tačka 5: REC ON AIR Toggle */}
          <button
            onClick={handleToggleOnAir}
            className={`px-5 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              isOnAir
                ? "bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse shadow-red-500/30"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnAir ? "bg-white" : "bg-red-500"}`} />
            <span>{isOnAir ? "● REC ON AIR" : "○ REC STANDBY"}</span>
          </button>

          {/* Tačka 6: Otvaranje / Zatvaranje Vrata */}
          <button
            onClick={handleToggleDoor}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
              isDoorOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4 text-emerald-600" /> : <DoorClosed className="w-4 h-4 text-amber-600" />}
            <span>{isDoorOpen ? "VRATA OTVORENA" : "PRED VRATIMA"}</span>
          </button>

          {/* Tačka 7: Odjavi se i završi termin */}
          <button
            onClick={onExitSession}
            title="Odjavi se iz režije i zatvori termin"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
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
        {/* ROW 1: MASTER VU & MONITORING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
              <div className="text-xs text-slate-600">
                Komunikacija: <strong className="text-slate-800">Režija $\leftrightarrow$ Glumačka soba $\leftrightarrow$ Klijenti</strong>
              </div>

              <button
                onClick={() => setTalkbackOn(!talkbackOn)}
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
                  Preslušavanje (Monitoring)
                </span>
              </div>
            </div>

            <div className="space-y-4 my-auto">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Režija Zvučnici (CR):</span>
                  <span className="font-mono text-teal-700 font-bold">{volCR}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volCR}
                  onChange={(e) => setVolCR(Number(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Slušalice Spikera (Booth):</span>
                  <span className="font-mono text-amber-700 font-bold">{volBooth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volBooth}
                  onChange={(e) => setVolBooth(Number(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700">Klijentski Laptopi (Stream):</span>
                  <span className="font-mono text-emerald-700 font-bold">{volClient}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volClient}
                  onChange={(e) => setVolClient(Number(e.target.value))}
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

        {/* ROW 2: VIDEO / STUDIO RADIO INFO BOX */}
        <div className="bg-white border border-teal-200/80 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with Switch */}
          <div className="px-5 py-3 bg-teal-50/60 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Vizuelni Prikaz za Klijenta
              </span>
              <span
                title="Isključite kada se snima radio/glasovni materijal bez videa. Klijent tada vidi pregledan studio info box sa satom i štopericom."
                className="cursor-help text-slate-400 hover:text-teal-600"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Video ON / OFF Switch */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handleToggleVideo}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isVideoOn ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Audio / Radio (Info Box)
              </button>
              <button
                onClick={handleToggleVideo}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isVideoOn ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Video Preview (Slika)
              </button>
            </div>
          </div>

          {/* Body */}
          {isVideoOn ? (
            <div className="p-8 text-center bg-slate-900 text-white flex flex-col items-center justify-center min-h-[220px]">
              <Tv className="w-12 h-12 text-teal-400 mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-white mb-1">
                Video prozor iz montažnog / DAW programa
              </h4>
              <p className="text-xs text-slate-300 max-w-md">
                Klijenti u realnom vremenu prate video sinhronizovan sa tonom (1080p, ultra-low latency).
              </p>
            </div>
          ) : (
            /* STUDIO RADIO INFO BOX */
            <div className="p-8 bg-gradient-to-r from-teal-50/50 via-white to-teal-50/50 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block mb-1">
                  Projekat / Kampanja
                </span>
                <h3 className="text-xl font-black text-slate-900">{session.projectName}</h3>
                <span className="text-xs text-slate-600 block mt-1">
                  Naručilac: <strong className="text-slate-900">{session.clientName}</strong>
                </span>
              </div>

              <div className="text-center md:border-x md:border-teal-100 px-4">
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block mb-1">
                  Status Snimanja
                </span>
                {isOnAir ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse shadow-md shadow-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>ON AIR - SNIMA SE</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                    <span>Spreman za tejk</span>
                  </div>
                )}
                <div className="font-mono text-2xl font-black text-teal-800 mt-2">
                  {formatTimer(recElapsedSeconds)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Trajanje tejka</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block mb-1">
                  Tačno Vrijeme Studija
                </span>
                <div className="font-mono text-xl font-bold text-slate-800" suppressHydrationWarning>
                  {format24Time(clockTime)}
                </div>
                <span className="text-xs text-teal-700 block mt-1 font-bold">
                  Spiker: {session.speakerName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ROW 3: SCENARIO & DINAMIČKI TEJKOVI PO SEGMENTIMA */}
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
                Označite ⭐ Odabran za final, 🟡 Rezervu ili ❌ Odbijen tejk
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
      </main>
    </div>
  );
}
