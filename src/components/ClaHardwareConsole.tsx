"use client";

import React, { useState, useEffect, useRef } from "react";

interface FaderState {
  inputSens: number; // -10 to +10 dB (default 0)
  voice: number;     // -10 to +10 dB (default 0)
  music: number;     // -10 to +10 dB (default -2)
  director: number;  // -10 to +10 dB (default +2)
  ambience: number;  // -10 to +10 dB (default -6)
  fxReverb: number;  // -10 to +10 dB (default -4)
  stereoSpread: number; // -10 to +10 dB (default 0)
  output: number;    // -10 to +10 dB (default 0)
}

interface ButtonState {
  voiceFocus: boolean;
  musicDuck: boolean;
  directorDirect: boolean;
  airBoost: boolean;
  slapDelay: boolean;
  stereoWide: boolean;
}

export function ClaHardwareConsole({
  title = "Studio TAF • Master Cue",
  subtitle = "Analog Hardware Console",
  onMixChange,
}: {
  title?: string;
  subtitle?: string;
  onMixChange?: (mix: FaderState) => void;
}) {
  const [faders, setFaders] = useState<FaderState>({
    inputSens: 0,
    voice: 2.5,
    music: -3.0,
    director: 1.0,
    ambience: -5.0,
    fxReverb: -2.0,
    stereoSpread: 0,
    output: 0,
  });

  const [buttons, setButtons] = useState<ButtonState>({
    voiceFocus: true,
    musicDuck: true,
    directorDirect: true,
    airBoost: false,
    slapDelay: false,
    stereoWide: true,
  });

  // VU Meter state animation
  const [leftMeter, setLeftMeter] = useState(65);
  const [rightMeter, setRightMeter] = useState(62);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate analog program material fluctuation
      const baseL = 58 + Math.sin(Date.now() / 250) * 18 + (Math.random() * 8);
      const baseR = 55 + Math.cos(Date.now() / 280) * 17 + (Math.random() * 8);
      setLeftMeter(Math.min(95, Math.max(10, baseL)));
      setRightMeter(Math.min(94, Math.max(10, baseR)));
    }, 70);
    return () => clearInterval(interval);
  }, []);

  const handleFaderDrag = (key: keyof FaderState, val: number) => {
    const clamped = Math.max(-10, Math.min(10, Math.round(val * 10) / 10));
    const next = { ...faders, [key]: clamped };
    setFaders(next);
    if (onMixChange) onMixChange(next);
  };

  const toggleBtn = (key: keyof ButtonState) => {
    setButtons((p) => ({ ...p, [key]: !p[key] }));
  };

  // Convert dB (-10 to +10) to percentage for fader travel (0% = bottom, 100% = top)
  const dbToPercent = (db: number) => {
    return ((db + 10) / 20) * 100;
  };

  const percentToDb = (pct: number) => {
    return (pct / 100) * 20 - 10;
  };

  return (
    <div className="w-full select-none font-sans">
      {/* ========================================================================= */}
      {/* HARDWARE RACK CHASSIS (CLA CHRIS LORD-ALGE SIGNATURE STYLE)             */}
      {/* ========================================================================= */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-2 border-[#3a3f47]"
        style={{
          background: "linear-gradient(180deg, #1e2229 0%, #171a20 40%, #121418 100%)",
          maxWidth: "960px",
        }}
      >
        {/* ===================================================================== */}
        {/* 1. TOP CURVED BURGUNDY / WINE RED FACEPLATE                            */}
        {/* ===================================================================== */}
        <div
          className="relative px-6 py-3 flex items-center justify-between border-b-2 border-[#150202] shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_6px_12px_rgba(0,0,0,0.6)]"
          style={{
            background:
              "linear-gradient(180deg, #b91c1c 0%, #881313 18%, #500707 65%, #2a0303 100%)",
          }}
        >
          {/* Subtle glossy sheen line across the top curve */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Left: Chrome Hex Screw & Script Logo */}
          <div className="flex items-center gap-4">
            {/* Hex Screw */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] p-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center">
                <div className="w-2 h-2 rounded-[2px] bg-[#64748b] rotate-45 border border-black/40" />
              </div>
            </div>

            {/* Embossed Metallic Script Logo */}
            <div className="relative">
              <span
                className="text-2xl sm:text-3xl font-black italic tracking-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #cbd5e1 45%, #64748b 55%, #f8fafc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.9))",
                }}
              >
                Studio TAF
              </span>
              <span className="ml-3 text-[11px] font-mono tracking-widest text-red-200/80 uppercase font-bold drop-shadow">
                FLUXA CUE MASTER
              </span>
            </div>
          </div>

          {/* Right: Signature Waves-style Waveform Badge & Right Hex Screw */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 opacity-70">
              <span className="text-[10px] font-mono tracking-widest text-red-200 uppercase font-semibold">
                PRECISION ANALOG
              </span>
              <div className="flex items-center gap-0.5 ml-2">
                <span className="w-1 h-3 bg-red-300 rounded-full" />
                <span className="w-1 h-5 bg-red-200 rounded-full" />
                <span className="w-1 h-2 bg-red-400 rounded-full" />
              </div>
            </div>

            {/* Right Hex Screw */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] p-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center">
                <div className="w-2 h-2 rounded-[2px] bg-[#64748b] rotate-45 border border-black/40" />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. SUB-HEADER STRIP: MESH GRILL, PUSH BUTTONS & VINTAGE BADGE        */}
        {/* ===================================================================== */}
        <div
          className="px-6 py-3 flex items-center justify-between border-b border-[#252a33]"
          style={{
            background:
              "linear-gradient(180deg, #1b1e25 0%, #14171d 100%)",
          }}
        >
          {/* Left: Speaker / Mic Perforated Mesh Grille */}
          <div className="w-32 h-14 rounded-lg bg-[#0b0d10] border border-[#2b313c] p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] flex items-center justify-center relative overflow-hidden">
            {/* Mesh dot pattern */}
            <div
              className="w-full h-full opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
                backgroundSize: "6px 6px",
              }}
            />
            {/* Warm inner backlight glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-transparent pointer-events-none" />
            <div className="absolute left-3 top-2 text-[8px] font-mono uppercase tracking-widest text-amber-200/50 font-bold">
              MONITOR
            </div>
          </div>

          {/* Center: 6 Illuminated Vintage Push-Buttons */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* 1. Voice Focus */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.voiceFocus ? "text-emerald-400" : ""}>VOKAL</span>
              </div>
              <button
                onClick={() => toggleBtn("voiceFocus")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.voiceFocus
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>

            {/* 2. Music Duck */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.musicDuck ? "text-emerald-400" : ""}>DUCK</span>
              </div>
              <button
                onClick={() => toggleBtn("musicDuck")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.musicDuck
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>

            {/* 3. Director Direct */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.directorDirect ? "text-emerald-400" : ""}>DIRECT</span>
              </div>
              <button
                onClick={() => toggleBtn("directorDirect")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.directorDirect
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>

            {/* 4. Air Boost */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.airBoost ? "text-emerald-400" : ""}>AIR</span>
              </div>
              <button
                onClick={() => toggleBtn("airBoost")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.airBoost
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>

            {/* 5. Slap Delay */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.slapDelay ? "text-emerald-400" : ""}>SLAP</span>
              </div>
              <button
                onClick={() => toggleBtn("slapDelay")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.slapDelay
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>

            {/* 6. Stereo Wide */}
            <div className="flex flex-col items-center">
              <div className="text-[8px] font-mono text-stone-400 mb-1 font-bold tracking-tight">
                <span className={buttons.stereoWide ? "text-emerald-400" : ""}>STEREO</span>
              </div>
              <button
                onClick={() => toggleBtn("stereoWide")}
                className={`w-9 h-7 rounded-[4px] border transition-all flex items-center justify-center cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                  buttons.stereoWide
                    ? "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] border-[#fef08a] shadow-[0_0_12px_rgba(234,179,8,0.7)] text-stone-950 font-black"
                    : "bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-stone-400"
                }`}
              >
                <span className="text-xs">↑</span>
              </button>
            </div>
          </div>

          {/* Right: Embossed Vintage Oval Metal Badge */}
          <div className="w-28 h-12 rounded-full border border-[#2e3541] bg-gradient-to-b from-[#181c23] to-[#0d0f13] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <span
              className="text-lg font-serif italic font-bold tracking-wider"
              style={{
                color: "#475569",
                textShadow: "0 1px 1px rgba(255,255,255,0.1), 0 -1px 1px rgba(0,0,0,0.9)",
              }}
            >
              Vocals
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. MAIN CONSOLE FACEPLATE: FADERS & ANALOG METERS                      */}
        {/* ===================================================================== */}
        <div className="p-6 sm:p-8 flex items-stretch justify-between gap-4 sm:gap-6 bg-gradient-to-b from-[#161920] to-[#0e1014]">

          {/* ------------------------------------------------------------------- */}
          {/* SECTION A: INPUT SENS (FADER + DUAL PEAK LED METER)                */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-28 sm:w-32 flex flex-col items-center justify-between border-r border-[#262c37] pr-4">
            
            {/* Top link switch */}
            <div className="w-6 h-3 rounded-full bg-[#0a0c0e] border border-[#2d3441] mb-4 flex items-center p-0.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            </div>

            {/* Fader & Meter Side-by-Side */}
            <div className="flex items-center gap-3 h-52 sm:h-60 w-full justify-center">
              {/* Vertical Fader Track */}
              <AnalogFaderTrack
                value={faders.inputSens}
                onChange={(val) => handleFaderDrag("inputSens", val)}
              />

              {/* Analog LED VU Peak Meter */}
              <AnalogLedMeter level={leftMeter} label="L" />
            </div>

            {/* Label Below */}
            <div className="mt-4 text-center">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#94a3b8] font-bold uppercase drop-shadow">
                INPUT SENS
              </span>
              <div className="text-[9px] font-mono text-cyan-400 font-bold">
                {faders.inputSens > 0 ? `+${faders.inputSens}` : faders.inputSens} dB
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION B: 6 CENTER CUE CHANNELS                                   */}
          {/* ------------------------------------------------------------------- */}
          <div className="flex-1 flex items-center justify-around gap-2 sm:gap-4 px-2">
            {/* 1. SPIKER (VOKAL) */}
            <ConsoleChannel
              label="SPIKER"
              value={faders.voice}
              onChange={(val) => handleFaderDrag("voice", val)}
            />

            {/* 2. MATRICA (DAW) */}
            <ConsoleChannel
              label="MATRICA"
              value={faders.music}
              onChange={(val) => handleFaderDrag("music", val)}
            />

            {/* 3. REŽIJA (DIRECTOR) */}
            <ConsoleChannel
              label="REŽIJA"
              value={faders.director}
              onChange={(val) => handleFaderDrag("director", val)}
            />

            {/* 4. AMBIJENT (BOOTH ROOM) */}
            <ConsoleChannel
              label="AMBIJENT"
              value={faders.ambience}
              onChange={(val) => handleFaderDrag("ambience", val)}
            />

            {/* 5. EFEKAT (REVERB) */}
            <ConsoleChannel
              label="REVERB"
              value={faders.fxReverb}
              onChange={(val) => handleFaderDrag("fxReverb", val)}
            />

            {/* 6. STEREO (SPREAD) */}
            <ConsoleChannel
              label="PAN/WIDE"
              value={faders.stereoSpread}
              onChange={(val) => handleFaderDrag("stereoSpread", val)}
            />
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION C: OUTPUT (MASTER FADER + STEREO PEAK LED METER)           */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-28 sm:w-32 flex flex-col items-center justify-between border-l border-[#262c37] pl-4">
            
            {/* Top link switch */}
            <div className="w-6 h-3 rounded-full bg-[#0a0c0e] border border-[#2d3441] mb-4 flex items-center justify-end p-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </div>

            {/* Fader & Meter Side-by-Side */}
            <div className="flex items-center gap-3 h-52 sm:h-60 w-full justify-center">
              {/* Analog LED VU Peak Meter */}
              <AnalogLedMeter level={rightMeter} label="R" />

              {/* Vertical Fader Track */}
              <AnalogFaderTrack
                value={faders.output}
                onChange={(val) => handleFaderDrag("output", val)}
              />
            </div>

            {/* Label Below */}
            <div className="mt-4 text-center">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#94a3b8] font-bold uppercase drop-shadow">
                OUTPUT
              </span>
              <div className="text-[9px] font-mono text-emerald-400 font-bold">
                {faders.output > 0 ? `+${faders.output}` : faders.output} dB
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Brushed Metallic Lip */}
        <div className="h-2.5 bg-gradient-to-r from-[#2a303c] via-[#3d4554] to-[#2a303c] border-t border-[#171a20]" />
      </div>
    </div>
  );
}

/* ============================================================================= */
/* SUB-COMPONENT: INDIVIDUAL CUE CHANNEL STRIP                                   */
/* ============================================================================= */
function ConsoleChannel({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between h-full py-1">
      {/* Long-Throw Fader Track */}
      <div className="h-52 sm:h-60 flex items-center justify-center">
        <AnalogFaderTrack value={value} onChange={onChange} />
      </div>

      {/* Engraved Label Below */}
      <div className="mt-4 text-center">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#94a3b8] font-bold uppercase drop-shadow block">
          {label}
        </span>
        <span className="text-[9px] font-mono text-stone-400 font-bold">
          {value > 0 ? `+${value}` : value} dB
        </span>
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

  // Convert dB (-10 to +10) to 0%..100%
  const pct = Math.max(0, Math.min(100, ((value + 10) / 20) * 100));

  const updateFromPointer = (clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;
    // Y runs from top (100%) to bottom (0%)
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
      {/* Tick Marks & Scale on Left and Right */}
      <div className="flex flex-col justify-between h-48 sm:h-56 text-[8px] font-mono text-[#525e70] pr-1.5 select-none pointer-events-none">
        <span>+10</span>
        <span>0</span>
        <span>-10</span>
      </div>

      {/* Vertical Milled Slot */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onChange(0)} // Quick reset to 0 dB
        className="relative w-3 sm:w-3.5 h-48 sm:h-56 rounded-full bg-[#08090c] border border-[#232832] cursor-pointer shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] flex justify-center"
      >
        {/* Center Groove Shadow */}
        <div className="absolute top-2 bottom-2 w-0.5 bg-[#171a20]" />

        {/* 3D Chrome Fader Knob */}
        <div
          className="absolute w-10 sm:w-11 h-7 rounded-[4px] cursor-grab active:cursor-grabbing transition-transform duration-75 flex flex-col items-center justify-center"
          style={{
            bottom: `calc(${pct}% - 14px)`,
            background:
              "linear-gradient(180deg, #f8fafc 0%, #cbd5e1 15%, #94a3b8 48%, #64748b 52%, #e2e8f0 85%, #475569 100%)",
            boxShadow:
              "0 6px 14px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -1px 2px rgba(0,0,0,0.8)",
            border: "1px solid #334155",
          }}
        >
          {/* Horizontal Grip Line */}
          <div className="w-7 h-[2px] bg-[#1e293b] shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
        </div>
      </div>

      {/* Scale on Right */}
      <div className="flex flex-col justify-between h-48 sm:h-56 text-[8px] font-mono text-[#525e70] pl-1.5 select-none pointer-events-none">
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
function AnalogLedMeter({ level, label }: { level: number; label: string }) {
  // 24 LED segments
  const totalSegments = 24;
  const activeCount = Math.round((level / 100) * totalSegments);

  return (
    <div className="w-6 sm:w-7 h-48 sm:h-56 rounded-[3px] bg-[#07090b] border border-[#202530] p-1 flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)]">
      {/* Top 0 dB indicator */}
      <div className="text-[7px] font-mono text-center text-red-500 font-bold leading-none mb-1">
        0 dB
      </div>

      {/* LED Ladder */}
      <div className="flex-1 flex flex-col-reverse justify-between gap-[2px] py-1">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeCount;
          // Colors: top 3 red, next 5 amber, rest green
          let activeBg = "bg-emerald-500 shadow-[0_0_6px_#10b981]";
          let inactiveBg = "bg-[#062413]";

          if (i >= totalSegments - 3) {
            activeBg = "bg-red-500 shadow-[0_0_8px_#ef4444]";
            inactiveBg = "bg-[#2b0808]";
          } else if (i >= totalSegments - 8) {
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

      {/* Bottom Label (L or R) */}
      <div className="text-[8px] font-mono text-center text-[#64748b] font-bold leading-none mt-1">
        {label}
      </div>
    </div>
  );
}
