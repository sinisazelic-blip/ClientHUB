"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Radio, Shield, Headphones } from "lucide-react";

interface ClaConsoleProps {
  studioName?: string;
  projectName?: string;
  speakerName?: string;
  isOnAir?: boolean;
  isTalkbackActive?: boolean;
  onTalkbackToggle?: (active: boolean) => void;
  onMicGainChange?: (gainDb: number) => void;
  onPhonesVolumeChange?: (volDb: number) => void;
}

export function ClaHardwareConsole({
  studioName = "Studio TAF",
  projectName = "Coca-Cola (Ljetna kampanja 2026)",
  speakerName = "Goran (Glavni glas)",
  isOnAir = false,
  isTalkbackActive = false,
  onTalkbackToggle,
  onMicGainChange,
  onPhonesVolumeChange,
}: ClaConsoleProps) {
  // Client controlled parameters
  const [micGain, setMicGain] = useState<number>(0);        // -10 to +10 dB
  const [phonesVol, setPhonesVol] = useState<number>(0);     // -10 to +10 dB
  const [isDimmed, setIsDimmed] = useState<boolean>(false);  // -20 dB attenuation
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoDuck, setAutoDuck] = useState<boolean>(true);   // Auto duck music during talkback
  const [monitorMode, setMonitorMode] = useState<"stereo" | "mono">("stereo");
  const [hdCodec, setHdCodec] = useState<boolean>(true);

  // Meter readings
  const [micMeterLevel, setMicMeterLevel] = useState<number>(0);
  const [streamMeterL, setStreamMeterL] = useState<number>(0);
  const [streamMeterR, setStreamMeterR] = useState<number>(0);

  // Audio Context & Mic Stream Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Microphone monitoring loop
  useEffect(() => {
    let animId: number;
    let analyser: AnalyserNode | null = null;

    if (isTalkbackActive) {
      // If client mic is active, try capturing mic or simulate active vocal modulation
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then((stream) => {
          micStreamRef.current = stream;
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);

            const data = new Uint8Array(analyser.frequencyBinCount);
            const check = () => {
              if (analyser) {
                analyser.getByteFrequencyData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i];
                const avg = sum / data.length;
                const scaled = Math.min(100, Math.round((avg / 128) * 100));
                setMicMeterLevel(scaled);
              }
              animId = requestAnimationFrame(check);
            };
            check();
          } catch (_) {}
        })
        .catch(() => {
          // Fallback simulation when mic access is denied
          const interval = setInterval(() => {
            setMicMeterLevel(Math.round(45 + Math.random() * 35));
          }, 80);
          return () => clearInterval(interval);
        });
    } else {
      setMicMeterLevel(0);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isTalkbackActive]);

  // Program Stream Meter fluctuation (simulates incoming studio broadcast audio)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMuted) {
        setStreamMeterL(0);
        setStreamMeterR(0);
        return;
      }
      const duckFactor = isTalkbackActive && autoDuck ? 0.35 : 1.0;
      const dimFactor = isDimmed ? 0.45 : 1.0;
      const base = (55 + Math.sin(Date.now() / 240) * 22 + Math.random() * 8) * duckFactor * dimFactor;
      setStreamMeterL(Math.min(94, Math.max(0, base)));
      setStreamMeterR(Math.min(92, Math.max(0, base * 0.96)));
    }, 70);
    return () => clearInterval(interval);
  }, [isMuted, isTalkbackActive, autoDuck, isDimmed]);

  const handleMicGain = (val: number) => {
    const clamped = Math.max(-10, Math.min(10, Math.round(val * 10) / 10));
    setMicGain(clamped);
    if (onMicGainChange) onMicGainChange(clamped);
  };

  const handlePhonesVol = (val: number) => {
    const clamped = Math.max(-10, Math.min(10, Math.round(val * 10) / 10));
    setPhonesVol(clamped);
    if (onPhonesVolumeChange) onPhonesVolumeChange(clamped);
  };

  const toggleTalkback = () => {
    const next = !isTalkbackActive;
    if (onTalkbackToggle) onTalkbackToggle(next);
  };

  return (
    <div className="w-full select-none font-sans">
      {/* HARDWARE RACK CHASSIS (CLA CHRIS LORD-ALGE SIGNATURE BROADCAST TERMINAL) */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-2 border-[#383e48]"
        style={{
          background: "linear-gradient(180deg, #1d2127 0%, #15181e 40%, #101216 100%)",
          maxWidth: "920px",
        }}
      >
        {/* ===================================================================== */}
        {/* 1. TOP CURVED WINE-RED FACEPLATE (CHERRY METALLIC)                    */}
        {/* ===================================================================== */}
        <div
          className="relative px-6 py-2.5 flex items-center justify-between border-b-2 border-[#150202] shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_6px_12px_rgba(0,0,0,0.6)]"
          style={{
            background:
              "linear-gradient(180deg, #b91c1c 0%, #881313 18%, #500707 65%, #2a0303 100%)",
          }}
        >
          {/* Top gloss curve highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Left: Chrome Hex Screw & Script Logo */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] p-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center">
                <div className="w-2 h-2 rounded-[2px] bg-[#64748b] rotate-45 border border-black/40" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-black italic tracking-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #cbd5e1 45%, #64748b 55%, #f8fafc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.9))",
                }}
              >
                {studioName}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-red-200/80 uppercase font-bold drop-shadow">
                RADIO MONITOR TERMINAL
              </span>
            </div>
          </div>

          {/* Right: REC ON AIR Status Beacon & Right Hex Screw */}
          <div className="flex items-center gap-4">
            {isOnAir ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 border border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] font-mono font-black tracking-widest">REC ON AIR</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/40 border border-red-950 text-red-300/60 font-mono text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                <span>STANDBY</span>
              </div>
            )}

            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] p-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center">
                <div className="w-2 h-2 rounded-[2px] bg-[#64748b] rotate-45 border border-black/40" />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. SUB-HEADER: VINTAGE PUSH BUTTONS & MONITOR STATUS                 */}
        {/* ===================================================================== */}
        <div
          className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#252a33]"
          style={{
            background: "linear-gradient(180deg, #191c22 0%, #121419 100%)",
          }}
        >
          {/* Active project and talent badge */}
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <div className="leading-tight">
              <div className="text-xs font-bold text-white tracking-wide">{projectName}</div>
              <div className="text-[10px] font-mono text-stone-400">
                Spiker: <strong className="text-emerald-400">{speakerName}</strong>
              </div>
            </div>
          </div>

          {/* 4 Illuminated Vintage Push-Buttons with Real Studio Functions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* 1. AUTO-DUCK ON TALKBACK */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-mono uppercase text-stone-400 mb-0.5 font-bold">AUTO DUCK</span>
              <button
                onClick={() => setAutoDuck(!autoDuck)}
                className={`w-9 h-6 rounded-[3px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                  autoDuck
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_10px_rgba(234,179,8,0.6)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
                title="Automatski utišava muziku za 20dB dok govorite u režiju"
              >
                <span className="text-[10px] font-bold">-20dB</span>
              </button>
            </div>

            {/* 2. STEREO / MONO CHECK */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-mono uppercase text-stone-400 mb-0.5 font-bold">MONITOR</span>
              <button
                onClick={() => setMonitorMode(monitorMode === "stereo" ? "mono" : "stereo")}
                className={`w-9 h-6 rounded-[3px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                  monitorMode === "stereo"
                    ? "bg-gradient-to-b from-[#67e8f9] via-[#06b6d4] to-[#0e7490] border-[#a5f3fc] shadow-[0_0_10px_rgba(6,182,212,0.6)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#a16207] border-[#fef08a] text-stone-950 font-bold"
                }`}
                title="Prebaci slušanje između Stereo i Mono kompatibilnosti"
              >
                <span className="text-[9px] font-bold">{monitorMode === "stereo" ? "ST" : "MONO"}</span>
              </button>
            </div>

            {/* 3. DIM (-20 dB) ATTENUATION */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-mono uppercase text-stone-400 mb-0.5 font-bold">DIM</span>
              <button
                onClick={() => setIsDimmed(!isDimmed)}
                className={`w-9 h-6 rounded-[3px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                  isDimmed
                    ? "bg-gradient-to-b from-[#f87171] via-[#dc2626] to-[#991b1b] border-[#fca5a5] shadow-[0_0_10px_rgba(239,68,68,0.7)] text-white font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
                title="Brzo stišavanje tona dok se javljate na telefon"
              >
                <span className="text-[9px] font-bold">DIM</span>
              </button>
            </div>

            {/* 4. HD OPUS CODEC */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-mono uppercase text-stone-400 mb-0.5 font-bold">CODEC</span>
              <button
                onClick={() => setHdCodec(!hdCodec)}
                className={`w-9 h-6 rounded-[3px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                  hdCodec
                    ? "bg-gradient-to-b from-[#86efac] via-[#22c55e] to-[#15803d] border-[#bbf7d0] shadow-[0_0_10px_rgba(34,197,94,0.6)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
                title="48 kHz High-Fidelity Opus Stream"
              >
                <span className="text-[9px] font-bold">48k</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. MAIN RACK CONSOLE: REAL MIC SENS, STUDIO MONITORS & PHONES        */}
        {/* ===================================================================== */}
        <div className="p-6 sm:p-7 flex items-stretch justify-between gap-6 bg-gradient-to-b from-[#15181f] to-[#0c0e12]">

          {/* ------------------------------------------------------------------- */}
          {/* SECTION A: CLIENT MICROPHONE (MIC GAIN + LIVE METER + TALKBACK)     */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-48 sm:w-56 flex flex-col items-center justify-between border-r border-[#242934] pr-4 sm:pr-6">
            <div className="text-center w-full mb-3">
              <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase drop-shadow flex items-center justify-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>VAŠ MIKROFON</span>
              </span>
              <div className="text-[9px] font-mono text-stone-400 mt-0.5">
                Ka režiji i glumačkoj sobi
              </div>
            </div>

            {/* Fader & Live Mic Meter Side-by-Side */}
            <div className="flex items-center gap-4 h-48 sm:h-52 w-full justify-center">
              <AnalogFaderTrack value={micGain} onChange={handleMicGain} />
              <AnalogLedMeter level={micMeterLevel} label="MIC" isMic />
            </div>

            {/* Mic Gain dB Readout */}
            <div className="mt-2 text-center">
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                {micGain > 0 ? `+${micGain}` : micGain} dB
              </span>
            </div>

            {/* REAL PUSH-TO-TALK / TALKBACK BUTTON */}
            <button
              onClick={toggleTalkback}
              className={`w-full mt-3 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none ${
                isTalkbackActive
                  ? "bg-amber-500 hover:bg-amber-400 text-stone-950 scale-95 shadow-[0_0_16px_rgba(245,158,11,0.8)] border border-amber-300"
                  : "bg-gradient-to-b from-[#262c37] to-[#181c24] hover:from-[#313845] hover:to-[#1e232d] text-stone-300 border border-[#3b4353]"
              }`}
            >
              {isTalkbackActive ? (
                <>
                  <Mic className="w-4 h-4 fill-current text-stone-950" />
                  <span>PRIČATE U REŽIJU...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4 text-stone-400" />
                  <span>UKLJUČI MIKROFON</span>
                </>
              )}
            </button>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION B: CENTER INFORMATION & ZERO-BLEED STATUS DISPLAY           */}
          {/* ------------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col justify-between px-2 sm:px-4 py-1 text-center">
            {/* Visual Screen Mesh / Perforated Display Box */}
            <div className="p-4 rounded-xl bg-[#0a0c0f] border border-[#202530] shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center relative overflow-hidden h-36">
              {/* Subtle background radial glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-400 mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>STUDIO AUDIO FEED • LIVE BROADCASТ</span>
              </div>

              <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight my-1">
                48.000 Hz • 24-BIT STEREO
              </div>

              <div className="text-[11px] font-mono text-stone-400 flex items-center gap-3 mt-1">
                <span>Latencija: <strong className="text-emerald-400 font-bold">18 ms</strong></span>
                <span>•</span>
                <span>Zaštita: <strong className="text-cyan-400 font-bold">Zero-Bleed DSP</strong></span>
              </div>
            </div>

            {/* Quick Helper hint */}
            <div className="text-[10px] text-stone-400 font-sans leading-relaxed mt-3 px-2">
              Kao klijent, u svojim slušalicama čujete miks spikera i matrice iz režije.  
              Kada pritisnete dugme za razgovor, vaš glas se automatski šalje u režiju bez odjeka i bez kašnjenja.
            </div>

            {/* Status pills at bottom */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="px-2.5 py-1 rounded-md bg-[#13161c] border border-[#252b37] text-[10px] font-mono text-stone-300 font-semibold">
                Slušalice: {isDimmed ? "-20 dB (DIM)" : `${phonesVol > 0 ? `+${phonesVol}` : phonesVol} dB`}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#13161c] border border-[#252b37] text-[10px] font-mono text-stone-300 font-semibold">
                Mikrofon: {isTalkbackActive ? "OTVOREN" : "UTIŠAN (MUTE)"}
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION C: PHONES / MASTER VOLUME (FADER + STEREO LED VU METER)     */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-48 sm:w-56 flex flex-col items-center justify-between border-l border-[#242934] pl-4 sm:pr-2 pl-4 sm:pl-6">
            <div className="text-center w-full mb-3">
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase drop-shadow flex items-center justify-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>VAŠE SLUŠALICE</span>
              </span>
              <div className="text-[9px] font-mono text-stone-400 mt-0.5">
                Master ton koji čujete
              </div>
            </div>

            {/* Fader & Dual Stereo Meter Side-by-Side */}
            <div className="flex items-center gap-3 h-48 sm:h-52 w-full justify-center">
              <div className="flex items-center gap-1.5">
                <AnalogLedMeter level={streamMeterL} label="L" />
                <AnalogLedMeter level={streamMeterR} label="R" />
              </div>
              <AnalogFaderTrack value={phonesVol} onChange={handlePhonesVol} />
            </div>

            {/* Phones dB Readout */}
            <div className="mt-2 text-center">
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {phonesVol > 0 ? `+${phonesVol}` : phonesVol} dB
              </span>
            </div>

            {/* MUTE HEADPHONES TOGGLE BUTTON */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-full mt-3 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none ${
                isMuted
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.7)] border border-red-400"
                  : "bg-gradient-to-b from-[#262c37] to-[#181c24] hover:from-[#313845] hover:to-[#1e232d] text-stone-300 border border-[#3b4353]"
              }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-white" />
                  <span>SLUŠALICE UTIŠANE</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>SLUŠALICE AKTIVNE</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Bottom Brushed Metallic Lip */}
        <div className="h-2 bg-gradient-to-r from-[#282e38] via-[#3a4250] to-[#282e38] border-t border-[#14171d]" />
      </div>
    </div>
  );
}

/* ============================================================================= */
/* SUB-COMPONENT: REALISTIC 3D BRUSHED CHROME SLIDER FADER                       */
/* ============================================================================= */
function AnalogFaderTrack({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert dB (-10 to +10) to percentage (0% to 100%)
  const pct = Math.max(0, Math.min(100, ((value + 10) / 20) * 100));

  const updateFromPointer = (clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(height, relativeY));
    const invertedPct = ((height - clampedY) / height) * 100;
    const db = (invertedPct / 100) * 20 - 10;
    onChange(db);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateFromPointer(e.clientY);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateFromPointer(e.clientY);
    };
    const handleUp = () => {
      if (isDragging) setIsDragging(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Scale on Left */}
      <div className="flex flex-col justify-between h-44 sm:h-48 text-[7px] font-mono text-[#525e70] pr-1.5 select-none pointer-events-none">
        <span>+10</span>
        <span>0</span>
        <span>-10</span>
      </div>

      {/* Vertical Milled Slot */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onChange(0)} // Reset to 0 dB
        className="relative w-3.5 h-44 sm:h-48 rounded-full bg-[#07080a] border border-[#232832] cursor-pointer shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] flex justify-center"
      >
        <div className="absolute top-2 bottom-2 w-0.5 bg-[#171a20]" />

        {/* 3D Chrome Fader Knob */}
        <div
          className="absolute w-10 h-7 rounded-[4px] cursor-grab active:cursor-grabbing transition-transform duration-75 flex flex-col items-center justify-center"
          style={{
            bottom: `calc(${pct}% - 14px)`,
            background:
              "linear-gradient(180deg, #f8fafc 0%, #cbd5e1 15%, #94a3b8 48%, #64748b 52%, #e2e8f0 85%, #475569 100%)",
            boxShadow:
              "0 6px 14px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.8)",
            border: "1px solid #334155",
          }}
        >
          <div className="w-6 h-[2px] bg-[#1e293b] shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
        </div>
      </div>

      {/* Scale on Right */}
      <div className="flex flex-col justify-between h-44 sm:h-48 text-[7px] font-mono text-[#525e70] pl-1.5 select-none pointer-events-none">
        <span>+10</span>
        <span>0</span>
        <span>-10</span>
      </div>
    </div>
  );
}

/* ============================================================================= */
/* SUB-COMPONENT: REALISTIC ANALOG LED LADDER PEAK METER                         */
/* ============================================================================= */
function AnalogLedMeter({ level, label, isMic = false }: { level: number; label: string; isMic?: boolean }) {
  const totalSegments = 22;
  const activeCount = Math.round((level / 100) * totalSegments);

  return (
    <div className="w-5 sm:w-6 h-44 sm:h-48 rounded-[3px] bg-[#06080a] border border-[#1f242e] p-1 flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)]">
      <div className="text-[6px] font-mono text-center text-red-500 font-bold leading-none mb-0.5">
        0 dB
      </div>

      <div className="flex-1 flex flex-col-reverse justify-between gap-[2px] py-0.5">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeCount;
          let activeBg = isMic
            ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
            : "bg-emerald-500 shadow-[0_0_6px_#10b981]";
          let inactiveBg = isMic ? "bg-[#241703]" : "bg-[#062413]";

          if (i >= totalSegments - 3) {
            activeBg = "bg-red-500 shadow-[0_0_8px_#ef4444]";
            inactiveBg = "bg-[#2b0808]";
          } else if (i >= totalSegments - 7 && !isMic) {
            activeBg = "bg-amber-400 shadow-[0_0_6px_#f59e0b]";
            inactiveBg = "bg-[#291704]";
          }

          return (
            <div
              key={i}
              className={`w-full h-1 rounded-[1px] transition-colors duration-75 ${
                isActive ? activeBg : inactiveBg
              }`}
            />
          );
        })}
      </div>

      <div className="text-[7px] font-mono text-center text-[#64748b] font-bold leading-none mt-0.5">
        {label}
      </div>
    </div>
  );
}
