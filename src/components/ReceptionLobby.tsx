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
  const [newProjectName, setNewProjectName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // =========================================================================
  // CLIENT / GUEST WAITING ROOM ("PRED VRATIMA") - LIGHT TEAL STUDIO DESIGN
  // =========================================================================
  if (role !== "studio_director") {
    const isDoorOpen = activeSession?.isDoorOpen;

    return (
      <div className="min-h-screen studio-light-bg text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Soft Ambient Studio Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-white/95 border border-teal-200/80 rounded-3xl p-8 shadow-xl shadow-teal-950/5 backdrop-blur-md relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <FluxaxNetLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            {studioName ? `${studioName} • ` : ""}Čekaonica
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
                Tonac u režiji je pripremio opremu i čeka vas u studiju.
              </p>
              <button
                onClick={() => activeSession && onEnterStudio(activeSession.id)}
                className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>UĐI U STUDIO</span>
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
                Termin je Zakazan za {activeSession?.time || "danas"}
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Režija priprema sesiju i mikrofone. Čim tonac otvori vrata, automatski ulazite.
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
  // DIRECTOR (TONAC) LOBBY & CALENDAR - LIGHT TEAL STUDIO DESIGN
  // =========================================================================
  return (
    <div className="min-h-screen studio-light-bg text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Top Reception Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-teal-200/80 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FluxaxNetLogo size="md" />
              <span className="px-3 py-0.5 rounded-full bg-teal-100/80 text-teal-900 border border-teal-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                Raspored termina
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Upravljanje terminima snimanja i otvaranje vrata studija za klijente
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white border border-teal-200 font-mono text-sm font-bold text-teal-800 shadow-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span suppressHydrationWarning>
                {format24Time(currentTime)}
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
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
                className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-white border-teal-400 shadow-lg shadow-teal-950/10 ring-2 ring-teal-400/20"
                    : "bg-white/80 border-teal-200/70 hover:border-teal-300 shadow-sm hover:shadow"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-mono text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {sess.time}
                    </span>

                    {sess.isDoorOpen ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <DoorOpen className="w-3 h-3 text-emerald-600" />
                        VRATA OTVORENA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-1">
                        <DoorClosed className="w-3 h-3 text-slate-500" />
                        PRED VRATIMA
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">{sess.projectName}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-5">
                    <div>
                      Naručilac: <span className="text-slate-900 font-bold">{sess.clientName}</span>
                    </div>
                    <div>
                      Spiker: <span className="text-teal-700 font-bold">{sess.speakerName}</span>
                    </div>
                    <div>
                      Segmenata: <span className="text-slate-700 font-mono">{sess.segments.length} cjelina</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-teal-100 flex items-center gap-2">
                  <button
                    onClick={() => onEnterStudio(sess.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ULAZ U REŽIJU</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(sess.id)}
                    title="Kopiraj link za klijenta"
                    className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs transition-all cursor-pointer shadow-sm"
                  >
                    {copiedId === sess.id ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
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
                Unesite podatke projekta za generisanje termina i klijentskog linka
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Naziv Projekta / Kampanje:</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="npr. Pepsi Max - Džingl 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Naručilac / Agencija:</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="npr. Studio Ritem / McCann"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Spiker / Glas:</label>
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
      </div>
    </div>
  );
}
