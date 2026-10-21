"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Users,
  DoorOpen,
  DoorClosed,
  CheckCircle,
  Copy,
  Radio,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import FluxaxNetLogo from "@/components/FluxaxNetLogo";
import { SessionItem } from "@/app/api/studio/status/route";

interface ReceptionLobbyProps {
  role: "studio_director" | "agency_tenant" | "guest_participant";
  sessions: SessionItem[];
  activeSession: SessionItem | null;
  onEnterStudio: (sessionId: string) => void;
  onRefreshSessions: () => void;
}

export default function ReceptionLobby({
  role,
  sessions,
  activeSession,
  onEnterStudio,
  onRefreshSessions,
}: ReceptionLobbyProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live clock for countdown
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = (sessId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/?session=${sessId}&role=agency_tenant`;
      navigator.clipboard.writeText(url);
      setCopiedId(sessId);
      setTimeout(() => setCopiedId(null), 2500);
    }
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

  // If Client / Guest is viewing and doors are closed -> Waiting Room
  if (role !== "studio_director") {
    const isDoorOpen = activeSession?.isDoorOpen;

    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Studio Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-stone-900/80 border border-stone-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <FluxaxNetLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Studio TAF • Čekaonica za Klijente
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {activeSession?.projectName || "Termin Snimanja"}
          </h1>
          <p className="text-sm text-stone-400 mb-6">
            Naručilac: <span className="text-stone-200 font-semibold">{activeSession?.clientName}</span> • Spiker:{" "}
            <span className="text-cyan-400 font-semibold">{activeSession?.speakerName}</span>
          </p>

          {isDoorOpen ? (
            /* DOORS ARE OPEN */
            <div className="bg-emerald-950/50 border border-emerald-600/60 rounded-2xl p-6 mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <DoorOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-400 mb-1">Vrata Studija su Otvorena!</h3>
              <p className="text-xs text-stone-300 mb-4">
                Tonac u režiji je pripremio opremu i čeka vas u studiju.
              </p>
              <button
                onClick={() => activeSession && onEnterStudio(activeSession.id)}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>UĐI U STUDIO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* DOORS ARE CLOSED (Waiting Room) */
            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-6 mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <DoorClosed className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-amber-400 mb-1">Termin je Zakazan za {activeSession?.time || "danas"}</h3>
              <p className="text-xs text-stone-400 mb-4">
                Režija priprema sesiju i mikrofone. Čim tonac otvori studio, automatski ulazite.
              </p>

              {/* Digital Studio Clock */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 font-mono text-xl font-bold text-cyan-400">
                <Clock className="w-5 h-5 text-stone-500" />
                <span suppressHydrationWarning>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
            <span>FluxaX Audio Protocol • Zaštićena studijska veza ultra-niske latencije</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DIRECTOR (TONAC) LOBBY & CALENDAR VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Top Reception Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FluxaxNetLogo size="md" />
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-bold uppercase tracking-wider">
                Recepcija & Raspored Studija
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Upravljanje terminima snimanja i otvaranje vrata studija za klijente
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 font-mono text-sm font-bold text-cyan-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <span suppressHydrationWarning>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novi Termin</span>
            </button>
          </div>
        </div>

        {/* Sessions Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSession?.id;

            return (
              <div
                key={sess.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-gradient-to-b from-stone-900 to-stone-900/90 border-cyan-500/50 shadow-xl shadow-cyan-950/30"
                    : "bg-stone-900/60 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-stone-800/80 text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {sess.time}
                    </span>

                    {sess.isDoorOpen ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        VRATA OTVORENA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 text-[10px] font-semibold flex items-center gap-1">
                        <DoorClosed className="w-3 h-3" />
                        PRED VRATIMA
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 leading-snug">{sess.projectName}</h3>

                  <div className="space-y-1 text-xs text-stone-400 mb-4">
                    <div>
                      Naručilac: <span className="text-stone-200 font-medium">{sess.clientName}</span>
                    </div>
                    <div>
                      Spiker: <span className="text-cyan-400 font-medium">{sess.speakerName}</span>
                    </div>
                    <div>
                      Segmenata: <span className="text-stone-300 font-mono">{sess.segments.length} cjelina</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onEnterStudio(sess.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ULAZ U REŽIJU</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(sess.id)}
                    title="Kopiraj link za klijenta"
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs transition-all cursor-pointer"
                  >
                    {copiedId === sess.id ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Zakaži Novi Termin */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>Zakaži Novi Termin Snimanja</span>
              </h3>
              <p className="text-xs text-stone-400 mb-5">
                Unesite podatke projekta za generisanje termina i klijentskog linka
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Naziv Projekta / Kampanje:</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="npr. Pepsi Max - Džingl 2026"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Naručilac / Agencija:</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="npr. Studio Ritem / McCann"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Spiker / Glas:</label>
                    <input
                      type="text"
                      value={newSpeakerName}
                      onChange={(e) => setNewSpeakerName(e.target.value)}
                      placeholder="npr. Goran"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">Vrijeme početka:</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-800">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  onClick={handleCreateSession}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold cursor-pointer"
                >
                  Sačuvaj Termin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
