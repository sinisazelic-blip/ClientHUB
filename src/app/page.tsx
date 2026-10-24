"use client";

import React, { useState, useEffect } from "react";
import FluxaxNetLogo, { FluxaxDynamicLiveStreamBadge } from "@/components/FluxaxNetLogo";
import ReceptionLobby from "@/components/ReceptionLobby";
import StudioDirectorConsole from "@/components/StudioDirectorConsole";
import { ClaHardwareConsole } from "@/components/ClaHardwareConsole";
import {
  Tv,
  Mic,
  MicOff,
  Star,
  Download,
  LogOut,
  MessageSquare,
  ExternalLink,
  Send,
  Users,
  Share2,
  FileAudio,
  FileVideo,
  FileText,
  CheckCircle,
  XCircle,
  Video,
} from "lucide-react";
import {
  SessionItem,
  SessionTake,
  SessionAttendee,
  ProjectFileItem,
} from "@/app/api/studio/status/route";
import { format24Time, format24TimeShort } from "@/lib/formatTime";
import { APP_CONFIG } from "@/config/appConfig";

type UserRole = "agency_tenant" | "guest_participant" | "studio_director";

export default function ClientHubPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("studio_director");
  const [isInStudio, setIsInStudio] = useState<boolean>(false);

  // Sessions and Active Session state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [studioName, setStudioName] = useState<string>("");

  // Separate Talkback / Mic states by role (Naručilac vs Klijent gost)
  const [agencyTalkbackOn, setAgencyTalkbackOn] = useState<boolean>(false);
  const [guestTalkbackOn, setGuestTalkbackOn] = useState<boolean>(false);

  // Console & Audio Control states by role
  const [agencyConsole, setAgencyConsole] = useState({
    micGain: 0,
    phonesVol: 0,
    isMuted: false,
    isDimmed: false,
    autoDuck: true,
    monitorMode: "stereo" as "stereo" | "mono",
    hdCodec: true,
  });

  const [guestConsole, setGuestConsole] = useState({
    micGain: 0,
    phonesVol: 0,
    isMuted: false,
    isDimmed: false,
    autoDuck: true,
    monitorMode: "stereo" as "stereo" | "mono",
    hdCodec: true,
  });

  const activeConsole = currentRole === "agency_tenant" ? agencyConsole : guestConsole;
  const updateActiveConsole = (patch: Partial<typeof agencyConsole>) => {
    if (currentRole === "agency_tenant") {
      setAgencyConsole((prev) => ({ ...prev, ...patch }));
    } else {
      setGuestConsole((prev) => ({ ...prev, ...patch }));
    }
  };

  const isCurrentTalkbackOn = currentRole === "agency_tenant" ? agencyTalkbackOn : guestTalkbackOn;
  const handleCurrentTalkbackToggle = async (active: boolean) => {
    if (currentRole === "agency_tenant") {
      setAgencyTalkbackOn(active);
    } else if (currentRole === "guest_participant") {
      setGuestTalkbackOn(active);
    }

    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_TALKBACK",
          role: currentRole,
          active,
        }),
      });
    } catch (_) {}
  };

  // Active Segment for Client View
  const [clientSegmentIdx, setClientSegmentIdx] = useState<number>(0);

  // Live Chat
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string; isDirector?: boolean }[]
  >([
    {
      sender: "Režija (Siniša)",
      text: "Dobrodošli u studio. Oprema i linije su spremne, možemo početi.",
      time: "20:30",
      isDirector: true,
    },
  ]);
  const [newChatText, setNewChatText] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/studio/status");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setActiveSession(data.activeSession || null);
        if (data.studioName !== undefined) {
          setStudioName(data.studioName);
        }

        // Auto door enter for client/agency if door is open
        if (data.activeSession?.isDoorOpen && currentRole !== "studio_director") {
          setIsInStudio(true);
        } else if (!data.activeSession?.isDoorOpen && currentRole !== "studio_director") {
          setIsInStudio(false);
        }

        if (data.roleTalkbacks) {
          if (currentRole !== "agency_tenant" && typeof data.roleTalkbacks.agency_tenant === "boolean") {
            setAgencyTalkbackOn(data.roleTalkbacks.agency_tenant);
          }
          if (currentRole !== "guest_participant" && typeof data.roleTalkbacks.guest_participant === "boolean") {
            setGuestTalkbackOn(data.roleTalkbacks.guest_participant);
          }
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
        ? "Režija"
        : currentRole === "agency_tenant"
        ? "Naručilac"
        : "Klijent";

    setChatMessages((prev) => [
      ...prev,
      {
        sender,
        text: newChatText.trim(),
        time: format24TimeShort(new Date()),
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
    <div className="min-h-screen studio-light-bg text-slate-800 flex flex-col font-sans">
      {/* GLOBAL ROLE SWITCHER BAR WITH OFFICIAL FLUXAX CLIENT HUB BRANDING */}
      <div className="bg-white/95 border-b border-teal-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs z-50 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <FluxaxNetLogo size="sm" />

          <div className="hidden sm:flex items-center gap-2 border-l border-teal-200 pl-4">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              Režim Prikaza:
            </span>
            <div className="inline-flex bg-teal-50/80 p-0.5 rounded-lg border border-teal-200">
              {/* STUDIO BUTTON: NEVER FORCES EXIT IF ACTIVE SESSION EXISTS */}
              <button
                onClick={() => {
                  setCurrentRole("studio_director");
                  if (activeSession) {
                    setIsInStudio(true);
                  }
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentRole === "studio_director"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-teal-900"
                }`}
              >
                Studio (Režija)
              </button>
              <button
                onClick={() => setCurrentRole("agency_tenant")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentRole === "agency_tenant"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-teal-900"
                }`}
              >
                Naručilac (Agencija)
              </button>
              <button
                onClick={() => setCurrentRole("guest_participant")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentRole === "guest_participant"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-teal-900"
                }`}
              >
                Klijent (Gost)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FluxaxDynamicLiveStreamBadge className="hidden md:block" />
          <div className="text-[11px] text-teal-900 font-mono font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Client HUB</span>
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300 font-bold font-mono text-[10px]">
              v{APP_CONFIG.version}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW ROUTING */}
      {!isInStudio ? (
        /* RECEPTION LOBBY & CALENDAR */
        <ReceptionLobby
          role={currentRole}
          studioName={studioName}
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
        /* CLIENT / NARUČILAC LIVE STUDIO ROOM - LIGHT TEAL DESIGN */
        activeSession && (
          <div className="flex-1 flex flex-col">
            {/* Topbar for Client */}
            <header className="bg-white/95 border-b border-teal-200/80 px-6 py-3 flex items-center justify-between shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <FluxaxNetLogo size="sm" />
                <div className="border-l border-teal-200 pl-3">
                  <div className="text-sm font-bold text-slate-900 leading-tight flex items-center">
                    <span>{activeSession.projectName}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-2 border ${
                        currentRole === "agency_tenant"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "bg-teal-100 text-teal-800 border-teal-300"
                      }`}
                    >
                      {currentRole === "agency_tenant" ? "NARUČILAC (ODOBRAVANJE)" : "KLIJENT (SLUŠANJE)"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Spiker: <strong className="text-teal-700">{activeSession.speakerName}</strong>
                    {studioName ? ` • ${studioName}` : ""}
                  </div>
                </div>
              </div>

              {/* Status Beacon */}
              <div className="flex items-center gap-3">
                {activeSession.isOnAir ? (
                  <div className="px-4 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs tracking-wider animate-pulse border border-red-400 shadow-md shadow-red-500/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>● REC ON AIR - SNIMA SE</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                    <span>Spreman za tejk</span>
                  </div>
                )}

                <button
                  onClick={handleExitStudio}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Izađi</span>
                </button>
              </div>
            </header>

            {/* DYNAMIC MULTI-CLIENT BAR IN CLIENT VIEW */}
            {activeSession.attendees && activeSession.attendees.length > 0 && (
              <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-2 overflow-x-auto scrollbar-thin">
                <div className="flex items-center gap-3 min-w-max">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pr-3 border-r border-slate-800">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Učesnici ({activeSession.attendees.length}):</span>
                  </div>

                  {activeSession.attendees.map((att) => (
                    <div
                      key={att.id}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${
                        att.isSpeaking
                          ? "bg-teal-950/80 border-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                          : "bg-slate-800/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-700 text-[9px] font-bold flex items-center justify-center text-white">
                        {att.name.charAt(0)}
                      </div>
                      <span className="font-bold text-[11px] text-slate-100">{att.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">({att.company || "Učesnik"})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Studio Body */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Screen, Scenario & Audio Trezor */}
              <div className="lg:col-span-8 space-y-6">

                {/* VIDEO SCREENING OR AUTHENTIC CLA AUDIO CONSOLE */}
                <div className="rounded-2xl overflow-hidden shadow-sm">
                  {activeSession.focusMode === "video" || activeSession.videoEnabled ? (
                    <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-white min-h-[300px] flex flex-col items-center justify-center relative">
                      <Tv className="w-12 h-12 text-purple-400 mb-2 opacity-90" />
                      <h4 className="text-sm font-bold text-white mb-1">
                        Video Screening Uživo • DaVinci / Premiere Previews
                      </h4>
                      <p className="text-xs text-slate-300 max-w-md">
                        Slika je sinhronizovana sa tonom u realnom vremenu (1080p, ultra-niska latencija).
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-600 text-purple-200 text-xs font-mono">
                        <Video className="w-3.5 h-3.5" />
                        <span>VIDEO STREAM AKTIVAN • ZERO-BLEED AUDIO</span>
                      </div>
                    </div>
                  ) : (
                    /* AUTHENTIC CLA ANALOG RACK UNIT */
                    <ClaHardwareConsole
                      key={currentRole}
                      studioName={studioName || "Studio TAF"}
                      projectName={activeSession.projectName}
                      speakerName={activeSession.speakerName}
                      isOnAir={activeSession.isOnAir}
                      isTalkbackActive={isCurrentTalkbackOn}
                      onTalkbackToggle={handleCurrentTalkbackToggle}
                      micGain={activeConsole.micGain}
                      onMicGainChange={(val) => updateActiveConsole({ micGain: val })}
                      phonesVol={activeConsole.phonesVol}
                      onPhonesVolumeChange={(val) => updateActiveConsole({ phonesVol: val })}
                      isMuted={activeConsole.isMuted}
                      onMuteToggle={(val) => updateActiveConsole({ isMuted: val })}
                      isDimmed={activeConsole.isDimmed}
                      onDimToggle={(val) => updateActiveConsole({ isDimmed: val })}
                      autoDuck={activeConsole.autoDuck}
                      onAutoDuckToggle={(val) => updateActiveConsole({ autoDuck: val })}
                      monitorMode={activeConsole.monitorMode}
                      onMonitorModeToggle={(val) => updateActiveConsole({ monitorMode: val })}
                      hdCodec={activeConsole.hdCodec}
                      onHdCodecToggle={(val) => updateActiveConsole({ hdCodec: val })}
                    />
                  )}
                </div>

                {/* Scenario & Takes with Approval Controls */}
                <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-teal-100 mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Scenario & Odabir Tejkova
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {currentRole === "agency_tenant"
                          ? "Kao naručilac posla, možete direktno odobriti ili zatražiti ponavljanje tejka"
                          : "Slušajte tejkove i dajte verbalne sugestije režiji"}
                      </p>
                    </div>

                    {/* Segment tabs */}
                    <div className="flex gap-2">
                      {activeSession.segments.map((seg, idx) => (
                        <button
                          key={seg.id}
                          onClick={() => setClientSegmentIdx(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            clientSegmentIdx === idx
                              ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {seg.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeSeg && (
                    <div className="space-y-4">
                      <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 shadow-inner">
                        <div className="text-xs font-mono text-teal-800 font-bold mb-1">{activeSeg.targetDuration}</div>
                        <p className="text-sm text-slate-800 leading-relaxed font-serif">
                          „{activeSeg.text}“
                        </p>
                      </div>

                      {/* Takes for client / agency approval */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-xs font-bold text-slate-600 mr-1">Tejkovi:</span>
                        {activeSeg.takes.map((take) => (
                          <div
                            key={take.id}
                            className={`inline-flex items-center gap-2 bg-white border rounded-xl px-3 py-1.5 text-xs shadow-sm ${
                              take.status === "final"
                                ? "border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-400"
                                : take.status === "rejected"
                                ? "border-red-300 bg-red-50/30"
                                : "border-slate-200"
                            }`}
                          >
                            <span className="font-mono text-slate-900 font-bold">{take.name}</span>

                            {/* Status label */}
                            {take.status === "final" && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                ODOBRENO (FINAL)
                              </span>
                            )}
                            {take.status === "alt" && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                REZERVA
                              </span>
                            )}
                            {take.status === "rejected" && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                PONOVITI
                              </span>
                            )}

                            {/* Naručilac explicit approval buttons */}
                            {currentRole === "agency_tenant" && (
                              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
                                <button
                                  onClick={() =>
                                    handleClientSetTakeStatus(
                                      activeSeg.id,
                                      take.id,
                                      take.status === "final" ? "none" : "final"
                                    )
                                  }
                                  title="Odobri ovaj tejk za finalnu verziju"
                                  className={`p-1 rounded cursor-pointer ${
                                    take.status === "final"
                                      ? "bg-emerald-600 text-white"
                                      : "text-slate-400 hover:text-emerald-600"
                                  }`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleClientSetTakeStatus(
                                      activeSeg.id,
                                      take.id,
                                      take.status === "rejected" ? "none" : "rejected"
                                    )
                                  }
                                  title="Zatraži da spiker ponovi tejk"
                                  className={`p-1 rounded cursor-pointer ${
                                    take.status === "rejected"
                                      ? "bg-red-600 text-white"
                                      : "text-slate-400 hover:text-red-600"
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Share / Audio Trezor in Client View */}
                {activeSession.projectFiles && activeSession.projectFiles.length > 0 && (
                  <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-teal-100 mb-4">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Audio Trezor • Direktno Preuzimanje Master Fajlova
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        WAV 48kHz / MP3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSession.projectFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
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
                            title="Preuzmi Master fajl"
                            className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0 ml-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Preuzmi</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Live Chat with Režija */}
              <div className="lg:col-span-4 bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-teal-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    <span>Režijski Chat & Sugestije</span>
                  </div>
                  <span className="text-[10px] text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    LIVE
                  </span>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs ${
                        msg.isDirector
                          ? "bg-amber-50 border border-amber-200 text-amber-900"
                          : "bg-teal-50/50 border border-teal-100 text-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[10px]">
                        <strong className={msg.isDirector ? "text-amber-800 font-bold" : "text-teal-800 font-bold"}>
                          {msg.sender}
                        </strong>
                        <span className="font-mono text-slate-400">{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Chat input form */}
                <form onSubmit={handleSendChat} className="pt-3 border-t border-teal-100 flex gap-2">
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="Upišite sugestiju ili napomenu..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm shadow-teal-600/20"
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
