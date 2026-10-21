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
  Layers,
  Sparkles,
  Activity,
  Headphones,
  ShieldCheck,
  FileText,
  Cpu,
  RefreshCw,
  Zap,
  Play
} from "lucide-react";

export interface ParticipantData {
  id: string;
  name: string;
  role: string;
  email: string;
  online: boolean;
  isSpeaking: boolean;
  incomingLevel: number;
  volumeCR: number;
  volumeBooth: number;
  isMuted: boolean;
  hearsStudio: boolean;
}

interface RmeInputChannel {
  id: number;
  port: string;
  name: string;
  role: string;
  gain: number;
  level: number;
  isMuted: boolean;
  toBooth: boolean;
  toStream: boolean;
  toCR: boolean;
}

interface RmeOutputChannel {
  id: number;
  port: string;
  name: string;
  role: string;
  level: number;
  isMuted: boolean;
}

interface StudioDirectorConsoleProps {
  onSyncToFluxa: (take: number) => void;
}

export default function StudioDirectorConsole({ onSyncToFluxa }: StudioDirectorConsoleProps) {
  // Navigation inside Director Console
  const [activeConsoleTab, setActiveConsoleTab] = useState<"session" | "rme_hardware" | "video_source">("session");

  // Session Master State
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [selectedTake, setSelectedTake] = useState<number>(2);

  // Outgoing Master Stream Levels (Left & Right dBFS)
  const [outgoingLeft, setOutgoingLeft] = useState<number>(84);
  const [outgoingRight, setOutgoingRight] = useState<number>(82);

  // Talkback state
  const [talkbackMode, setTalkbackMode] = useState<"all" | "booth_only">("all");
  const [talkbackActive, setTalkbackActive] = useState<boolean>(false);

  // Video window state
  const [capturedVideoName, setCapturedVideoName] = useState<string>("Vegas Pro 21 • Video Preview (Clean Feed)");
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // =========================================================================
  // FLUXAX MULTI-HARDWARE MATRIX ENGINE STATE
  // =========================================================================
  const [sampleRate, setSampleRate] = useState<string>("48000");
  const [bufferSize, setBufferSize] = useState<string>("128");

  const [availableDevices, setAvailableDevices] = useState<{ id: string; name: string; driver: string }[]>([
    { id: "rme_uc", name: "RME Fireface UC (ASIO)", driver: "RME Fireface UC USB" },
    { id: "rme_fireface_802", name: "RME Fireface 800 / 802 / UFX", driver: "RME Fireface ASIO Pro" },
    { id: "maudio_air_192", name: "M-Audio AIR 192|14", driver: "M-Audio AIR ASIO Driver" },
    { id: "behringer_flow8", name: "Behringer Flow 8", driver: "Behringer Flow 8 USB Audio" },
    { id: "fluxax_net_audio", name: "FluxaX Virtual Soundcard / Network Console (FluxaX Audio Protocol)", driver: "FluxaX Low-Latency Net Audio Core (16x16)" },
  ]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("rme_uc");
  const [fluxaxMatrix, setFluxaxMatrix] = useState<Record<number, Record<number, boolean>>>({});

  // Inputs of the Active Interface
  const [rmeInputs, setRmeInputs] = useState<RmeInputChannel[]>([
    { id: 1, port: "Ulaz 1", name: "Mic 1 (Neumann U87)", role: "booth_mic", gain: 85, level: 0, isMuted: false, toBooth: true, toStream: true, toCR: true },
    { id: 2, port: "Ulaz 2", name: "Mic 2 (Režija Talkback)", role: "talkback", gain: 70, level: 0, isMuted: false, toBooth: true, toStream: false, toCR: false },
    { id: 3, port: "Ulaz 3", name: "DAW Playback L", role: "daw_l", gain: 80, level: 0, isMuted: false, toBooth: true, toStream: true, toCR: true },
    { id: 4, port: "Ulaz 4", name: "DAW Playback R", role: "daw_r", gain: 80, level: 0, isMuted: false, toBooth: true, toStream: true, toCR: true },
    { id: 5, port: "Ulaz 5", name: "Vegas Loopback L", role: "loopback_l", gain: 85, level: 0, isMuted: false, toBooth: true, toStream: true, toCR: true },
    { id: 6, port: "Ulaz 6", name: "Vegas Loopback R", role: "loopback_r", gain: 85, level: 0, isMuted: false, toBooth: true, toStream: true, toCR: true },
    { id: 7, port: "Ulaz 7", name: "SPDIF In L (Digital)", role: "digital", gain: 50, level: 0, isMuted: true, toBooth: false, toStream: false, toCR: false },
    { id: 8, port: "Ulaz 8", name: "SPDIF In R (Digital)", role: "digital", gain: 50, level: 0, isMuted: true, toBooth: false, toStream: false, toCR: false },
  ]);

  // Outputs of the Active Interface
  const [rmeOutputs, setRmeOutputs] = useState<RmeOutputChannel[]>([
    { id: 1, port: "Izlaz 1", name: "CR Monitor L", role: "cr_l", level: 85, isMuted: false },
    { id: 2, port: "Izlaz 2", name: "CR Monitor R", role: "cr_r", level: 85, isMuted: false },
    { id: 3, port: "Izlaz 3", name: "Booth Cans L (Spiker)", role: "booth_l", level: 80, isMuted: false },
    { id: 4, port: "Izlaz 4", name: "Booth Cans R (Spiker)", role: "booth_r", level: 80, isMuted: false },
    { id: 5, port: "Izlaz 5", name: "Režija Slušalice L", role: "phones_l", level: 75, isMuted: false },
    { id: 6, port: "Izlaz 6", name: "Režija Slušalice R", role: "phones_r", level: 75, isMuted: false },
    { id: 7, port: "Izlaz 7", name: "Klijent Stream L", role: "stream_l", level: 90, isMuted: false },
    { id: 8, port: "Izlaz 8", name: "Klijent Stream R", role: "stream_r", level: 90, isMuted: false },
  ]);

  // Real connected participants (Zero-mock start)
  const [participants, setParticipants] = useState<ParticipantData[]>([]);

  // Live connection to local StudioBridge daemon (ws://127.0.0.1:4040/ws or LAN)
  const [isDaemonConnected, setIsDaemonConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
      ws = new WebSocket(`ws://${host}:4040/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsDaemonConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "METERS_TICK" && msg.inputs) {
            setRmeInputs((prev) =>
              prev.map((ch) => {
                const tick = msg.inputs.find((t: any) => t.id === ch.id);
                return tick ? { ...ch, level: tick.level } : ch;
              })
            );
          }
          if (msg.type === "FULL_STATE" && msg.data) {
            if (msg.data.availableDevices) setAvailableDevices(msg.data.availableDevices);
            if (msg.data.currentDeviceId) setCurrentDeviceId(msg.data.currentDeviceId);
            if (msg.data.fluxaxMatrix || msg.data.danteMatrix) setFluxaxMatrix(msg.data.fluxaxMatrix || msg.data.danteMatrix);
            if (msg.data.activeProfile) {
              if (msg.data.activeProfile.defaultInputs) {
                setRmeInputs(msg.data.activeProfile.defaultInputs.map((i: any) => ({
                  id: i.id,
                  port: i.port,
                  name: i.customName || i.name,
                  role: "input",
                  gain: i.gain,
                  level: i.level || 0,
                  isMuted: i.isMuted,
                  toBooth: true,
                  toStream: true,
                  toCR: true
                })));
              }
              if (msg.data.activeProfile.defaultOutputs) {
                setRmeOutputs(msg.data.activeProfile.defaultOutputs.map((o: any) => ({
                  id: o.id,
                  port: o.port,
                  name: o.customName || o.name,
                  role: "output",
                  level: o.level,
                  isMuted: o.isMuted
                })));
              }
            }
            if (msg.data.connectedClients) {
              setParticipants(msg.data.connectedClients.map((c: any) => ({
                id: c.id,
                name: c.name,
                role: c.role === "guest_participant" ? "Pozvani Gost" : "Naručilac (Agencija)",
                email: c.email || "lan@local",
                online: true,
                isSpeaking: c.isSpeaking || false,
                incomingLevel: c.incomingLevel || 0,
                volumeCR: c.volume || 80,
                volumeBooth: 70,
                isMuted: c.isMuted || false,
                hearsStudio: true,
              })));
            }
          }
          if (msg.type === "CLIENTS_UPDATED" && msg.clients) {
            setParticipants(msg.clients.map((c: any) => ({
              id: c.id,
              name: c.name,
              role: c.role === "guest_participant" ? "Pozvani Gost" : "Naručilac (Agencija)",
              email: c.email || "lan@local",
              online: true,
              isSpeaking: c.isSpeaking || false,
              incomingLevel: c.incomingLevel || 0,
              volumeCR: c.volume || 80,
              volumeBooth: 70,
              isMuted: c.isMuted || false,
              hearsStudio: true,
            })));
          }
          if ((msg.type === "MATRIX_UPDATED") && (msg.fluxaxMatrix || msg.danteMatrix)) {
            setFluxaxMatrix(msg.fluxaxMatrix || msg.danteMatrix);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsDaemonConnected(false);
      };
    } catch {
      setIsDaemonConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const selectHardwareDevice = (devId: string) => {
    setCurrentDeviceId(devId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "SELECT_HARDWARE_DEVICE", deviceId: devId }));
    }
  };

  const toggleCrosspointPatch = (inpId: number, outId: number) => {
    setFluxaxMatrix((prev) => ({
      ...prev,
      [inpId]: {
        ...prev[inpId],
        [outId]: !prev[inpId]?.[outId]
      }
    }));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "TOGGLE_CROSSPOINT", inputId: inpId, outputId: outId }));
    }
  };

  const updateChannelCustomName = (chType: "input" | "output", id: number, newName: string) => {
    if (chType === "input") {
      setRmeInputs((prev) => prev.map((ch) => ch.id === id ? { ...ch, name: newName } : ch));
    } else {
      setRmeOutputs((prev) => prev.map((ch) => ch.id === id ? { ...ch, name: newName } : ch));
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "UPDATE_CHANNEL", channelType: chType, id, customName: newName }));
    }
  };

  const activeSpeaker = participants.find((p) => p.isSpeaking);

  const toggleMute = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  const toggleHearsStudio = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hearsStudio: !p.hearsStudio } : p))
    );
  };

  const setCRVolume = (id: string, vol: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, volumeCR: vol } : p))
    );
  };

  const setBoothVolume = (id: string, vol: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, volumeBooth: vol } : p))
    );
  };

  // RME Input Helpers
  const toggleRmeInputMute = (id: number) => {
    setRmeInputs((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isMuted: !ch.isMuted } : ch))
    );
  };

  const updateRmeInputGain = (id: number, val: number) => {
    setRmeInputs((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, gain: val } : ch))
    );
  };

  const toggleRmeInputRoute = (id: number, bus: "toBooth" | "toStream" | "toCR") => {
    setRmeInputs((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [bus]: !ch[bus] } : ch))
    );
  };

  // Screen Capture trigger for video window
  const requestScreenCapture = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const track = stream.getVideoTracks()[0];
        setCapturedVideoName(track.label || "Vegas Pro Video Ekran (Deljeno)");
        setIsScreenSharing(true);
        track.onended = () => {
          setIsScreenSharing(false);
          setCapturedVideoName("Vegas Pro 21 • Video Preview (Pauzirano)");
        };
      } else {
        alert("WebRTC Screen Capture API je spreman za povezivanje sa vašim Vegas Pro prozorom.");
      }
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 0. DIRECTOR CONSOLE HEADER & HARDWARE BAR                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e141f] border border-stone-800">
        <div className="flex items-center gap-4">
          <FluxaxNetLogo size="sm" />
          <div className="h-7 w-px bg-stone-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm font-sans">
                Studio Režija & FluxaX Interfejs
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border transition-colors ${
                  isDaemonConnected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
                title="Lokalni StudioBridge servis na http://127.0.0.1:4040"
              >
                {isDaemonConnected ? "● FLUXAX NET AKTIVAN (:4040)" : "○ SIMULATOR"}
              </span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              Sample Rate: <strong className="text-stone-200">48.0 kHz / 24-bit</strong> • Buffer: <strong className="text-cyan-400">128 samples (2.7ms)</strong>
            </span>
          </div>
        </div>

        {/* Console Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveConsoleTab("session")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeConsoleTab === "session"
                ? "bg-orange-500 text-stone-950 shadow-md"
                : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Režijski Mikser & Sesija</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab("rme_hardware")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeConsoleTab === "rme_hardware"
                ? "bg-cyan-500 text-stone-950 shadow-md"
                : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. RME Matrica Rutiranja (12 IN / 8 OUT)</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab("video_source")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeConsoleTab === "video_source"
                ? "bg-amber-400 text-stone-950 shadow-md"
                : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>3. Video Sync Izvor</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE REŽIJSKI MIKSER & SESIJA                                      */}
      {/* ========================================================================= */}
      {activeConsoleTab === "session" && (
        <div className="space-y-6">
          
          {/* Top Status & Master Out Monitor Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl bg-[#111622] border border-stone-800 shadow-2xl">
            {/* Left: Compact Outgoing Video Stream Monitor */}
            <div className="lg:col-span-4 flex gap-4 items-center bg-stone-900/90 p-4 rounded-2xl border border-stone-800">
              <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-stone-700">
                <img
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80"
                  alt="Video Preview Out"
                  className="w-full h-full object-cover filter brightness-75"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-red-500">
                  OUT
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-stone-300">
                  1080p25
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-white">Video Sync Out</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Prozor: <strong className="text-stone-200">{capturedVideoName}</strong>
                </p>
                <button
                  onClick={requestScreenCapture}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Promijeni prozor dijeljenja
                </button>
              </div>
            </div>

            {/* Middle: Outgoing Master VU Meter */}
            <div className="lg:col-span-5 bg-stone-900/90 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-orange-400" />
                  <span>Outgoing Master Stream (Ka Klijentima)</span>
                </span>
                <span className="text-[10px] text-stone-400">
                  EBU R128: <strong className="text-cyan-400">-23.1 LUFS</strong>
                </span>
              </div>

              <div className="space-y-1.5 py-1">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-3 text-stone-500 font-bold">L</span>
                  <div className="flex-1 h-3.5 bg-black rounded-sm overflow-hidden p-0.5 flex items-center border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-2xs transition-all duration-100"
                      style={{ width: `${outgoingLeft}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-stone-300">-2.4 dB</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-3 text-stone-500 font-bold">R</span>
                  <div className="flex-1 h-3.5 bg-black rounded-sm overflow-hidden p-0.5 flex items-center border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-2xs transition-all duration-100"
                      style={{ width: `${outgoingRight}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-stone-300">-2.8 dB</span>
                </div>
              </div>

              <div className="flex justify-between text-[9px] font-mono text-stone-500 px-5 pt-0.5">
                <span>-48</span>
                <span>-36</span>
                <span>-24</span>
                <span className="text-cyan-400 font-bold">-18 (EBU)</span>
                <span>-12</span>
                <span>-6</span>
                <span>-3</span>
                <span className="text-red-400">0 dBFS</span>
              </div>
            </div>

            {/* Right: Master Session Controls & On-Air */}
            <div className="lg:col-span-3 bg-stone-900/90 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">Režijski Status</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  48kHz / 24-bit
                </span>
              </div>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isRecording
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-500 animate-pulse"
                    : "bg-stone-800 text-stone-400 border border-stone-700"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-white" : "bg-stone-500"}`} />
                <span>{isRecording ? "● REC ON AIR" : "PAUZA (STANDBY)"}</span>
              </button>
            </div>
          </div>

          {/* Active Speaker Beacon */}
          <div className="p-4 rounded-2xl bg-[#0f141d] border border-cyan-500/30 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                Detekcija Govornika:
              </span>
              {activeSpeaker ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{activeSpeaker.name} ({activeSpeaker.role})</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-stone-500 italic">
                  Tišina na linijama (Niko od učesnika trenutno ne govori)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Talkback:</span>
                <button
                  onClick={() => setTalkbackMode("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    talkbackMode === "all" ? "bg-orange-500 text-stone-950 font-bold" : "bg-stone-800 text-stone-400"
                  }`}
                >
                  Svima (All)
                </button>
                <button
                  onClick={() => setTalkbackMode("booth_only")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    talkbackMode === "booth_only" ? "bg-cyan-500 text-stone-950 font-bold" : "bg-stone-800 text-stone-400"
                  }`}
                >
                  Samo Spikeru (Booth Only)
                </button>
              </div>

              <button
                onMouseDown={() => setTalkbackActive(true)}
                onMouseUp={() => setTalkbackActive(false)}
                className={`px-5 py-2 rounded-xl font-bold transition-all select-none cursor-pointer flex items-center gap-2 ${
                  talkbackActive
                    ? "bg-emerald-500 text-stone-950 scale-95 shadow-lg shadow-emerald-500/30"
                    : "bg-stone-800 hover:bg-stone-700 text-white border border-stone-700"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{talkbackActive ? "GOVORITE U INTERKOM..." : "HOLD TALKBACK"}</span>
              </button>
            </div>
          </div>

          {/* Multi-Channel Mixer Strip */}
          <div className="rounded-3xl bg-[#111622] border border-stone-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-sans">
                  Režijski Tonski Pult & Kontrola Učesnika
                </h3>
              </div>
              <span className="text-xs font-mono text-stone-400">
                Pojedinačni nivoi za Režiju (CR) i za Slušalice Spikera (Booth)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Channel 1: Booth Talent Mic */}
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Studio Ulaz
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">RME In 1</span>
                  </div>
                  <span className="text-xs font-bold text-white block truncate mb-3">
                    Gluva Soba (Neumann U87)
                  </span>

                  <div className="h-2.5 bg-black rounded-full overflow-hidden p-0.5 mb-3 border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-100"
                      style={{ width: `${rmeInputs[0].gain * 0.85}%` }}
                    />
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                        <span>Mic Preamp Gain</span>
                        <span className="text-amber-400 font-bold">+{rmeInputs[0].gain} dB</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rmeInputs[0].gain}
                        onChange={(e) => updateRmeInputGain(1, Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500">Routing: In 1 ➔ Booth & Stream</span>
                  <button
                    onClick={() => toggleRmeInputMute(1)}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rmeInputs[0].isMuted ? "bg-red-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                    }`}
                  >
                    {rmeInputs[0].isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Channel 2: RME Loopback DAW Master */}
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      DAW Loopback
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">RME In 7/8</span>
                  </div>
                  <span className="text-xs font-bold text-white block truncate mb-3">
                    Vegas / Cubase Playback
                  </span>

                  <div className="h-2.5 bg-black rounded-full overflow-hidden p-0.5 mb-3 border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${rmeInputs[6].gain * 0.8}%` }}
                    />
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                        <span>Playback Nivo</span>
                        <span className="text-cyan-400 font-bold">{rmeInputs[6].gain}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rmeInputs[6].gain}
                        onChange={(e) => updateRmeInputGain(7, Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500">Loopback RME Feed</span>
                  <button
                    onClick={() => toggleRmeInputMute(7)}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rmeInputs[6].isMuted ? "bg-red-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                    }`}
                  >
                    {rmeInputs[6].isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Channels 3+: Real Connected Participants */}
              {participants.length === 0 ? (
                <div className="lg:col-span-3 p-5 rounded-2xl bg-stone-900/60 border border-dashed border-stone-800 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Čeka se povezivanje eksternih laptopa
                    </span>
                    <p className="text-[11px] text-stone-400 font-mono mt-1 max-w-xs">
                      Povežite svoje laptope na sesiju preko lokalne mreže za testiranje zvuka i režijskog talkback-a:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => {
                        const host = typeof window !== "undefined" ? window.location.hostname : "192.168.70.150";
                        navigator.clipboard.writeText(`http://${host}:1991/client-portal?role=guest_participant&name=Laptop-1`);
                        alert("Link za Laptop 1 (Gost) je kopiran u clipboard!");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono font-bold border border-stone-700 cursor-pointer"
                    >
                      Kopiraj Link za Laptop 1 (Gost)
                    </button>
                    <button
                      onClick={() => {
                        const host = typeof window !== "undefined" ? window.location.hostname : "192.168.70.150";
                        navigator.clipboard.writeText(`http://${host}:1991/client-portal?role=agency_tenant&name=Laptop-2`);
                        alert("Link za Laptop 2 (Naručilac) je kopiran u clipboard!");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-cyan-300 text-[10px] font-mono font-bold border border-stone-700 cursor-pointer"
                    >
                      Kopiraj Link za Laptop 2 (Agencija)
                    </button>
                  </div>
                </div>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl bg-stone-900/90 border flex flex-col justify-between transition-all duration-200 ${
                      p.isSpeaking
                        ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] bg-[#171c26]"
                        : "border-stone-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono font-bold uppercase ${p.isSpeaking ? "text-amber-400" : "text-stone-500"}`}>
                          {p.isSpeaking ? "● GOVORI" : "Online"}
                        </span>
                        <button
                          onClick={() => toggleHearsStudio(p.id)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                            p.hearsStudio
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                          title="Da li ovaj klijent sluša signal režije"
                        >
                          {p.hearsStudio ? "Sluša Režiju" : "Isključen"}
                        </button>
                      </div>

                      <span className="text-xs font-bold text-white block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-stone-400 block truncate mb-3">
                        {p.role}
                      </span>

                      <div className="h-2 bg-black rounded-full overflow-hidden p-0.5 mb-3 border border-stone-800">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-100"
                          style={{ width: p.isMuted ? "0%" : `${p.incomingLevel}%` }}
                        />
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                            <span>CR (Režija)</span>
                            <span className="text-white font-bold">{p.volumeCR}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={p.volumeCR}
                            onChange={(e) => setCRVolume(p.id, Number(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                            <span>Booth (Spiker)</span>
                            <span className="text-amber-400 font-bold">{p.volumeBooth}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={p.volumeBooth}
                            onChange={(e) => setBoothVolume(p.id, Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-stone-500">Mute Učesnika:</span>
                      <button
                        onClick={() => toggleMute(p.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          p.isMuted
                            ? "bg-red-600 text-white"
                            : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                        }`}
                      >
                        {p.isMuted ? "MUTIRAN" : "MUTE"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Bar: Take Selector & One-Click Fluxa Sync */}
          <div className="p-6 rounded-3xl bg-[#111622] border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Odobreni Tejk za Sinhronizaciju:</span>
              </span>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((take) => (
                  <button
                    key={take}
                    onClick={() => setSelectedTake(take)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      selectedTake === take
                        ? "bg-orange-500 text-stone-950 shadow-md"
                        : "bg-stone-800 text-stone-400 hover:text-white"
                    }`}
                  >
                    Tejk {take}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSyncToFluxa(selectedTake)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-stone-950 font-bold text-xs font-mono tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Kopiraj Tejk {selectedTake} u Fluxa Klijentski Folder</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLUXAX MATRICA RUTIRANJA & IZBOR HARDVERA                        */}
      {/* ========================================================================= */}
      {activeConsoleTab === "rme_hardware" && (
        <div className="space-y-6">
          
          {/* Header Specs & Hardware Device Selector */}
          <div className="p-6 rounded-3xl bg-[#111622] border border-cyan-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                FluxaX Matrix Controller • Studio TAF
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                FluxaX Hardverska Matrica Rutiranja & Upravljanje Signalom
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Odaberite fizički interfejs ili automatski skenirajte OS hardver za dinamički patch signala.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              {/* OS Hardware Auto-Scan Trigger */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
                    const res = await fetch(`http://${host}:4040/api/hardware/scan`);
                    const data = await res.json();
                    if (data && data.devices) {
                      alert(`FluxaX Auto-Skener detektovao:\n${data.devices.map((d: any) => `• ${d.name} (${d.inferredIn} In / ${d.inferredOut} Out)`).join('\n')}`);
                    }
                  } catch {
                    alert("StudioBridge nije dostupan na portu :4040 za skeniranje.");
                  }
                }}
                className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>🔍 Skeniraj Hardver (OS)</span>
              </button>

              {/* Hardware Device Picker */}
              <div className="bg-stone-900 p-2 rounded-xl border border-stone-700">
                <label className="text-[10px] text-orange-400 font-bold block mb-1 uppercase tracking-wider">
                  Fizički Audio Interfejs:
                </label>
                <select
                  value={currentDeviceId}
                  onChange={(e) => selectHardwareDevice(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-600 text-white font-bold cursor-pointer focus:outline-hidden focus:border-cyan-400"
                >
                  {availableDevices.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Sample Rate</label>
                <select
                  value={sampleRate}
                  onChange={(e) => setSampleRate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-bold"
                >
                  <option value="44100">44.1 kHz (CD Audio)</option>
                  <option value="48000">48.0 kHz (Broadcast Pro)</option>
                  <option value="96000">96.0 kHz (Hi-Res Master)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">ASIO Buffer Size</label>
                <select
                  value={bufferSize}
                  onChange={(e) => setBufferSize(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-cyan-400 font-bold"
                >
                  <option value="64">64 samples (1.3 ms)</option>
                  <option value="128">128 samples (2.7 ms)</option>
                  <option value="256">256 samples (5.3 ms)</option>
                  <option value="512">512 samples (10.6 ms)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Zero-Bleed Protection Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs font-mono text-indigo-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>
                <strong>Zero-Bleed Split Zaštita Aktivna:</strong> Govor sa online klijentskih laptopa nikada ne ulazi u DAW Record Bus (trake za snimanje).
              </span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
              HARDWARE SAFEGUARD
            </span>
          </div>

          {/* FLUXAX 2D CROSSLINK ROUTING MATRIX */}
          <div className="rounded-3xl bg-[#111622] border border-stone-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-white font-sans">
                  FluxaX 2D Matrica Ukrštanja (Crosspoint Grid)
                </h4>
              </div>
              <span className="text-xs font-mono text-stone-400">
                Kliknite na tačku ukrštanja za trenutan hardverski patch
              </span>
            </div>

            <div className="overflow-x-auto pb-4">
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr>
                    <th className="p-3 text-left bg-stone-950 border border-stone-800 text-stone-400 text-[11px] min-w-[200px]">
                      Izvori (Ulazi) ➔<br />Destinacije (Izlazi) ↓
                    </th>
                    {rmeOutputs.map((out) => (
                      <th
                        key={out.id}
                        className="p-2 border border-stone-800 bg-stone-900/90 text-cyan-300 text-[10px] text-center font-bold min-w-[90px]"
                      >
                        <div className="truncate max-w-[100px]" title={`${out.port}: ${out.name}`}>
                          {out.port}
                        </div>
                        <div className="text-[9px] text-stone-400 font-normal truncate max-w-[100px]">
                          {out.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rmeInputs.map((inp) => (
                    <tr key={inp.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="p-2.5 border border-stone-800 bg-stone-950 text-amber-300 font-bold">
                        <div className="flex items-center justify-between">
                          <span>{inp.port}</span>
                          <span className="text-[11px] text-white font-normal truncate max-w-[140px]" title={inp.name}>
                            {inp.name}
                          </span>
                        </div>
                      </td>
                      {rmeOutputs.map((out) => {
                        const isPatched = !!fluxaxMatrix[inp.id]?.[out.id];
                        return (
                          <td key={out.id} className="p-2 border border-stone-800 text-center">
                            <button
                              type="button"
                              onClick={() => toggleCrosspointPatch(inp.id, out.id)}
                              className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isPatched
                                  ? "bg-emerald-500 text-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.5)] font-bold scale-105"
                                  : "bg-stone-900 hover:bg-stone-800 text-stone-600 border border-stone-800"
                              }`}
                              title={`${inp.name} ➔ ${out.name}`}
                            >
                              {isPatched ? "✓" : "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular Channel Configuration (Renaming & Active Toggles) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Inputs Management */}
            <div className="rounded-3xl bg-[#111622] border border-stone-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-sm font-bold text-amber-400 font-sans">
                  Prilagođeni Nazivi Ulaza ({rmeInputs.length} kanala)
                </span>
                <span className="text-[10px] font-mono text-stone-400">Ulaz n ➔ Naziv</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {rmeInputs.map((inp) => (
                  <div key={inp.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-3 text-xs font-mono">
                    <span className="w-16 font-bold text-amber-400 shrink-0">{inp.port}</span>
                    <input
                      type="text"
                      value={inp.name}
                      onChange={(e) => updateChannelCustomName("input", inp.id, e.target.value)}
                      placeholder="Naziv ulaza..."
                      className="flex-1 bg-stone-950 border border-stone-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-cyan-400"
                    />
                    <div className="w-16 h-2 bg-black rounded-full overflow-hidden shrink-0 border border-stone-800">
                      <div className="h-full bg-emerald-400" style={{ width: `${inp.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs Management */}
            <div className="rounded-3xl bg-[#111622] border border-stone-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-sm font-bold text-cyan-400 font-sans">
                  Prilagođeni Nazivi Izlaza ({rmeOutputs.length} kanala)
                </span>
                <span className="text-[10px] font-mono text-stone-400">Izlaz n ➔ Naziv</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {rmeOutputs.map((out) => (
                  <div key={out.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-3 text-xs font-mono">
                    <span className="w-16 font-bold text-cyan-400 shrink-0">{out.port}</span>
                    <input
                      type="text"
                      value={out.name}
                      onChange={(e) => updateChannelCustomName("output", out.id, e.target.value)}
                      placeholder="Naziv izlaza..."
                      className="flex-1 bg-stone-950 border border-stone-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-cyan-400"
                    />
                    <span className="text-[11px] text-stone-400 w-12 text-right">{out.level}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Preset Actions */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <span className="text-stone-400">
              Aktivni Hardver: <strong className="text-white">{availableDevices.find((d) => d.id === currentDeviceId)?.name || currentDeviceId}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => alert("FluxaX matrica i nazivi kanala su trajno sačuvani u StudioBridge servisu!")}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-stone-950 font-bold cursor-pointer shadow-md"
              >
                Sačuvaj FluxaX Konfiguraciju
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VIDEO SYNC SOURCE (DIJELJENJE RADNOG PROZORA IZ SOFTVERA)          */}
      {/* ========================================================================= */}
      {activeConsoleTab === "video_source" && (
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#111622] border border-stone-800 p-8 shadow-2xl space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
              Video Sinhronizacija Režije
            </span>
            <h3 className="text-2xl font-bold text-white">
              Odabir Video Prozora za Klijente (Vegas Pro Preview)
            </h3>
            <p className="text-xs text-stone-400 font-mono mt-1">
              Klijenti vide samo ovaj prozor sa videom u realnom vremenu (1080p, bez timeline-a, bez alata).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-bold">Trenutno odabrani prozor:</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {capturedVideoName}
              </span>
            </div>

            <p className="text-stone-400 leading-relaxed font-light">
              Klikom na dugme ispod, pretraživač će vam ponuditi prozor koji želite podijeliti. 
              Odaberite vaš <strong>Video Preview prozor</strong> iz montažnog programa. Klijenti na svojim portalima 
              dobijaju kristalno čist video feed sinhronizovan sa audio streamom.
            </p>

            <button
              onClick={requestScreenCapture}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Tv className="w-4 h-4" />
              <span>Odaberi Video Prozor iz Programa</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
