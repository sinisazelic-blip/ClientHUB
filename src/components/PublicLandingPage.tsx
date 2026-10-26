"use client";

import React, { useState } from "react";
import {
  Radio,
  Tv,
  Mic,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Globe,
  Sliders,
  Sparkles,
  Server,
  Users,
} from "lucide-react";
import { APP_CONFIG } from "@/config/appConfig";

type Language = "en" | "bs";

interface PublicLandingPageProps {
  onEnterApp: () => void;
  onJoinSessionWithCode: (code: string) => void;
}

const TRANSLATIONS = {
  en: {
    nav: {
      howItWorks: "How It Works",
      advantages: "Advantages",
      contact: "Contact & Licensing",
      launchApp: "Launch Platform",
    },
    hero: {
      badge: "Professional Standard for Remote Voice & Video Sessions",
      titleStart: "Pristine Studio Monitoring",
      titleHighlight: "Live in Your Browser",
      subtitle:
        "Uncompressed master audio broadcast direct from the control room (48 kHz / 24-bit), video synchronization with 18 ms ultra-low latency, Zero-Bleed two-way talkback and real-time take approvals for clients and agencies.",
      inputPlaceholder: "Enter session code or project ID...",
      joinBtn: "Join Session",
      errorEmpty: "Please enter a valid session ID or code.",
      inviteHint: "Have an invite link? Simply open it in your browser for direct access with no sign-up required.",
    },
    diagram: {
      tag: "HOW THE PLATFORM WORKS",
      title: "From Studio Microphone to Client in 4 Steps",
      subtitle: "No installations, zero plugins, and zero audio configuration needed for clients and agencies.",
      step1Title: "Studio & DAW",
      step1Desc: "Voice talent records in the acoustic booth through high-end studio microphones and hardware interfaces.",
      step1Badge: "48 kHz / 24-bit PCM",
      step2Title: "StudioBridge Daemon",
      step2Desc: "Local control room service bridges the hardware matrix and video stream with sub-5ms local latency.",
      step2Badge: "Zero-Bleed DSP Isolation",
      step3Title: "FluxaX Cloud / Media Hub",
      step3Desc: "Encrypted WebRTC media servers distribute clean audio/video feeds and sync scenario script with takes.",
      step3Badge: "Secure Tokens & Roles",
      step4Title: "Client & Agency",
      step4Desc: "Listen to pristine studio audio on phone or desktop, provide instant verbal feedback and approve takes.",
      step4Badge: "Browser-Only (Zero Install)",
    },
    advantages: {
      tag: "CONTROL ROOM STANDARD",
      title: "Why Consumer Conference Apps Fail for Audio Production",
      card1Title: "48 kHz / 24-bit Pristine Audio",
      card1Desc:
        "Zoom and Teams aggressively compress audio down to 16 kHz, cutting essential lows and highs. FluxaX delivers bit-perfect studio master quality with zero coloration.",
      card2Title: "Zero-Bleed DSP Talkback",
      card2Desc:
        "When client or director presses push-to-talk, smart DSP prevents feedback loops, acoustic echo, and vocal bleed into the talent booth master recording.",
      card3Title: "Live Take Management",
      card3Desc:
        "Agency and director tag takes in real time directly inside the script: Final master (⭐), Alternative reserve (🟡), or Re-record (❌).",
    },
    contact: {
      boxTitle: "Want FluxaX in Your Studio?",
      boxDesc:
        "The FluxaX platform is available for licensed professional audio recording studios, broadcasters, dubbing facilities, and commercial advertising agencies.",
      launchConsole: "Launch Studio Console",
      rights: "Fluxa Group. All rights reserved.",
    },
  },
  bs: {
    nav: {
      howItWorks: "Kako funkcioniše",
      advantages: "Prednosti",
      contact: "Kontakt & Licenca",
      launchApp: "Ulazak u Platformu",
    },
    hero: {
      badge: "Profesionalni Standard za Daljinsko Snimanje Glasa & Videa",
      titleStart: "Vrhunski Studio Monitoring",
      titleHighlight: "Uživo u Vašem Browseru",
      subtitle:
        "Emitovanje master zvuka direktno iz režije bez kompresije (48 kHz / 24-bit), video sinhronizacija sa latencijom od samo 18 ms, Zero-Bleed dvosmjerni talkback i interaktivno odobravanje tejkova za klijente i agencije.",
      inputPlaceholder: "Unesite kod ili naziv termina...",
      joinBtn: "Uđi u Sesiju",
      errorEmpty: "Molimo unesite ID ili kod termina snimanja.",
      inviteHint: "Imate pozivni link? Jednostavno ga otvorite u browseru za direktan pristup bez registracije.",
    },
    diagram: {
      tag: "KAKO PLATFORMA FUNKCIONIŠE",
      title: "Od Studijskog Mikrofona do Klijenta u 4 Koraka",
      subtitle: "Bez potrebe za komplikovanim instalacijama ili podešavanjima na strani naručioca i klijenta.",
      step1Title: "Studio & DAW",
      step1Desc: "Spiker snima u glumačkoj sobi kroz profesionalni mikrofon i audio interfejs.",
      step1Badge: "48 kHz / 24-bit PCM",
      step2Title: "StudioBridge Daemon",
      step2Desc: "Lokalni servis u režiji preuzima hardverski miks i video feed sa latencijom ispod 5 ms.",
      step2Badge: "Zero-Bleed DSP Izolacija",
      step3Title: "FluxaX Cloud / Media Hub",
      step3Desc: "Enkriptovani WebRTC server distribuira audio/video tok i sinhronizuje scenario sa tejkovima.",
      step3Badge: "Sigurni Tokeni & Uloge",
      step4Title: "Klijent & Naručilac",
      step4Desc: "Slušaju čist ton na telefonu ili laptopu, daju verbalne sugestije i odobravaju tejkove.",
      step4Badge: "Browser-Only (Bez instalacije)",
    },
    advantages: {
      tag: "STANDARD PROFESIONALNE REŽIJE",
      title: "Zašto uobičajeni softveri nisu rješenje za audio produkciju",
      card1Title: "48 kHz / 24-bit Neokrnjen Ton",
      card1Desc:
        "Zoom i Teams agresivno kompresuju zvuk (16 kHz) i režu visoke i niske frekvencije. FluxaX prenosi izvorni studijski kvalitet bez gubitaka.",
      card2Title: "Zero-Bleed DSP Talkback",
      card2Desc:
        "Kada klijent ili režija pritisnu taster za govor, ne dolazi do mikrofonije, odjeka niti zagađenja master snimka u glumačkoj sobi.",
      card3Title: "Upravljanje Tejkovima Uživo",
      card3Desc:
        "Naručilac posla direktno u toku snimanja označava koji je tejk finalni (⭐), rezervni (🟡) ili ga treba ponoviti (❌).",
    },
    contact: {
      boxTitle: "Želite FluxaX u Vašem Studiju?",
      boxDesc:
        "Platforma je dostupna licenciranim profesionalnim studijima za audio produkciju, radio i TV emitovanje, kao i agencijama.",
      launchConsole: "Pokreni Studio Pult",
      rights: "Fluxa Group. Sva prava zadržana.",
    },
  },
};

export function PublicLandingPage({
  onEnterApp,
  onJoinSessionWithCode,
}: PublicLandingPageProps) {
  // Initial language: English as requested
  const [lang, setLang] = useState<Language>("en");
  const [sessionCodeInput, setSessionCodeInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const t = TRANSLATIONS[lang];

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = sessionCodeInput.trim();
    if (!cleanCode) {
      setErrorMessage(t.hero.errorEmpty);
      return;
    }
    setErrorMessage("");
    onJoinSessionWithCode(cleanCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* =========================================================================
          TOP NAVIGATION
      ========================================================================= */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-b from-[#181f29] via-[#0f151e] to-[#0a0e14] border border-slate-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_1px_3px_rgba(0,0,0,0.25)] hover:border-teal-500/60 transition-colors">
            <img
              src="/branding/FluxaX logo.png"
              alt="FluxaX Ecosystem"
              className="h-8 sm:h-9 w-auto object-contain block"
            />
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-teal-400 bg-teal-950/80 border border-teal-800/60 px-2 py-0.5 rounded-full">
            {APP_CONFIG.build}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#dijagram"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden md:inline-block"
          >
            {t.nav.howItWorks}
          </a>
          <a
            href="#prednosti"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden md:inline-block"
          >
            {t.nav.advantages}
          </a>
          <a
            href="#kontakt"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden md:inline-block"
          >
            {t.nav.contact}
          </a>

          {/* LANGUAGE SWITCHER: EN / SR-BA-HR */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-[11px] ${
                lang === "en"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("bs")}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-[11px] ${
                lang === "bs"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              SR/BA/HR
            </button>
          </div>

          <button
            onClick={onEnterApp}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-teal-600/30 border border-teal-400/30"
          >
            <span>{t.nav.launchApp}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* =========================================================================
          HERO SECTION WITH LUXURY VIDEO LOOP
      ========================================================================= */}
      <header className="relative min-h-[620px] flex items-center justify-center overflow-hidden border-b border-slate-800 px-6 py-16">
        {/* Background Video Loop */}
        <video
          src="/branding/FluxaX animation red.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/40 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {t.hero.titleStart} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* Quick Session Join Card */}
          <div className="max-w-md mx-auto pt-4">
            <form
              onSubmit={handleJoinSubmit}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={sessionCodeInput}
                onChange={(e) => setSessionCodeInput(e.target.value)}
                placeholder={t.hero.inputPlaceholder}
                className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-teal-500/20"
              >
                <span>{t.hero.joinBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {errorMessage && (
              <p className="text-red-400 text-[11px] mt-2 font-medium">{errorMessage}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-2.5">
              {t.hero.inviteHint}
            </p>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 2: ARCHITECTURE BLOCK DIAGRAM
      ========================================================================= */}
      <section id="dijagram" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest">
            {t.diagram.tag}
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {t.diagram.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t.diagram.subtitle}
          </p>
        </div>

        {/* 4-Step Architecture Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* STEP 1: STUDIO & DAW */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-500/50 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-700/50 text-teal-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                {t.diagram.step1Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.diagram.step1Desc}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800 text-[10px] font-mono text-teal-400">
              {t.diagram.step1Badge}
            </div>
          </div>

          {/* STEP 2: STUDIOBRIDGE ENGINE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-500/50 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700/50 text-purple-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                {t.diagram.step2Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.diagram.step2Desc}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800 text-[10px] font-mono text-purple-400">
              {t.diagram.step2Badge}
            </div>
          </div>

          {/* STEP 3: FLUXAX CLOUD SERVER */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-500/50 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/50 text-emerald-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                {t.diagram.step3Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.diagram.step3Desc}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800 text-[10px] font-mono text-emerald-400">
              {t.diagram.step3Badge}
            </div>
          </div>

          {/* STEP 4: CLIENT & AGENCY */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-500/50 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/50 text-amber-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {t.diagram.step4Title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.diagram.step4Desc}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800 text-[10px] font-mono text-amber-400">
              {t.diagram.step4Badge}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WHY FLUXAX VS ZOOM / TEAMS (ADVANTAGES)
      ========================================================================= */}
      <section id="prednosti" className="py-20 px-6 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest">
              {t.advantages.tag}
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {t.advantages.title}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">{t.advantages.card1Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.advantages.card1Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">{t.advantages.card2Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.advantages.card2Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">{t.advantages.card3Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.advantages.card3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CONTACT, LICENSING & FOOTER
      ========================================================================= */}
      <footer id="kontakt" className="py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border border-teal-800/40 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-lg text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {t.contact.boxTitle}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.contact.boxDesc}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-teal-300">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {APP_CONFIG.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {APP_CONFIG.phone}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onEnterApp}
              className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              <span>{t.contact.launchConsole}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{APP_CONFIG.fullName}</span>
            <span>•</span>
            <span className="font-mono text-teal-600">{APP_CONFIG.build}</span>
          </div>
          <p>© {new Date().getFullYear()} {t.contact.rights}</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLandingPage;
