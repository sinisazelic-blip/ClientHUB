"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Play,
  DoorOpen,
  DoorClosed,
  CheckCircle,
  Copy,
  Radio,
  ArrowRight,
  ShieldCheck,
  Video,
  KeyRound,
  ExternalLink,
  Sliders,
  Sparkles,
} from "lucide-react";
import FluxaxNetLogo from "@/components/FluxaxNetLogo";
import { SessionItem } from "@/app/api/studio/status/route";
import { format24Time } from "@/lib/formatTime";

interface ReceptionLobbyProps {
  role: "studio_director" | "agency_tenant" | "guest_participant";
  studioName?: string;
  sessions: SessionItem[];
  activeSession: SessionItem | null;
  onEnterStudio: (sessionId: string) => void;
  onRefreshSessions: () => void;
}

export default function ReceptionLobby({
  role,
  studioName,
  sessions,
  activeSession,
  onEnterStudio,
  onRefreshSessions,
}: ReceptionLobbyProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor StudioBridge WebSocket link
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const host = typeof window !== "undefined" ? window.location.hostname || "127.0.0.1" : "127.0.0.1";
      ws = new WebSocket(`ws://${host}:4040/ws`);
      ws.onopen = () => setIsBridgeOnline(true);
      ws.onclose = () => setIsBridgeOnline(false);
      ws.onerror = () => setIsBridgeOnline(false);
    } catch (_) {
      setIsBridgeOnline(false);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleCopyLink = (sessId: string, roleParam: string = "agency_tenant") => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/?session=${sessId}&role=${roleParam}`;
      navigator.clipboard.writeText(url);
      setCopiedId(sessId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleToggleDoor = async (sessId: string, currentIsOpen: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: sessId }),
      });
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_DOOR", isOpen: !currentIsOpen }),
      });
      onRefreshSessions();
    } catch (_) {}
  };

  const handleCreateSession = async () => {
    if (!newProjectName.trim()) return;
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SESSION",
          projectName: newProjectName,
          clientName: newClientName || "Agencija",
          speakerName: newSpeakerName || "Spiker",
          time: newTime,
        }),
      });
      setShowAddModal(false);
      setNewProjectName("");
      setNewClientName("");
      setNewSpeakerName("");
      onRefreshSessions();
    } catch (_) {}
  };

  const handleInstantNewSession = async () => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" });
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SESSION",
          projectName: `Sesija Uživo • ${timeStr}`,
          clientName: "Naručilac",
          speakerName: "Spiker",
          time: timeStr,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        await fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: data.session.id }),
        });
        await fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "TOGGLE_DOOR", isOpen: true }),
        });
        onRefreshSessions();
        onEnterStudio(data.session.id);
      }
    } catch (_) {}
  };

  const handleJoinByCode = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    const match = sessions.find((s) => s.id.toLowerCase().includes(trimmed.toLowerCase()) || s.projectName.toLowerCase().includes(trimmed.toLowerCase()));
    if (match) {
      setShowJoinModal(false);
      onEnterStudio(match.id);
    } else if (sessions.length > 0) {
      setShowJoinModal(false);
      onEnterStudio(sessions[0].id);
    }
  };

  // Date formatting for top clock
  const dayName = currentTime.toLocaleDateString("sr-RS", { weekday: "long" });
  const dateFormatted = currentTime.toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  // =========================================================================
  // CLIENT / GUEST WAITING ROOM ("PRED VRATIMA") - LIGHT TEAL STUDIO DESIGN
  // =========================================================================
  if (role !== "studio_director") {
    const isDoorOpen = activeSession?.isDoorOpen;

    return (
      <div className="min-h-screen studio-light-bg text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Soft Ambient Studio Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-white/95 border border-teal-200/80 rounded-3xl p-8 shadow-xl shadow-teal-950/5 backdrop-blur-md relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <FluxaxNetLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            {studioName ? `${studioName} • ` : ""}Čekaonica Studija
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {activeSession?.projectName || "Termin Snimanja"}
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Naručilac: <span className="text-slate-900 font-bold">{activeSession?.clientName}</span> • Spiker:{" "}
            <span className="text-teal-700 font-bold">{activeSession?.speakerName}</span>
          </p>

          {isDoorOpen ? (
            /* DOORS OPEN */
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <DoorOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Vrata Studija su Otvorena!</h3>
              <p className="text-xs text-emerald-800 mb-4">
                Režija je pripremila opremu i mikrofone. Spremni smo za početak rada.
              </p>
              <button
                onClick={() => activeSession && onEnterStudio(activeSession.id)}
                className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>UĐI U REŽIJU I STUDIO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* DOORS CLOSED (WAITING ROOM) */
            <div className="bg-teal-50/50 border border-teal-200/80 rounded-2xl p-6 mb-6 shadow-inner">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <DoorClosed className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-amber-900 mb-1">
                Termin zakazan za {activeSession?.time || "danas"}
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Režija postavlja scenario i nivoe signala. Čim tonac otvori vrata, automatski ulazite u studio.
              </p>

              {/* Digital Studio Clock */}
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-teal-200 font-mono text-xl font-bold text-teal-800 shadow-sm">
                <Clock className="w-5 h-5 text-teal-600" />
                <span suppressHydrationWarning>
                  {format24Time(currentTime)}
                </span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2 border-t border-teal-100">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>FluxaX Audio Protocol • Zaštićena studijska veza ultra-niske latencije</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DIRECTOR / TONAC: ZOOM-STYLE HOME DASHBOARD & AGENDA
  // =========================================================================
  return (
    <div className="min-h-screen studio-light-bg text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 1. TOP HEADER & REAL-TIME DIGITAL STUDIO CLOCK */}
        <div className="bg-white/90 border border-teal-200/80 rounded-3xl p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FluxaxNetLogo size="md" />
              <span className="px-3 py-0.5 rounded-full bg-teal-100/90 text-teal-900 border border-teal-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                Control Hub
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              {studioName || "Studio TAF • Režijski Centar"}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Broadcast audio & video screening platforma za snimanja na daljinu
            </p>
          </div>

          {/* Large Digital Clock & Date */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-lg shadow-teal-950/20 border border-teal-800/40 flex items-center gap-5 min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-mono text-3xl font-black tracking-tight text-white" suppressHydrationWarning>
                {currentTime.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-xs font-medium text-teal-200 mt-0.5" suppressHydrationWarning>
                {capitalizedDay}, {dateFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* 2. ZOOM-STYLE QUICK ACTION BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Nova Sesija / Start Instant */}
          <button
            onClick={handleInstantNewSession}
            className="group bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-2xl p-5 shadow-md shadow-teal-700/20 transition-all cursor-pointer flex flex-col justify-between text-left border border-teal-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-teal-50">
                Instant
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-0.5">Nova Sesija</h3>
              <p className="text-xs text-teal-100">Pokreni odmah snimanje u režiji</p>
            </div>
          </button>

          {/* Action 2: Pristupi / Join Session */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="group bg-white hover:bg-slate-50 text-slate-800 rounded-2xl p-5 shadow-sm hover:shadow border border-teal-200/80 transition-all cursor-pointer flex flex-col justify-between text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800">
                Kod / Link
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-0.5">Pristupi Sesiji</h3>
              <p className="text-xs text-slate-500">Unesi ID ili link sesije</p>
            </div>
          </button>

          {/* Action 3: Zakaži / Schedule */}
          <button
            onClick={() => setShowAddModal(true)}
            className="group bg-white hover:bg-slate-50 text-slate-800 rounded-2xl p-5 shadow-sm hover:shadow border border-teal-200/80 transition-all cursor-pointer flex flex-col justify-between text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                Planer
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-0.5">Zakaži Termin</h3>
              <p className="text-xs text-slate-500">Kreiraj termin za agenciju i spikera</p>
            </div>
          </button>

          {/* Action 4: StudioBridge Link Status */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between text-left transition-all ${
              isBridgeOnline
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isBridgeOnline ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-slate-200 text-slate-500"
                }`}
              >
                <Sliders className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                  isBridgeOnline
                    ? "bg-emerald-200/80 border-emerald-400 text-emerald-900"
                    : "bg-slate-200 border-slate-300 text-slate-600"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBridgeOnline ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`} />
                {isBridgeOnline ? "POVEZANO" : "OFFLINE"}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-0.5">StudioBridge Hardver</h3>
              <p className="text-xs text-slate-600">
                {isBridgeOnline ? "Lokalni drajveri i RME matrica aktivni (:4040)" : "Pokrenite StudioBridge aplikaciju"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. AGENDA "DANAS" • POPIS SESIJA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Danas • Raspored & Režija</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold font-mono">
                {sessions.length} {sessions.length === 1 ? "termin" : "termina"}
              </span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj još jedan termin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((sess) => {
              const isActive = sess.id === activeSession?.id;

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    isActive
                      ? "bg-white border-teal-400 shadow-lg shadow-teal-950/10 ring-2 ring-teal-400/20"
                      : "bg-white/85 border-teal-200/80 hover:border-teal-300 shadow-sm hover:shadow"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-mono text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {sess.time}
                      </span>

                      {/* Door Button / Badge in Card Header */}
                      <button
                        onClick={(e) => handleToggleDoor(sess.id, sess.isDoorOpen, e)}
                        title="Kliknite da otvorite ili zatvorite vrata studija za klijenta"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                          sess.isDoorOpen
                            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800"
                        }`}
                      >
                        {sess.isDoorOpen ? (
                          <>
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>VRATA OTVORENA</span>
                          </>
                        ) : (
                          <>
                            <DoorClosed className="w-3.5 h-3.5 text-amber-600" />
                            <span>PRED VRATIMA</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">{sess.projectName}</h3>

                    <div className="space-y-1.5 text-xs text-slate-600 mb-5">
                      <div>
                        Naručilac: <strong className="text-slate-900">{sess.clientName}</strong>
                      </div>
                      <div>
                        Spiker: <strong className="text-teal-700">{sess.speakerName}</strong>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {sess.segments.length} segmenta
                        </span>
                        {sess.projectFiles && sess.projectFiles.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-bold">
                            {sess.projectFiles.length} fajlova
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-teal-100 flex items-center gap-2">
                    <button
                      onClick={() => onEnterStudio(sess.id)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>OTVORI REŽIJU</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(sess.id, "agency_tenant")}
                      title="Kopiraj link za naručioca / agenciju"
                      className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs transition-all cursor-pointer shadow-sm"
                    >
                      {copiedId === sess.id ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Zakaži Novi Termin */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-teal-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Zakaži Novi Termin Snimanja</span>
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Unesite podatke projekta za generisanje termina i linka za klijenta
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Naziv Projekta / Kampanje:</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="npr. Coca-Cola Ljeto 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Naručilac / Agencija:</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="npr. Saatchi & Saatchi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Spiker / Narator:</label>
                    <input
                      type="text"
                      value={newSpeakerName}
                      onChange={(e) => setNewSpeakerName(e.target.value)}
                      placeholder="npr. Goran"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Vrijeme početka:</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  onClick={handleCreateSession}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-teal-600/20"
                >
                  Sačuvaj Termin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Pristupi Sesiji (Join Modal) */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-teal-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-600" />
                <span>Pristupi Sesiji po Kodu</span>
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Unesite ID sesije, naziv projekta ili dio linka koji vam je poslao tonac
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kod ili Naziv Sesije:</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="npr. taf-coca-cola-2026 ili Coca-Cola"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  onClick={handleJoinByCode}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-teal-600/20"
                >
                  Pristupi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
