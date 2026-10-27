"use client";

import React, { useState, useEffect, useRef } from "react";
import FluxaxNetLogo, { FluxaxDynamicLiveStreamBadge } from "@/components/FluxaxNetLogo";
import ReceptionLobby from "@/components/ReceptionLobby";
import StudioDirectorConsole from "@/components/StudioDirectorConsole";
import { ClaHardwareConsole } from "@/components/ClaHardwareConsole";
import PublicLandingPage from "@/components/PublicLandingPage";
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
  Globe,
  Key,
  X,
  Lock,
  UploadCloud,
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

const INITIAL_SESSIONS: SessionItem[] = [
  {
    id: "taf-coca-cola-2026",
    projectName: "Coca-Cola (Ljetna kampanja 2026)",
    clientName: "Saatchi & Saatchi / Media Focus",
    speakerName: "Goran (Glavni glas)",
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    isDoorOpen: true,
    isOnAir: false,
    videoEnabled: false,
    focusMode: "audio",
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-coca-cola-final",
    billing: {
      status: "active",
      startedAt: Date.now() - 25 * 60 * 1000,
      totalElapsedSeconds: 1500,
      hourlyRateEur: 75,
    },
    attendees: [
      { id: "att-dir", name: "Režija (Siniša)", role: "studio_director", company: "Studio TAF", isMuted: false, isSpeaking: false },
      { id: "att-spk", name: "Goran (Spiker)", role: "speaker", company: "Glumačka soba", isMuted: false, isSpeaking: true },
      { id: "att-naru", name: "Saatchi & Saatchi", role: "agency_tenant", company: "Naručilac", isMuted: false, isSpeaking: false },
    ],
    projectFiles: [],
    segments: [
      {
        id: "seg-1",
        title: "Intro (Početak spot 1)",
        text: "Zaboravite sve što ste mislili o kompromisima. Nova sezona donosi više stila i neponovljivu energiju u svakom gutljaju.",
        targetDuration: "00:00 - 00:10",
        takes: [
          { id: 1, name: "Tejk 1 (Toplo)", status: "alt" },
          { id: 2, name: "Tejk 2 (Dinamično)", status: "final" },
        ],
      },
    ],
  },
  {
    id: "taf-intesa-radio",
    projectName: "Banka Intesa (Radio Džingl 2x30s)",
    clientName: "McCann Beograd",
    speakerName: "Jelena (Ženski vokal)",
    date: new Date().toISOString().split("T")[0],
    time: "18:00",
    isDoorOpen: false,
    isOnAir: false,
    videoEnabled: false,
    focusMode: "audio",
    recStartTime: null,
    fluxaDownloadUrl: "https://drive.google.com/drive/folders/fluxa-taf-intesa",
    billing: {
      status: "idle",
      startedAt: null,
      totalElapsedSeconds: 0,
      hourlyRateEur: 75,
    },
    attendees: [
      { id: "att-dir2", name: "Režija", role: "studio_director", company: "Studio TAF", isMuted: false, isSpeaking: false },
      { id: "att-spk2", name: "Jelena (Spiker)", role: "speaker", company: "Glumačka soba", isMuted: false, isSpeaking: false },
    ],
    projectFiles: [],
    segments: [],
  },
];

export default function ClientHubPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("guest_participant");
  const [isInStudio, setIsInStudio] = useState<boolean>(false);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isDirectorAuth, setIsDirectorAuth] = useState<boolean>(false);
  const [directorPinModalOpen, setDirectorPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Sessions and Active Session state
  const [sessions, setSessions] = useState<SessionItem[]>(INITIAL_SESSIONS);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(INITIAL_SESSIONS[0]);
  const [studioName, setStudioName] = useState<string>("Studio TAF");

  // Separate Talkback / Mic states by role (Naručilac vs Klijent gost vs Režija)
  const [directorTalkbackOn, setDirectorTalkbackOn] = useState<boolean>(false);
  const [agencyTalkbackOn, setAgencyTalkbackOn] = useState<boolean>(false);
  const [guestTalkbackOn, setGuestTalkbackOn] = useState<boolean>(false);

  // Console & Audio Control states by role
  const [agencyConsole, setAgencyConsole] = useState({
    micGain: 0,
    phonesVol: 80,
    isMuted: false,
    isDimmed: false,
    autoDuck: true,
    monitorMode: "stereo" as "stereo" | "mono",
    hdCodec: true,
  });

  const clientFileInputRef = useRef<HTMLInputElement | null>(null);
  const [clientExchangeFolder, setClientExchangeFolder] = useState<string>("C:\\Users\\Klijent\\Downloads\\FluxaX");
  const [isClientUploading, setIsClientUploading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fluxax_client_folder");
      if (saved) setClientExchangeFolder(saved);
    }
  }, []);

  const handlePickClientFolder = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const folderName = "C:\\Downloads\\" + dirHandle.name;
          setClientExchangeFolder(folderName);
          localStorage.setItem("fluxax_client_folder", folderName);
          return;
        }
      }
    } catch (_) {}
    const manual = window.prompt("Unesite ili potvrdite lokalni folder za razmjenu materijala:", clientExchangeFolder);
    if (manual && manual.trim()) {
      setClientExchangeFolder(manual.trim());
      localStorage.setItem("fluxax_client_folder", manual.trim());
    }
  };

  const handleClientUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsClientUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("uploadedBy", "Naručilac (Agencija)");
      formData.append("sessionId", activeSession?.id || "taf-coca-cola-2026");

      const res = await fetch("/api/studio/upload-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (err) {
      console.error("Client upload error", err);
    } finally {
      setIsClientUploading(false);
      if (clientFileInputRef.current) clientFileInputRef.current.value = "";
    }
  };

  const [guestConsole, setGuestConsole] = useState({
    micGain: 0,
    phonesVol: 80,
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
          if (typeof data.roleTalkbacks.studio_director === "boolean") {
            setDirectorTalkbackOn(data.roleTalkbacks.studio_director);
          }
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
      const sessionParam = params.get("session") || params.get("s");
      const pinParam = params.get("pin") || params.get("token");

      const storedAuth = localStorage.getItem("fluxax_director_auth") === "true";

      const processDirectorAuth = () => {
        setIsDirectorAuth(true);
        localStorage.setItem("fluxax_director_auth", "true");
        if (params.get("view") === "calendar" || params.get("view") === "director" || params.get("role") === "studio_director") {
          setShowLandingPage(false);
          setCurrentRole("studio_director");
          if (params.get("view") === "studio") {
            setIsInStudio(true);
          }
        }
      };

      if (storedAuth) {
        processDirectorAuth();
      }

      if (pinParam) {
        fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "VERIFY_DIRECTOR_PIN", pin: pinParam }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.valid) {
              processDirectorAuth();
            }
          })
          .catch(() => {});
      }

      if (sessionParam) {
        setShowLandingPage(false);
        setIsInStudio(true);
        const roleParam = (params.get("role") as UserRole) || "guest_participant";
        if (roleParam === "studio_director" && !storedAuth && !pinParam) {
          setCurrentRole("guest_participant");
        } else {
          setCurrentRole(roleParam);
        }
        fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: sessionParam }),
        }).then(fetchStatus);
      } else if (!storedAuth && !pinParam) {
        setShowLandingPage(true);
        setCurrentRole("guest_participant");
      }
    }
  }, []);

  const handleEnterStudio = async (sessId: string) => {
    const target = sessions.find((s) => s.id === sessId) || activeSession || sessions[0] || INITIAL_SESSIONS[0];
    if (target) {
      setActiveSession(target);
    }
    setIsInStudio(true);
    try {
      await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: sessId }),
      });
      await fetchStatus();
    } catch (_) {}
  };

  const handleExitStudio = () => {
    if (!isDirectorAuth) {
      setShowLandingPage(true);
      setIsInStudio(false);
    } else {
      setIsInStudio(false);
    }
  };

  const handleJoinWithCode = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    // Check if entered code matches the Studio Director PIN via secure backend check
    try {
      const pinRes = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_DIRECTOR_PIN", pin: clean }),
      });
      const pinData = await pinRes.json();
      if (pinData?.valid) {
        setIsDirectorAuth(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("fluxax_director_auth", "true");
        }
        setShowLandingPage(false);
        setCurrentRole("studio_director");
        setIsInStudio(false);
        return;
      }
    } catch (_) {}

    // Otherwise look up session IDs and project names
    const cleanLower = clean.toLowerCase();
    const target = sessions.find(
      (s) => s.id.toLowerCase() === cleanLower || s.projectName.toLowerCase().includes(cleanLower)
    );
    if (target) {
      setActiveSession(target);
      setIsInStudio(true);
      setShowLandingPage(false);
      setCurrentRole("guest_participant");
      try {
        await fetch("/api/studio/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SWITCH_SESSION", sessionId: target.id }),
        });
        await fetchStatus();
      } catch (_) {}
    } else {
      alert("Netačan kod sesije ili PIN. Provjerite vašu pozivnicu.");
    }
  };

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) return;
    try {
      const res = await fetch("/api/studio/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_DIRECTOR_PIN", pin }),
      });
      const data = await res.json();
      if (data?.valid) {
        setIsDirectorAuth(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("fluxax_director_auth", "true");
        }
        setDirectorPinModalOpen(false);
        setPinError("");
        setPinInput("");
        setShowLandingPage(false);
        setCurrentRole("studio_director");
        setIsInStudio(false);
      } else {
        setPinError("Netačan PIN kod režije. Pristup odbijen.");
      }
    } catch (_) {
      setPinError("Greška pri komunikaciji sa serverom.");
    }
  };

  const handleDirectorLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fluxax_director_auth");
    }
    setIsDirectorAuth(false);
    setCurrentRole("guest_participant");
    setShowLandingPage(true);
    setIsInStudio(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const sender =
      currentRole === "studio_director"
        ? "Studio"
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

  if (showLandingPage) {
    return (
      <>
        <PublicLandingPage
          onEnterApp={() => {
            if (isDirectorAuth) {
              setShowLandingPage(false);
              setCurrentRole("studio_director");
              setIsInStudio(false);
            } else {
              setDirectorPinModalOpen(true);
            }
          }}
          onJoinSessionWithCode={handleJoinWithCode}
        />

        {/* DIRECTOR PIN MODAL */}
        {directorPinModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-teal-200 max-w-sm w-full p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-700" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
                    <Key className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Režijski Pristup</h3>
                    <p className="text-[11px] text-slate-500">Studio TAF • Režija & Kalendar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDirectorPinModalOpen(false);
                    setPinError("");
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Pristup rasporedu i režijskoj konzoli zaštićen je sigurnosnim PIN kodom studija.
              </p>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Unesite PIN Režije:
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError("");
                    }}
                    className="w-full text-center text-2xl font-mono tracking-widest font-bold py-2.5 px-4 rounded-xl border-2 border-teal-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-900 bg-teal-50/30"
                  />
                  {pinError && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 text-center">
                      {pinError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectorPinModalOpen(false);
                      setPinError("");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-md shadow-teal-700/20 cursor-pointer"
                  >
                    Otključaj Režiju
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

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
              {isDirectorAuth && (
                <button
                  onClick={() => {
                    setCurrentRole("studio_director");
                    if (activeSession) {
                      setIsInStudio(true);
                    } else if (sessions.length > 0) {
                      setActiveSession(sessions[0]);
                      setIsInStudio(true);
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    currentRole === "studio_director"
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-slate-600 hover:text-teal-900"
                  }`}
                >
                  Studio
                </button>
              )}
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
          {isDirectorAuth && (
            <button
              onClick={handleDirectorLogout}
              title="Odjavi se iz režije i zaključaj pristup"
              className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Odjava Režije</span>
            </button>
          )}
          <button
            onClick={() => setShowLandingPage(true)}
            title="Prikaži javnu prezentacionu početnu stranicu FluxaX portala (fluxax.ba)"
            className="px-2.5 py-1 rounded-lg border border-teal-200/80 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">fluxax.ba Portal</span>
          </button>
          <FluxaxDynamicLiveStreamBadge className="hidden md:block" />
          <div className="text-[11px] text-teal-900 font-mono font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300 font-bold font-mono text-[10px]">
              v{APP_CONFIG.version}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW ROUTING */}
      {!isInStudio ? (
        isDirectorAuth ? (
          /* RECEPTION LOBBY & CALENDAR - ONLY FOR AUTHENTICATED DIRECTOR */
          <ReceptionLobby
            role={currentRole}
            studioName={studioName}
            sessions={sessions}
            activeSession={activeSession}
            onEnterStudio={handleEnterStudio}
            onRefreshSessions={fetchStatus}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-teal-200 p-8 max-w-md">
              <Key className="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pristup Kalendaru Ograničen</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Pregled rasporeda i kalendara termina dostupan je isključivo autorizovanoj režiji Studio TAF-a.
              </p>
              <button
                onClick={() => setShowLandingPage(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-teal-700/20"
              >
                Povratak na Početnu Stranicu
              </button>
            </div>
          </div>
        )
      ) : currentRole === "studio_director" && isDirectorAuth ? (
        /* DIRECTOR STUDIO CONSOLE */
        <StudioDirectorConsole
          session={activeSession || sessions[0] || INITIAL_SESSIONS[0]}
          onExitSession={handleExitStudio}
          onUpdateSession={fetchStatus}
        />
      ) : (
        /* CLIENT / NARUČILAC LIVE STUDIO ROOM - LIGHT TEAL DESIGN */
        activeSession && (
          <div className="flex-1 flex flex-col">
            {/* Topbar for Client / Naručilac (Dark Gray Theme) */}
            <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-md text-white">
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-white leading-tight tracking-tight">
                  {activeSession.projectName}
                </span>
              </div>

              {/* Status Beacon & Exit */}
              <div className="flex items-center gap-3">
                {activeSession.isOnAir ? (
                  <div className="px-4 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs tracking-wider animate-pulse border border-red-500 shadow-lg shadow-red-600/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>● REC ON AIR - SNIMA SE</span>
                  </div>
                ) : (
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Spreman za tejk</span>
                  </div>
                )}

                <button
                  onClick={handleExitStudio}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700/80 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Izađi</span>
                </button>
              </div>
            </header>

            {/* Client Studio Body - Full Dynamic Width */}
            <main className="flex-1 p-4 sm:p-6 w-full flex flex-col xl:flex-row gap-5 items-start">
              {/* Left Column: Visual Screen / Hardware Console, Scenario & Audio Trezor */}
              <div className="flex-1 min-w-0 space-y-5 w-full">

                {/* AUDIO (RADIO) VS VIDEO SCREENING MODE */}
                {activeSession.focusMode === "video" || activeSession.videoEnabled ? (
                  /* 1. COMPACT VIDEO SCREENING PLAYER (~20% smaller, unobstructed preview) */
                  <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative flex flex-col">
                    {/* Player Topbar */}
                    <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between backdrop-blur-md">
                      <div className="flex items-center gap-2.5">
                        <Tv className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Video Screening Uživo • 1080p Stream
                        </span>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700 hidden sm:inline-block">
                          Ultra-Niska Latencija (LAN / WebRTC)
                        </span>
                      </div>
                    </div>

                    {/* Compact Unobstructed Video Screen */}
                    <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden max-h-[370px]">
                      <video
                        src="/branding/FluxaX animation red.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Overlaid REC Beacon if ON AIR */}
                      {activeSession.isOnAir && (
                        <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold font-mono px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-red-400 shadow-lg animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          <span>● REC ON AIR - SNIMA SE</span>
                        </div>
                      )}
                    </div>

                    {/* Player Bottom Control & Audio Listening Strip */}
                    <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        {/* Talkback Push-to-Talk Button for Client / Agency */}
                        <button
                          onClick={() => handleCurrentTalkbackToggle(!isCurrentTalkbackOn)}
                          className={`py-2 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-sm ${
                            isCurrentTalkbackOn
                              ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                          }`}
                        >
                          {isCurrentTalkbackOn ? <Mic className="w-4 h-4 fill-current text-slate-950" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                          <span>{isCurrentTalkbackOn ? "TALKBACK UKLJUČEN (Govorite)" : "UKLJUČI MIKROFON (Talkback)"}</span>
                        </button>
                      </div>

                      {/* Client Phones Volume Slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">Glasnoća slušanja:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeConsole.phonesVol}
                          onChange={(e) => updateActiveConsole({ phonesVol: Number(e.target.value) })}
                          className="w-28 accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-teal-400 w-8">
                          {activeConsole.phonesVol}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. VINTAGE CLE HARDWARE CONSOLE FOR RADIO (AUDIO-ONLY) SESSIONS */
                  <ClaHardwareConsole
                    studioName={studioName || "Studio TAF"}
                    projectName={activeSession.projectName}
                    speakerName={activeSession.speakerName}
                    isOnAir={activeSession.isOnAir}
                    isTalkbackActive={isCurrentTalkbackOn}
                    onTalkbackToggle={(active) => handleCurrentTalkbackToggle(active)}
                    micGain={activeConsole.micGain}
                    onMicGainChange={(gain) => updateActiveConsole({ micGain: gain })}
                    phonesVol={activeConsole.phonesVol}
                    onPhonesVolumeChange={(vol) => updateActiveConsole({ phonesVol: vol })}
                    isMuted={activeConsole.isMuted}
                    onMuteToggle={(muted) => updateActiveConsole({ isMuted: muted })}
                    isDimmed={activeConsole.isDimmed}
                    onDimToggle={(dimmed) => updateActiveConsole({ isDimmed: dimmed })}
                    autoDuck={activeConsole.autoDuck}
                    onAutoDuckToggle={(duck) => updateActiveConsole({ autoDuck: duck })}
                    monitorMode={activeConsole.monitorMode}
                    onMonitorModeToggle={(m) => updateActiveConsole({ monitorMode: m })}
                    hdCodec={activeConsole.hdCodec}
                    onHdCodecToggle={(hd) => updateActiveConsole({ hdCodec: hd })}
                  />
                )}

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

                {/* Project Share / Audio Trezor in Client View (Dvosmjerna razmjena fajlova) */}
                <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-sm">
                  <input
                    type="file"
                    ref={clientFileInputRef}
                    multiple
                    className="hidden"
                    onChange={handleClientUpload}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-100 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Share2 className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Audio Trezor • Razmjena Materijala
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        WAV 48kHz / MP3 / PDF
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Lokalni folder za download / razmjenu */}
                      <button
                        type="button"
                        onClick={handlePickClientFolder}
                        title="Podesi ili izaberi lokalni folder za spremanje preuzetih materijala"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>📁</span>
                        <span className="font-mono text-[11px] truncate max-w-[180px]">{clientExchangeFolder}</span>
                        <span className="text-[10px] text-teal-700 font-bold underline ml-1">Promijeni</span>
                      </button>

                      {/* Upload dugme za Naručioca */}
                      <button
                        type="button"
                        onClick={() => clientFileInputRef.current?.click()}
                        disabled={isClientUploading}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isClientUploading ? "Šaljem..." : "Pošalji Fajl u Studio"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeSession.projectFiles || []).map((file) => (
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
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                              <span>{file.size} • {file.uploadedAt}</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                (file.uploadedBy || "").includes("Naručilac")
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {file.uploadedBy || "Studio TAF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={file.url}
                          download={file.name}
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

              </div>

              {/* RIGHT SIDEBAR: UČESNICI U SNIMANJU (VERTIKALNO KAO U STUDIJU) + CHAT */}
              <aside className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
                {/* 1. UČESNICI U SNIMANJU */}
                <div className="bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        Učesnici u Snimanju
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono text-[10px] font-bold">
                      {(activeSession.attendees?.length || 0) + 1}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* A. Studio (Tonac) */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        directorTalkbackOn
                          ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/50 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            S
                          </div>
                          {directorTalkbackOn && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">Studio</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-900 font-semibold">Tonac</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Glavni pult</span>
                        </div>
                      </div>

                      {/* Speaking indicator / Audio bars */}
                      {directorTalkbackOn ? (
                        <div className="flex items-center gap-0.5" title="Studio govori">
                          <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    {/* B. Ostali učesnici: Naručilac, Spiker, Klijenti */}
                    {activeSession.attendees &&
                      activeSession.attendees
                        .filter((att) => att.role !== "studio_director")
                        .map((att) => {
                          const isAgency = att.role === "agency_tenant";
                          const isSpeaker = att.role === "speaker";
                          const isSelf = (currentRole === "agency_tenant" && isAgency) || (currentRole === "guest_participant" && !isAgency && !isSpeaker);
                          const isSpeaking = att.isSpeaking || (isSelf && isCurrentTalkbackOn) || (isAgency && agencyTalkbackOn) || (!isAgency && !isSpeaker && guestTalkbackOn);

                          return (
                            <div
                              key={att.id}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                                isSpeaking
                                  ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-sm shadow-emerald-500/10"
                                  : "bg-slate-50/60 border-slate-200 text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="relative">
                                  <div
                                    className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center text-white shadow-xs ${
                                      isSpeaker
                                        ? "bg-teal-600"
                                        : isAgency
                                        ? "bg-purple-600"
                                        : "bg-slate-700"
                                    }`}
                                  >
                                    {att.name.charAt(0)}
                                  </div>
                                  {isSpeaking && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                                  )}
                                </div>

                                <div className="leading-tight">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">{att.name}</span>
                                    {isAgency && (
                                      <span className="text-[9px] font-mono px-1 rounded bg-purple-100 text-purple-900 font-semibold">
                                        Naručilac
                                      </span>
                                    )}
                                    {isSpeaker && (
                                      <span className="text-[9px] font-mono px-1 rounded bg-teal-100 text-teal-900 font-semibold">
                                        Spiker
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {att.company || (isSpeaker ? "Glumačka soba" : isAgency ? "Agencija" : "Klijent")}
                                  </span>
                                </div>
                              </div>

                              {/* Speaking Wave Bars */}
                              {isSpeaking ? (
                                <div className="flex items-center gap-0.5" title="Govori uživo">
                                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-1 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                              )}
                            </div>
                          );
                        })}
                  </div>
                </div>

                {/* 2. REŽIJSKI CHAT & SUGESTIJE */}
                <div className="bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[420px]">
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
                  <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
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
              </aside>
            </main>
          </div>
        )
      )}
    </div>
  );
}
