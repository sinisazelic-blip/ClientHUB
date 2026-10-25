"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
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
  ChevronLeft,
  ChevronRight,
  Sliders,
  Users,
  Mic,
  CalendarDays,
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
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Selected date state (defaults to today)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

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
          date: newDate,
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

  const openAddModalForHour = (hour: number) => {
    const formattedHour = `${hour.toString().padStart(2, "0")}:00`;
    setNewTime(formattedHour);
    const mStr = (selectedMonth + 1).toString().padStart(2, "0");
    const dStr = selectedDay.toString().padStart(2, "0");
    setNewDate(`${selectedYear}-${mStr}-${dStr}`);
    setShowAddModal(true);
  };

  // Date formatting helpers
  const dayName = currentTime.toLocaleDateString("sr-RS", { weekday: "long" });
  const dateFormatted = currentTime.toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  // Selected date object
  const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDay);
  const selectedDateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
  const selectedDateFormatted = selectedDateObj.toLocaleDateString("sr-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalizedSelectedDate = selectedDateFormatted.charAt(0).toUpperCase() + selectedDateFormatted.slice(1);

  // Month navigation
  const monthNames = [
    "Januar", "Februar", "Mart", "April", "Maj", "Juni",
    "Juli", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Days in selected month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Sessions map for selected day by hour (0 to 23)
  const getSessionForHour = (hour: number) => {
    return sessions.find((s) => {
      // Check date match if session date matches or is today
      const sDate = s.date || new Date().toISOString().split("T")[0];
      const isDateMatch = sDate === selectedDateStr;
      if (!isDateMatch) return false;

      // Check hour match
      if (!s.time) return false;
      const hourPart = parseInt(s.time.split(":")[0], 10);
      return hourPart === hour;
    });
  };

  // Count sessions per day for the month badges
  const getSessionCountForDay = (dayNum: number) => {
    const dStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
    return sessions.filter((s) => (s.date || new Date().toISOString().split("T")[0]) === dStr).length;
  };

  // =========================================================================
  // CLIENT / GUEST WAITING ROOM ("PRED VRATIMA")
  // =========================================================================
  if (role !== "studio_director") {
    const isDoorOpen = activeSession?.isDoorOpen;

    return (
      <div className="min-h-screen studio-light-bg text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-white/95 border border-teal-200/80 rounded-3xl p-8 shadow-xl shadow-teal-950/5 backdrop-blur-md relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/branding/CH logo.png"
              alt="Client HUB"
              className="h-12 w-auto object-contain"
            />
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
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <DoorOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Vrata Studija su Otvorena!</h3>
              <p className="text-xs text-emerald-800 mb-4">
                Režija je pripremila opremu i mikrofone. Možete ući u sesiju.
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
            <div className="bg-teal-50/50 border border-teal-200/80 rounded-2xl p-6 mb-6 shadow-inner space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <DoorClosed className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-amber-900 mb-1">
                Termin zakazan za {activeSession?.time || "danas"}
              </h3>
              <p className="text-xs text-slate-600 mb-2">
                Režija postavlja scenario i nivoe signala. Čim tonac otvori vrata, ulazite u studio.
              </p>

              {/* Animated ClientHUB Video Preview */}
              <div className="rounded-xl overflow-hidden border border-teal-200 shadow-sm max-w-sm mx-auto bg-black">
                <video
                  src="/branding/ClientHUB animation.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-teal-200 font-mono text-xl font-bold text-teal-800 shadow-sm">
                <Clock className="w-5 h-5 text-teal-600" />
                <span suppressHydrationWarning>{format24Time(currentTime)}</span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2 border-t border-teal-100">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Client HUB Audio Protocol • Studijska veza ultra-niske latencije</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DIRECTOR / TONAC: DEFAULT CALENDAR & 24-HOUR DAY SCHEDULE
  // =========================================================================
  return (
    <div className="min-h-screen studio-light-bg text-slate-800 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. TOP HEADER & ELEGANT STUDIO-LIGHT DIGITAL CLOCK */}
        <div className="bg-white/95 border border-teal-200/80 rounded-3xl p-6 shadow-sm backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full bg-teal-100/90 text-teal-900 border border-teal-300 text-[11px] font-bold uppercase tracking-wider shadow-xs">
                Raspored Studija
              </span>
              <div
                title="Veza sa lokalnim StudioBridge hardverom"
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isBridgeOnline ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBridgeOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span>{isBridgeOnline ? "StudioBridge Online" : "StudioBridge Offline"}</span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              {studioName || "Studio TAF • Režijski Kalendar"}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Odaberite dan u kalendaru i kliknite na rezervisani termin za ulazak u režiju
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Studio-Light Integrated Clock */}
            <div className="bg-white border border-teal-300/80 text-slate-900 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-inner">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="font-mono text-2xl font-black tracking-tight text-slate-900" suppressHydrationWarning>
                  {currentTime.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-xs font-semibold text-teal-800" suppressHydrationWarning>
                  {capitalizedDay}, {dateFormatted}
                </div>
              </div>
            </div>

            {/* Single Unified "Novi Termin" Button */}
            <button
              onClick={() => {
                setNewDate(selectedDateStr);
                setShowAddModal(true);
              }}
              className="py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novi Termin</span>
            </button>
          </div>
        </div>

        {/* 2. MAIN WORKSPACE: CALENDAR (LEFT) + 24-HOUR DAY SCHEDULE (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: MONTH CALENDAR GRID */}
          <div className="lg:col-span-5 bg-white/95 border border-teal-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {monthNames[selectedMonth]} {selectedYear}.
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Prethodni mjesec"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setSelectedYear(now.getFullYear());
                    setSelectedMonth(now.getMonth());
                    setSelectedDay(now.getDate());
                  }}
                  className="px-2.5 py-1 rounded-lg border border-teal-200 text-teal-800 hover:bg-teal-50 text-[11px] font-bold"
                >
                  Danas
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Sljedeći mjesec"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
              <span>Pon</span>
              <span>Uto</span>
              <span>Sri</span>
              <span>Čet</span>
              <span>Pet</span>
              <span className="text-amber-700">Sub</span>
              <span className="text-amber-700">Ned</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-11 rounded-xl bg-slate-50/50" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                const isSelected =
                  dayNum === selectedDay &&
                  selectedMonth === selectedDateObj.getMonth() &&
                  selectedYear === selectedDateObj.getFullYear();

                const isToday =
                  dayNum === currentTime.getDate() &&
                  selectedMonth === currentTime.getMonth() &&
                  selectedYear === currentTime.getFullYear();

                const sessionCount = getSessionCountForDay(dayNum);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-400/30"
                        : isToday
                        ? "bg-amber-50 border-amber-300 text-amber-900 font-bold hover:bg-amber-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold">{dayNum}</span>
                    {sessionCount > 0 ? (
                      <span
                        className={`text-[9px] font-bold px-1 rounded-full ${
                          isSelected ? "bg-white text-teal-800" : "bg-teal-100 text-teal-900 border border-teal-300"
                        }`}
                      >
                        {sessionCount} {sessionCount === 1 ? "termin" : "termina"}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full opacity-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend / Summary */}
            <div className="pt-3 border-t border-teal-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Rezervisan termin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Današnji datum</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 24-HOUR DAY SCHEDULE MATRIX (00:00 - 23:00) */}
          <div className="lg:col-span-7 bg-white/95 border border-teal-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-4">
              <div>
                <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span>Dnevni Raspored (24 Sata)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {capitalizedSelectedDate}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddModalForHour(12)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zakaži u ovaj dan</span>
                </button>
              </div>
            </div>

            {/* 24-HOUR BOX MATRIX (24 KOCKICE ZA SVAKI SAT 00h - 23h) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {Array.from({ length: 24 }, (_, hour) => {
                const sessionForSlot = getSessionForHour(hour);
                const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;
                const nextHourFormatted = `${((hour + 1) % 24).toString().padStart(2, "0")}:00`;

                if (sessionForSlot) {
                  // BOOKED / RESERVED SLOT - HIGHLIGHTED IN COLOR
                  const isActive = sessionForSlot.id === activeSession?.id;

                  return (
                    <div
                      key={hour}
                      onClick={() => onEnterStudio(sessionForSlot.id)}
                      title="Kliknite za ulazak u režiju ovog termina"
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md ${
                        isActive
                          ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-400 ring-2 ring-teal-400/30"
                          : "bg-teal-50/70 border-teal-300 hover:border-teal-500 hover:bg-teal-100/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-teal-950 bg-white px-2 py-0.5 rounded-lg border border-teal-300 shadow-2xs">
                            {hourFormatted} - {nextHourFormatted}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-700 text-white shadow-2xs">
                            ● ZAUZETO
                          </span>
                        </div>

                        {sessionForSlot.isDoorOpen ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <DoorOpen className="w-3 h-3 text-emerald-600" />
                            <span>Vrata otvorena</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                            <DoorClosed className="w-3 h-3 text-amber-600" />
                            <span>Pred vratima</span>
                          </span>
                        )}
                      </div>

                      <div className="my-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-900">
                          {sessionForSlot.projectName}
                        </h4>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap gap-x-2">
                          <span>Naručilac: <strong className="text-slate-900">{sessionForSlot.clientName}</strong></span>
                          <span>•</span>
                          <span>Spiker: <strong className="text-teal-700">{sessionForSlot.speakerName}</strong></span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between mt-1">
                        <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <Play className="w-3 h-3 fill-current" />
                          <span>Klikni za ulazak u režiju</span>
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(sessionForSlot.id, "agency_tenant");
                          }}
                          title="Kopiraj link za klijenta"
                          className="p-1 rounded-md bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 text-xs transition-colors"
                        >
                          {copiedId === sessionForSlot.id ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }

                // EMPTY / AVAILABLE HOUR SLOT
                return (
                  <div
                    key={hour}
                    onClick={() => openAddModalForHour(hour)}
                    className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-teal-50/40 hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between text-slate-500 hover:text-teal-900 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-600 group-hover:text-teal-900">
                        {hourFormatted}
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-teal-700 font-medium">
                        Slobodan termin
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 group-hover:border-teal-400 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all text-slate-400 shadow-2xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NOVI TERMIN (ZAKAŽI SESIJU) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-teal-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              <span>Zakaži Novi Termin</span>
            </h3>
            <p className="text-xs text-slate-500">
              Unesite podatke projekta i termina za režiju, naručioca i spikera.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Naziv Projekta / Kampanje</label>
                <input
                  type="text"
                  placeholder="npr. Vitaminka Banja Luka (TV Spot)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Naručilac (Agencija / Klijent)</label>
                <input
                  type="text"
                  placeholder="npr. Saatchi & Saatchi"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ime Spikera / Glumca</label>
                <input
                  type="text"
                  placeholder="npr. Goran (Glavni glas)"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vrijeme (Sat:Minuta)</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Odustani
              </button>
              <button
                onClick={handleCreateSession}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Kreiraj Termin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
