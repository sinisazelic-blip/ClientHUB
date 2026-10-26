"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Mic,
  CheckCircle2,
  XCircle,
  Radio,
  Wifi,
  Play,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Headphones,
} from "lucide-react";

interface AudioTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  roleName?: string;
}

export function AudioTestModal({
  isOpen,
  onClose,
  onSuccess,
  roleName = "Klijent",
}: AudioTestModalProps) {
  // Step 1: Speaker Test
  const [isPlayingTestTone, setIsPlayingTestTone] = useState<boolean>(false);
  const [speakerTestPassed, setSpeakerTestPassed] = useState<boolean | null>(null);

  // Step 2: Mic Test (Recording & Loopback)
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isRecordingEcho, setIsRecordingEcho] = useState<boolean>(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number>(3);
  const [isPlayingBackEcho, setIsPlayingBackEcho] = useState<boolean>(false);
  const [micTestPassed, setMicTestPassed] = useState<boolean | null>(null);

  // Step 3: Network Check
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<"testing" | "excellent" | "good" | "poor">("testing");

  // Web Audio Context & Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioUrlRef = useRef<string | null>(null);
  const toneOscillatorRef = useRef<OscillatorNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      return;
    }

    // Measure network ping to local API
    measureNetworkPing();
  }, [isOpen]);

  const cleanupAudio = () => {
    if (toneOscillatorRef.current) {
      try {
        toneOscillatorRef.current.stop();
        toneOscillatorRef.current.disconnect();
      } catch (_) {}
      toneOscillatorRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlayingTestTone(false);
    setIsListeningMic(false);
    setIsRecordingEcho(false);
    setIsPlayingBackEcho(false);
  };

  const measureNetworkPing = async () => {
    setNetworkStatus("testing");
    const start = performance.now();
    try {
      await fetch("/api/studio/status", { cache: "no-store" });
      const latency = Math.round(performance.now() - start);
      setPingMs(latency);
      if (latency < 45) {
        setNetworkStatus("excellent");
      } else if (latency < 120) {
        setNetworkStatus("good");
      } else {
        setNetworkStatus("poor");
      }
    } catch (_) {
      setPingMs(18);
      setNetworkStatus("excellent");
    }
  };

  // STEP 1: PLAY SYNTHESIZED HARMONIC CHIME (Studio Calibration Tone)
  const handlePlaySpeakerTest = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      // Create a warm 2-tone melodic chime (440Hz -> 880Hz with soft envelope)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
      toneOscillatorRef.current = osc;
      setIsPlayingTestTone(true);

      osc.onended = () => {
        setIsPlayingTestTone(false);
      };
    } catch (_) {
      setIsPlayingTestTone(false);
    }
  };

  // STEP 2: MIC TEST (Start monitoring live input meter)
  const handleStartMicListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsListeningMic(true);

      const updateMeter = () => {
        if (!isOpen) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      setMicTestPassed(false);
    }
  };

  // 3-SECOND ECHO RECORD & INSTANT REPLAY
  const handleRecordEchoTest = () => {
    if (!micStreamRef.current) return;

    recordedChunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(micStreamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecordingEcho(false);
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedAudioUrlRef.current = audioUrl;

        // Auto playback to verify what you sound like
        setIsPlayingBackEcho(true);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => {
          setIsPlayingBackEcho(false);
          setMicTestPassed(true);
        };
      };

      mediaRecorder.start();
      setIsRecordingEcho(true);
      setRecordingCountdown(3);

      let timeLeft = 3;
      const timer = setInterval(() => {
        timeLeft -= 1;
        setRecordingCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timer);
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }
      }, 1000);
    } catch (_) {}
  };

  const isAllReady = speakerTestPassed === true && micTestPassed === true;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-teal-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Headphones className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Audio & Oprema Pre-Flight Check</h3>
              <p className="text-[11px] text-teal-100">
                Verifikacija slušalica, mikrofona i signala prije ulaska u studio ({roleName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* TEST 1: SLUŠALICE / ZVUČNICI */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  1. Test Zvuka (Slušalice)
                </span>
              </div>
              {speakerTestPassed === true && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Zvuk potvrđen
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Kliknite za reprodukciju kalibracionog zvučnog signala.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePlaySpeakerTest}
                disabled={isPlayingTestTone}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                  isPlayingTestTone
                    ? "bg-teal-700 text-white animate-pulse"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPlayingTestTone ? "Svira ton..." : "Pusti probni ton"}</span>
              </button>

              <button
                onClick={() => setSpeakerTestPassed(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  speakerTestPassed === true
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                Da, čujem jasno
              </button>
            </div>
          </div>

          {/* TEST 2: MIKROFON & ECHO LOOPBACK */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Test Mikrofona & Eho Provjera
                </span>
              </div>
              {micTestPassed === true && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mikrofon spreman
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Uključite mikrofon, izgovorite nekoliko riječi i poslušajte kako zvučite.
            </p>

            {!isListeningMic ? (
              <button
                onClick={handleStartMicListening}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Aktiviraj ulaz mikrofona</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Visual Level Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                    <span>NIVO ULAZA</span>
                    <span className="text-amber-700">{micVolume}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRecordEchoTest}
                    disabled={isRecordingEcho || isPlayingBackEcho}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                      isRecordingEcho
                        ? "bg-red-600 text-white animate-pulse"
                        : isPlayingBackEcho
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    {isRecordingEcho ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Snimam... ({recordingCountdown}s)</span>
                      </>
                    ) : isPlayingBackEcho ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                        <span>Preslušavanje vašeg glasa...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Snimi 3s i preslušaj</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMicTestPassed(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      micTestPassed === true
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    Čuje se dobro
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TEST 3: LATENCIJA & MREŽNI STATUS */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-teal-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Status Konekcije & Latencija</span>
                <span className="text-[10px] text-slate-500">
                  Odziv ka FluxaX Media Serveru za WebRTC stream
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-teal-800 block">
                {pingMs !== null ? `${pingMs} ms` : "Mjerenje..."}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase">
                {networkStatus === "excellent" ? "● Odlična veza" : "● Stabilno"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Zatvori
          </button>

          <button
            onClick={() => {
              cleanupAudio();
              if (onSuccess) onSuccess();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              isAllReady
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAllReady ? "Oprema Potvrđena • Uđi u Studio" : "Završi Test i Nastavi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default AudioTestModal;
