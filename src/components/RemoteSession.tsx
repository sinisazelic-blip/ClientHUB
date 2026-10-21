"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  SlidersHorizontal,
  Headphones,
  CheckCircle,
  Star,
  Settings,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Layers,
  FileText
} from "lucide-react";

export default function RemoteSession() {
  // Mode switcher: "director" (Studio režija & mikser) vs "client" (Šta klijent vidi kad se uloguje)
  const [activeView, setActiveView] = useState<"director" | "client">("director");

  // Session state
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [selectedTake, setSelectedTake] = useState<number>(2);
  const [directorTalkback, setDirectorTalkback] = useState<boolean>(false);
  const [clientTalkback, setClientTalkback] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Audio Mixer Channels (Director Console)
  const [mixerLevels, setMixerLevels] = useState({
    boothMic: 85,       // Kanal 1: Vokalna soba (Spiker)
    talkback: 75,       // Kanal 2: Režijski mikrofon (Siniša Zelić)
    clientReturn: 70,   // Kanal 3: Klijent povrat (Dolazni zvuk klijenta)
    dawPlayback: 60,    // Kanal 4: DAW Playback / Matrica
    masterStudio: 80,   // Master režija zvučnici
    masterClient: 85,   // WebRTC bus ka klijentu
  });

  const [channelMutes, setChannelMutes] = useState({
    boothMic: false,
    talkback: false,
    clientReturn: false,
    dawPlayback: false,
    speakerHearsClient: true, // Da li spiker u slušalicama čuje klijenta dok govori
  });

  // Client login simulation state
  const [clientToken, setClientToken] = useState<string>("TAF-FRUCTA-2026");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const handleLevelChange = (channel: keyof typeof mixerLevels, val: number) => {
    setMixerLevels((prev) => ({ ...prev, [channel]: val }));
  };

  const toggleMute = (channel: keyof typeof channelMutes) => {
    setChannelMutes((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  return (
    <section id="live-session" className="py-20 md:py-28 bg-[#fdfcf9] border-t border-stone-200 relative overflow-hidden">
      {/* Background Subtle Tone */}
      <div className="absolute top-1/4 left-10 w-[600px] h-[350px] bg-amber-100/35 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[320px] bg-cyan-100/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/90 text-cyan-900 text-xs font-mono font-bold mb-4 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span>P2P WebRTC Audio Režija • 48kHz Opus Bez Kompresije</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-light text-stone-950 tracking-tight mb-4 font-sans">
            Režijski Audio Pult & <span className="font-semibold text-stone-900">Klijentska Zona</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-light">
            Sistem koji omogućava klijentu i agenciji da iz svoje kancelarije prate snimanje spikera u realnom vremenu, 
            uz direktan talkback i precizno miksersko rutiranje bez instalacije programa.
          </p>

          {/* Master View Mode Switcher: Director vs Client */}
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-100 border border-stone-300 mt-8 shadow-xs">
            <button
              onClick={() => setActiveView("director")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "director"
                  ? "bg-white text-stone-950 shadow-md border border-stone-200"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-orange-600" />
              <span>Studio Režija & Mikser (Šta mi vidimo)</span>
            </button>

            <button
              onClick={() => setActiveView("client")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "client"
                  ? "bg-white text-stone-950 shadow-md border border-stone-200"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <UserCheck className="w-4 h-4 text-cyan-600" />
              <span>Klijentski Prozor (Šta klijent vidi kad se uloguje)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: STUDIO REŽIJA & MIKSER KONZOLA (ŠTA MI VIDIMO)                   */}
        {/* ========================================================================= */}
        {activeView === "director" && (
          <div className="rounded-3xl bg-[#11161d] border border-stone-800 text-white shadow-2xl p-6 sm:p-8 md:p-10 max-w-6xl mx-auto">
            
            {/* Top Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-800 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-tight">
                      Glavna Režijska Konzola • Pult 1
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      RUTIRANJE AKTIVNO • BUFFER: 128 (2.6ms)
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono">
                    Audio Interface: 24-bit / 48.000 Hz • Povezan klijent: Fructa Trade (Kort)
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audio I/O Settings</span>
                </button>

                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isRecording
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500 animate-pulse"
                      : "bg-stone-800 text-stone-400 border border-stone-700"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-white" : "bg-stone-500"}`} />
                  <span>{isRecording ? "● REC ON AIR" : "PAUZA (STANDBY)"}</span>
                </button>
              </div>
            </div>

            {/* Mixer Hardware Strip (4 Ulazna Kanala + Master Bus) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 p-6 rounded-2xl bg-[#0b0e14] border border-stone-800/80 mb-8">
              
              {/* Kanal 1: Vokalna Gluva Soba (Neumann U87) */}
              <div className="flex flex-col items-center bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1">
                  Kanal 1
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  Gluva Soba (Vokal)
                </span>
                {/* Visual Fake VU Needle */}
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-150"
                    style={{ height: `${channelMutes.boothMic ? 0 : mixerLevels.boothMic * 0.9}%` }}
                  />
                </div>
                {/* Fader Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.boothMic}
                  onChange={(e) => handleLevelChange("boothMic", Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-stone-300 font-bold mb-2">
                  {channelMutes.boothMic ? "MUTED" : `${mixerLevels.boothMic}%`}
                </span>
                <button
                  onClick={() => toggleMute("boothMic")}
                  className={`w-full py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    channelMutes.boothMic ? "bg-red-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  MUTE
                </button>
              </div>

              {/* Kanal 2: Talkback Režija (Siniša Zelić) */}
              <div className="flex flex-col items-center bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold mb-1">
                  Kanal 2
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  Režijski Talkback
                </span>
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-amber-400 rounded-full transition-all duration-150"
                    style={{ height: `${directorTalkback ? mixerLevels.talkback * 0.85 : 0}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.talkback}
                  onChange={(e) => handleLevelChange("talkback", Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-stone-300 font-bold mb-2">
                  {mixerLevels.talkback}%
                </span>
                <button
                  onMouseDown={() => setDirectorTalkback(true)}
                  onMouseUp={() => setDirectorTalkback(false)}
                  className={`w-full py-1.5 rounded text-[10px] font-mono font-bold transition-all select-none ${
                    directorTalkback
                      ? "bg-emerald-500 text-stone-950 shadow-md font-extrabold"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  {directorTalkback ? "PRIČAŠ..." : "HOLD PTT"}
                </button>
              </div>

              {/* Kanal 3: Klijent Dolazni Audio (Remote Return) */}
              <div className="flex flex-col items-center bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                  Kanal 3
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  Klijent (Online)
                </span>
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full transition-all duration-150"
                    style={{ height: `${channelMutes.clientReturn ? 0 : mixerLevels.clientReturn * 0.75}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.clientReturn}
                  onChange={(e) => handleLevelChange("clientReturn", Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-stone-300 font-bold mb-2">
                  {channelMutes.clientReturn ? "MUTED" : `${mixerLevels.clientReturn}%`}
                </span>
                <button
                  onClick={() => toggleMute("clientReturn")}
                  className={`w-full py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    channelMutes.clientReturn ? "bg-red-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  MUTE
                </button>
              </div>

              {/* Kanal 4: DAW Matrica / Playback */}
              <div className="flex flex-col items-center bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold mb-1">
                  Kanal 4
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  DAW / Muzika
                </span>
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-purple-400 rounded-full transition-all duration-150"
                    style={{ height: `${channelMutes.dawPlayback ? 0 : mixerLevels.dawPlayback * 0.8}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.dawPlayback}
                  onChange={(e) => handleLevelChange("dawPlayback", Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-stone-300 font-bold mb-2">
                  {channelMutes.dawPlayback ? "MUTED" : `${mixerLevels.dawPlayback}%`}
                </span>
                <button
                  onClick={() => toggleMute("dawPlayback")}
                  className={`w-full py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    channelMutes.dawPlayback ? "bg-red-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  MUTE
                </button>
              </div>

              {/* Master 1: Studio Monitors (U Režiji) */}
              <div className="flex flex-col items-center bg-stone-900/90 p-4 rounded-xl border border-stone-700">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                  Master
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  Režijski Zvučnici
                </span>
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-150"
                    style={{ height: `${mixerLevels.masterStudio * 0.85}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.masterStudio}
                  onChange={(e) => handleLevelChange("masterStudio", Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-emerald-400 font-bold mb-2">
                  {mixerLevels.masterStudio}%
                </span>
                <span className="text-[10px] font-mono text-stone-500 uppercase">
                  MONITOR BUS
                </span>
              </div>

              {/* Master 2: Šta Klijent Čuje (WebRTC Bus) */}
              <div className="flex flex-col items-center bg-stone-900/90 p-4 rounded-xl border border-cyan-800/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                  WebRTC Bus
                </span>
                <span className="text-xs font-semibold text-white mb-3 text-center truncate w-full">
                  Klijentski Stream
                </span>
                <div className="w-2.5 h-28 bg-stone-950 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-stone-700 mb-3">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 via-cyan-400 to-red-500 rounded-full transition-all duration-150"
                    style={{ height: `${mixerLevels.masterClient * 0.9}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerLevels.masterClient}
                  onChange={(e) => handleLevelChange("masterClient", Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer mb-3"
                />
                <span className="text-[11px] font-mono text-cyan-400 font-bold mb-2">
                  {mixerLevels.masterClient}%
                </span>
                <span className="text-[10px] font-mono text-cyan-500/80 uppercase font-semibold">
                  LIVE OUT
                </span>
              </div>

            </div>

            {/* Rutiranje & Interkom Prekidači */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-stone-900/80 border border-stone-800 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Spiker čuje klijenta u slušalicama</span>
                  <span className="text-stone-400 text-[11px]">Dozvoli klijentu da direktno komunicira sa talentom</span>
                </div>
                <button
                  onClick={() => setChannelMutes(p => ({ ...p, speakerHearsClient: !p.speakerHearsClient }))}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                    channelMutes.speakerHearsClient ? "bg-emerald-500 text-stone-950" : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {channelMutes.speakerHearsClient ? "UKLJUČENO" : "ISKLJUČENO"}
                </button>
              </div>

              <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-stone-800 pt-3 md:pt-0 md:pl-4">
                <div>
                  <span className="font-bold text-white block">Auto-Duck muzike na Talkback</span>
                  <span className="text-stone-400 text-[11px]">Utišava DAW matricu za 20dB dok režiser govori</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-stone-800 text-emerald-400 font-mono font-bold text-[11px]">
                  -20 dB AUTO
                </span>
              </div>

              <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-stone-800 pt-3 md:pt-0 md:pl-4">
                <div>
                  <span className="font-bold text-white block">Fluxa Tenant Sinhronizacija</span>
                  <span className="text-stone-400 text-[11px]">Token i dozvole klijenta mapirane iz baze</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-cyan-900/60 text-cyan-300 font-mono font-bold text-[11px] border border-cyan-700/50">
                  LINKED
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: KLIJENTSKI PROZOR (ŠTA KLIJENT VIDI KAD SE ULOGUJE)              */}
        {/* ========================================================================= */}
        {activeView === "client" && (
          <div className="rounded-3xl bg-white border border-stone-200 text-stone-900 shadow-xl p-6 sm:p-8 md:p-10 max-w-5xl mx-auto">
            
            {/* Authenticated Client Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                    Autorizovana Sesija • Studio TAF
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-950">
                  Klijent: Fructa Trade (Kort Marketi)
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Projekat: Jesenja Kampanja 2026 • Režiser: Siniša Zelić • Spiker u studiju: Talent A
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-mono text-stone-700 font-semibold">
                  Prava: Slušanje • Talkback • Odobravanje Tejkova
                </span>
              </div>
            </div>

            {/* Live Audio Stream Monitor Card */}
            <div className="p-6 rounded-2xl bg-stone-900 text-white mb-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono text-red-400 font-bold tracking-widest uppercase">
                    STUDIO FEED UŽIVO (48kHz STEREO)
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-400">
                  Latencija: <span className="text-emerald-400 font-bold">18ms</span> • Audio codec: Opus High-Fidelity
                </div>
              </div>

              {/* Big Talkback Button for Client */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-stone-800">
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-white block">
                    Direktna veza sa režijom i spikerom
                  </span>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-md">
                    Držite dugme dok govorite. Vaš glas se trenutno reprodukuje u režiji kod Siniše Zelića i u slušalicama spikera u gluvozvučnoj sobi.
                  </p>
                </div>

                <button
                  onMouseDown={() => setClientTalkback(true)}
                  onMouseUp={() => setClientTalkback(false)}
                  className={`px-8 py-4 rounded-2xl font-mono text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-3 select-none cursor-pointer ${
                    clientTalkback
                      ? "bg-emerald-500 text-stone-950 scale-95 shadow-emerald-500/50"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>{clientTalkback ? "PRIČATE U REŽIJU..." : "PRITISNI I PRIČAJ (PTT)"}</span>
                </button>
              </div>
            </div>

            {/* Live Synchronized Script & Takes Approval */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              
              {/* Synchronized Script */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                  <span className="text-xs font-mono uppercase font-bold text-stone-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>Scenario za sinhronizaciju (Take 2 u toku)</span>
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">Radio 20s • Ijekavica</span>
                </div>

                <div className="space-y-3 text-sm text-stone-800 leading-relaxed font-sans">
                  <p className="p-2.5 rounded-lg bg-white border border-stone-200/60">
                    <strong className="text-orange-600 font-bold">[Spiker, autoritativno]:</strong>{" "}
                    „Jesensko sniženje u svim Kort marketima. Preko 1.000 artikala po cijenama koje prave razliku.”
                  </p>
                  <p className="p-2.5 rounded-lg bg-white border border-stone-200/60">
                    <strong className="text-amber-700 font-bold">[Spiker, jasan tempo]:</strong>{" "}
                    „Akcija traje do nedjelje. Potražite označene proizvode na policama vašeg najbližeg Korta.”
                  </p>
                </div>

                {/* Take Selector & Approval */}
                <div className="mt-5 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-600 font-mono">Snimljeni tejkovi:</span>
                    {[1, 2, 3].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTake(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          selectedTake === t
                            ? "bg-stone-900 text-white shadow-xs"
                            : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        Tejk {t}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => alert(`Tejk ${selectedTake} je označen kao ODOBREN od strane klijenta. Studio TAF kreće u finalni mastering!`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Odobri Tejk {selectedTake} za Master</span>
                  </button>
                </div>
              </div>

              {/* Private Master Downloads (Samo odobreni materijali za klijenta) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800">
                      Isporučeni Masteri
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    Konačni master fajlovi visoke rezolucije pripremljeni prema EBU R128 standardu za emitovanje:
                  </p>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block truncate max-w-[140px]">Kort_Radio_20s.wav</span>
                        <span className="text-[10px] text-stone-500 font-mono">24-bit / 48kHz • 5.6MB</span>
                      </div>
                      <button
                        onClick={() => alert("Preuzimanje WAV mastera započeto.")}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 cursor-pointer"
                        title="Preuzmi WAV"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-700" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block truncate max-w-[140px]">Kort_Dry_Voice.wav</span>
                        <span className="text-[10px] text-stone-500 font-mono">Čist vokal bez muzike • 11.2MB</span>
                      </div>
                      <button
                        onClick={() => alert("Preuzimanje suvog vokala započeto.")}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 cursor-pointer"
                        title="Preuzmi WAV"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-700" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500 font-mono text-center">
                  Arhiva čuva materijal 12 mjeseci
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Audio I/O Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141a23] border border-stone-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-700">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Audio I/O Rutiranje & Kalibracija</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-stone-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-stone-400 block mb-1.5">Ulazni Audio Interfejs (Mic Booth):</label>
                <select className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white">
                  <option>Universal Audio Apollo x8p (ASIO 48kHz)</option>
                  <option>RME Fireface UFX III</option>
                  <option>Focusrite Red 8Pre</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1.5">Režijski Talkback Mikrofon:</label>
                <select className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white">
                  <option>Studio Desk Shure SM7B (In 3)</option>
                  <option>Built-in Talkback Mic</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-400 block mb-1.5">Buffer Latencija:</label>
                  <select className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white">
                    <option>64 samples (1.4 ms)</option>
                    <option selected>128 samples (2.6 ms)</option>
                    <option>256 samples (5.3 ms)</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1.5">Sample Rate:</label>
                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-cyan-400 font-bold">
                    48.000 Hz / 24-bit
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert("1 kHz kalibracioni ton poslat na sve aktivne sabirnice (-18 dBFS).")}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-bold transition-all"
                >
                  Generiši Test Ton (1 kHz @ -18 dBFS)
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs"
              >
                Sačuvaj Rutiranje
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
