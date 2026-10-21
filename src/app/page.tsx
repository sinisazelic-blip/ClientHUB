"use client";

import React, { useState, useEffect, useRef } from "react";
import FluxaxNetLogo from "@/components/FluxaxNetLogo";
import ReceptionLobby from "@/components/ReceptionLobby";
import StudioDirectorConsole from "@/components/StudioDirectorConsole";
import {
  Radio,
  Tv,
  Mic,
  MicOff,
  Star,
  Clock,
  DoorOpen,
  DoorClosed,
  Send,
  Download,
  Info,
  LogOut,
  Users,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { SessionItem, SessionTake } from "@/app/api/studio/status/route";

type UserRole = "agency_tenant" | "guest_participant" | "studio_director";

export default function ClientHubPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("studio_director");
  const [isInStudio, setIsInStudio] = useState<boolean>(false);

  // Sessions and Active Session state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);

  // Client Talkback (ON / OFF toggle)
  const [clientTalkbackOn, setClientTalkbackOn] = useState<boolean>(false);

  // Active Segment for Client View
  const [clientSegmentIdx, setClientSegmentIdx] = useState<number>(0);

  // Live Chat
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string; isDirector?: boolean }[]
  >([
    {
      sender: "Režija",
      text: "Dobrodošli u studio. Spremni smo za početak snimanja.",
      time: "20:30",
      isDirector: true,
    },
  ]);
  const [newChatText, setNewChatText] = useState("");

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch status & sessions from API
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/studio/status");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setActiveSession(data.activeSession || null);

        // Auto transition client into studio if doors open and role is client
        if (data.activeSession?.isDoorOpen && currentRole !== "studio_director") {
          setIsInStudio(true);
        } else if (!data.activeSession?.isDoorOpen && currentRole !== "studio_director") {
          setIsInStudio(false);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [currentRole]);

  // Read URL params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role") as UserRole;
      if (roleParam) setCurrentRole(roleParam);
      const sessionParam = params.get("session");
      if (sessionParam) {
        fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: sessionParam }),
        }).then(fetchStatus);
      }
    }
  }, []);

  const handleEnterStudio = async (sessId: string) => {
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: sessId }),
      });
      await fetchStatus();
      setIsInStudio(true);
    } catch (_) {}
  };

  const handleExitStudio = () => {
    setIsInStudio(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const sender =
      currentRole === "studio_director"
        ? "Režija (Siniša)"
        : currentRole === "agency_tenant"
        ? "Naručilac (Agencija)"
        : "Gost";

    setChatMessages((prev) => [
      ...prev,
      {
        sender,
        text: newChatText.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isDirector: currentRole === "studio_director",
      },
    ]);
    setNewChatText("");
  };

  const handleClientSetTakeStatus = async (
    segId: string,
    takeId: number,
    status: SessionTake["status"]
  ) => {
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_TAKE_STATUS",
          segmentId: segId,
          takeId,
          status,
        }),
      });
      fetchStatus();
    } catch (_) {}
  };

  const activeSeg =
    activeSession?.segments[clientSegmentIdx] || activeSession?.segments[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* GLOBAL ROLE SWITCHER BAR (Za brzo testiranje režije, agencije i gosta) */}
      <div className="bg-stone-900/90 border-b border-stone-800 px-6 py-1.5 flex items-center justify-between text-xs z-50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Režim Prikaza:
          </span>
          <div className="inline-flex bg-stone-950 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => {
                setCurrentRole("studio_director");
                setIsInStudio(false);
              }}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                currentRole === "studio_director"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              1. Studio Režija (Tonac)
            </button>
            <button
              onClick={() => setCurrentRole("agency_tenant")}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                currentRole === "agency_tenant"
                  ? "bg-cyan-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              2. Naručilac (Agencija)
            </button>
            <button
              onClick={() => setCurrentRole("guest_participant")}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                currentRole === "guest_participant"
                  ? "bg-cyan-500 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              3. Pozvani Gost / Klijent
            </button>
          </div>
        </div>

        <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FluxaX Net Client HUB • Port 1991</span>
        </div>
      </div>

      {/* VIEW ROUTING */}
      {!isInStudio ? (
        /* RECEPTION LOBBY & CALENDAR (Or Waiting Room for clients when doors closed) */
        <ReceptionLobby
          role={currentRole}
          sessions={sessions}
          activeSession={activeSession}
          onEnterStudio={handleEnterStudio}
          onRefreshSessions={fetchStatus}
        />
      ) : currentRole === "studio_director" ? (
        /* DIRECTOR STUDIO CONSOLE */
        activeSession && (
          <StudioDirectorConsole
            session={activeSession}
            onExitSession={handleExitStudio}
            onUpdateSession={fetchStatus}
          />
        )
      ) : (
        /* CLIENT / GUEST LIVE STUDIO ROOM */
        activeSession && (
          <div className="flex-1 flex flex-col">
            {/* Topbar for Client */}
            <header className="bg-stone-900 border-b border-stone-800 px-6 py-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <FluxaxNetLogo size="sm" />
                <div className="border-l border-stone-800 pl-3">
                  <div className="text-sm font-bold text-white leading-tight">
                    {activeSession.projectName}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Spiker: <strong className="text-cyan-400">{activeSession.speakerName}</strong> • Studio TAF
                  </div>
                </div>
              </div>

              {/* Status Beacon */}
              <div className="flex items-center gap-3">
                {activeSession.isOnAir ? (
                  <div className="px-4 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs tracking-wider animate-pulse border border-red-400 shadow-lg shadow-red-600/30 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>● REC ON AIR - SNIMA SE</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5">
                    <span>Spreman za tejk</span>
                  </div>
                )}

                <button
                  onClick={handleExitStudio}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Izađi</span>
                </button>
              </div>
            </header>

            {/* Client Studio Body */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Screen & Scenario */}
              <div className="lg:col-span-8 space-y-6">
                {/* VIDEO OR STUDIO RADIO INFO BOX */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
                  {activeSession.videoEnabled ? (
                    <div className="p-8 text-center bg-black/60 min-h-[240px] flex flex-col items-center justify-center">
                      <Tv className="w-12 h-12 text-cyan-400 mb-2 opacity-80" />
                      <h4 className="text-sm font-bold text-white mb-1">
                        Video prozor iz DAW / montažnog programa
                      </h4>
                      <p className="text-xs text-stone-400 max-w-md">
                        Slika je sinhronizovana sa tonom u realnom vremenu (1080p, ultra-niska latencija).
                      </p>
                    </div>
                  ) : (
                    /* Large Studio Info Box */
                    <div className="p-8 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                          Projekat
                        </span>
                        <h3 className="text-2xl font-bold text-white">{activeSession.projectName}</h3>
                        <span className="text-xs text-stone-400 block mt-1">
                          Naručilac: <strong className="text-stone-200">{activeSession.clientName}</strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                          Tačno Vrijeme Studija
                        </span>
                        <div className="font-mono text-2xl font-bold text-cyan-400" suppressHydrationWarning>
                          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                        <span className="text-xs text-stone-400 block mt-1">
                          Spiker: <strong className="text-cyan-400">{activeSession.speakerName}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Client Talkback Toggle Bar */}
                  <div className="px-5 py-3.5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between">
                    <div className="text-xs text-stone-400">
                      Vaš Mikrofon ka Režiji:
                    </div>

                    <button
                      onClick={() => setClientTalkbackOn(!clientTalkbackOn)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-md ${
                        clientTalkbackOn
                          ? "bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 shadow-amber-500/20"
                          : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                      }`}
                    >
                      {clientTalkbackOn ? <Mic className="w-4 h-4 fill-current" /> : <MicOff className="w-4 h-4" />}
                      <span>{clientTalkbackOn ? "🔴 MIKROFON UKLJUČEN" : "⚪ MIKROFON ISKLJUČEN"}</span>
                    </button>
                  </div>
                </div>

                {/* Scenario & Takes for Client */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Scenario & Odabir Tejkova
                    </h4>

                    {/* Segment tabs */}
                    <div className="flex gap-2">
                      {activeSession.segments.map((seg, idx) => (
                        <button
                          key={seg.id}
                          onClick={() => setClientSegmentIdx(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            clientSegmentIdx === idx
                              ? "bg-cyan-500 text-stone-950"
                              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                          }`}
                        >
                          {seg.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeSeg && (
                    <div className="space-y-4">
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                        <div className="text-xs font-mono text-cyan-400 mb-1">{activeSeg.targetDuration}</div>
                        <p className="text-sm text-stone-200 leading-relaxed font-serif">
                          „{activeSeg.text}“
                        </p>
                      </div>

                      {/* Takes for client voting / starring */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-stone-400 mr-1">Ocjena tejka:</span>
                        {activeSeg.takes.map((take) => (
                          <div
                            key={take.id}
                            className="inline-flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1 text-xs"
                          >
                            <span className="font-mono text-white font-bold">{take.name}</span>
                            <button
                              onClick={() =>
                                handleClientSetTakeStatus(
                                  activeSeg.id,
                                  take.id,
                                  take.status === "final" ? "none" : "final"
                                )
                              }
                              title="Glasaj za ovaj tejk (Zvijezdica)"
                              className={`p-1 rounded cursor-pointer ${
                                take.status === "final"
                                  ? "text-emerald-400"
                                  : "text-stone-500 hover:text-emerald-400"
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${take.status === "final" ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download Master Button */}
                  {activeSession.fluxaDownloadUrl && (
                    <div className="mt-5 pt-4 border-t border-stone-800 flex justify-end">
                      <a
                        href={activeSession.fluxaDownloadUrl}
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
              </div>

              {/* Right Column: Live Chat with Režija */}
              <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Režijski Chat & Sugestije</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">LIVE</span>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs ${
                        msg.isDirector
                          ? "bg-amber-950/40 border border-amber-800/60 text-amber-200"
                          : "bg-stone-950 border border-stone-800 text-stone-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[10px] text-stone-400">
                        <strong className={msg.isDirector ? "text-amber-400" : "text-cyan-400"}>
                          {msg.sender}
                        </strong>
                        <span className="font-mono">{msg.time}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Chat input form */}
                <form onSubmit={handleSendChat} className="pt-3 border-t border-stone-800 flex gap-2">
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="Upišite napomenu za režiju..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </main>
          </div>
        )
      )}
    </div>
  );
}
