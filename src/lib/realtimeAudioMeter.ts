/**
 * Real-time 60 FPS Web Audio Metering & Playback Engine for Client HUB
 * Runs entirely on the host browser:
 * - Direct soundcard access via navigator.mediaDevices.getUserMedia (ASIO/WASAPI Loopback/Mic)
 * - Binary PCM streaming from StudioBridge over WebSocket
 * - Master/Phones volume fader attenuation (0 = absolute silence & 0 VU meter)
 */

export interface MeterReading {
  vuL: number;       // 0 - 100 percentage
  vuR: number;       // 0 - 100 percentage
  dbL: string;       // formatted dB string, e.g. "-12.4 dB" or "-inf dB"
  dbR: string;       // formatted dB string, e.g. "-12.4 dB" or "-inf dB"
  rawPeakL: number;  // 0.0 to 1.0+
  rawPeakR: number;  // 0.0 to 1.0+
}

export type MeterCallback = (reading: MeterReading) => void;

class RealtimeAudioMeterEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private analyserL: AnalyserNode | null = null;
  private analyserR: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private callbacks: Set<MeterCallback> = new Set();

  private currentVolume: number = 90; // 0 to 100
  private isMuted: boolean = false;
  private isDimmed: boolean = false;
  private isMono: boolean = false;

  // Buffer for WebSocket PCM streaming
  private pcmBufferL = new Float32Array(1024);
  private pcmBufferR = new Float32Array(1024);
  private pcmPeakL = 0;
  private pcmPeakR = 0;
  private pcmDecay = 0.92;
  private hasPcmSignal = false;
  private lastPcmTime = 0;

  constructor() {}

  private initContext() {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ sampleRate: 48000 });
      this.splitterNode = this.ctx.createChannelSplitter(2);
      this.analyserL = this.ctx.createAnalyser();
      this.analyserR = this.ctx.createAnalyser();
      this.gainNode = this.ctx.createGain();

      this.analyserL.fftSize = 512;
      this.analyserR.fftSize = 512;
      this.analyserL.smoothingTimeConstant = 0.2;
      this.analyserR.smoothingTimeConstant = 0.2;

      this.updateGain();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(volPercent: number) {
    this.currentVolume = Math.min(100, Math.max(0, volPercent));
    this.updateGain();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.updateGain();
  }

  public setDim(dimmed: boolean) {
    this.isDimmed = dimmed;
    this.updateGain();
  }

  public setMono(mono: boolean) {
    this.isMono = mono;
  }

  private updateGain() {
    if (!this.gainNode || !this.ctx) return;
    if (this.isMuted || this.currentVolume <= 0) {
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }
    // Exponential fader taper: vol/100 squared
    let mult = Math.pow(this.currentVolume / 100, 1.8);
    if (this.isDimmed) mult *= 0.1; // -20dB dim
    this.gainNode.gain.setValueAtTime(mult, this.ctx.currentTime);
  }

  /**
   * Start capturing direct soundcard audio via Web Audio API getUserMedia
   */
  public async startDirectHardwareAudio(deviceId?: string): Promise<boolean> {
    try {
      this.initContext();
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
          sampleRate: 48000,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micStream = stream;

      if (!this.ctx || !this.splitterNode || !this.analyserL || !this.analyserR || !this.gainNode) {
        return false;
      }

      if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch (_) {}
      }

      this.sourceNode = this.ctx.createMediaStreamSource(stream);
      // Connect: source -> splitter -> analyserL & analyserR
      this.sourceNode.connect(this.splitterNode);
      this.splitterNode.connect(this.analyserL, 0);
      this.splitterNode.connect(this.analyserR, 1);

      this.startMeterLoop();
      return true;
    } catch (err) {
      console.warn("[RealtimeAudioMeter] getUserMedia nije uspio:", err);
      return false;
    }
  }

  public stopDirectHardwareAudio() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
  }

  /**
   * Feed raw stereo float32 PCM chunk received from StudioBridge WebSocket
   */
  public feedPcmChunk(pcmData: Float32Array) {
    if (!pcmData || pcmData.length === 0) return;

    let pL = 0;
    let pR = 0;
    for (let i = 0; i < pcmData.length; i += 2) {
      const l = Math.abs(pcmData[i]);
      const r = Math.abs(pcmData[i + 1] !== undefined ? pcmData[i + 1] : pcmData[i]);
      if (l > pL) pL = l;
      if (r > pR) pR = r;
    }

    this.pcmPeakL = Math.max(pL, this.pcmPeakL * this.pcmDecay);
    this.pcmPeakR = Math.max(pR, this.pcmPeakR * this.pcmDecay);
    this.hasPcmSignal = true;
    this.lastPcmTime = performance.now();

    this.startMeterLoop();
  }

  public subscribe(cb: MeterCallback): () => void {
    this.callbacks.add(cb);
    this.startMeterLoop();
    return () => {
      this.callbacks.delete(cb);
      if (this.callbacks.size === 0 && !this.micStream) {
        this.stopMeterLoop();
      }
    };
  }

  private startMeterLoop() {
    if (this.animFrameId !== null) return;

    const dataArrayL = new Float32Array(512);
    const dataArrayR = new Float32Array(512);

    const tick = () => {
      const now = performance.now();
      let peakL = 0;
      let peakR = 0;

      // 1. Direct Web Audio API from getUserMedia
      if (this.analyserL && this.analyserR && this.micStream) {
        this.analyserL.getFloatTimeDomainData(dataArrayL);
        this.analyserR.getFloatTimeDomainData(dataArrayR);

        for (let i = 0; i < dataArrayL.length; i++) {
          const l = Math.abs(dataArrayL[i]);
          const r = Math.abs(dataArrayR[i]);
          if (l > peakL) peakL = l;
          if (r > peakR) peakR = r;
        }
      }

      // 2. Or fallback to PCM peak streamed from StudioBridge
      if (peakL <= 0.0001 && peakR <= 0.0001 && this.hasPcmSignal) {
        if (now - this.lastPcmTime < 350) {
          this.pcmPeakL *= this.pcmDecay;
          this.pcmPeakR *= this.pcmDecay;
          peakL = this.pcmPeakL;
          peakR = this.pcmPeakR;
        } else {
          this.hasPcmSignal = false;
          this.pcmPeakL = 0;
          this.pcmPeakR = 0;
        }
      }

      // Apply Volume Slider (šiber) attenuation:
      // When muted or volume is 0, signal is completely SILENCED (0 VU)
      let mult = (this.isMuted || this.currentVolume <= 0)
        ? 0
        : Math.pow(this.currentVolume / 100, 1.8);

      if (this.isDimmed) mult *= 0.1;

      const finalPeakL = peakL * mult;
      const finalPeakR = peakR * mult;

      // Mono summing mode
      let monoPeakL = finalPeakL;
      let monoPeakR = finalPeakR;
      if (this.isMono) {
        const mono = (finalPeakL + finalPeakR) / 2;
        monoPeakL = mono;
        monoPeakR = mono;
      }

      // Convert peak to dB (-60 to 0 dBFS)
      const dbValL = monoPeakL > 0.00001 ? 20 * Math.log10(monoPeakL) : -100;
      const dbValR = monoPeakR > 0.00001 ? 20 * Math.log10(monoPeakR) : -100;

      // Map dB to standard VU Meter % (0 to 100)
      const vuL = this.dbToVuPercent(dbValL);
      const vuR = this.dbToVuPercent(dbValR);

      const dbStrL = dbValL <= -59.5 || vuL <= 0 ? "-inf dB" : `${Math.min(0, dbValL).toFixed(1)} dB`;
      const dbStrR = dbValR <= -59.5 || vuR <= 0 ? "-inf dB" : `${Math.min(0, dbValR).toFixed(1)} dB`;

      const reading: MeterReading = {
        vuL,
        vuR,
        dbL: dbStrL,
        dbR: dbStrR,
        rawPeakL: monoPeakL,
        rawPeakR: monoPeakR,
      };

      this.callbacks.forEach((cb) => {
        try { cb(reading); } catch (_) {}
      });

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopMeterLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private dbToVuPercent(db: number): number {
    if (db <= -59.5) return 0;
    if (db >= 0.0) return 100;
    if (db < -40.0) {
      return Math.round(((db + 60.0) / 20.0) * 20.0);
    } else if (db < -20.0) {
      return Math.round(20.0 + ((db + 40.0) / 20.0) * 25.0);
    } else if (db < -6.0) {
      return Math.round(45.0 + ((db + 20.0) / 14.0) * 37.0);
    } else {
      return Math.round(82.0 + ((db + 6.0) / 6.0) * 18.0);
    }
  }
}

// Global shared singleton for the host application
export const realtimeAudioMeter = new RealtimeAudioMeterEngine();
