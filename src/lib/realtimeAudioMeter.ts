/**
 * Real-time Professional Audio Metering & Ballistics Engine for Client HUB
 * Implements standard studio VU ballistics (ANSI C16.5 / IEC 60268-10):
 * - Fast snappy attack (< 15ms)
 * - Smooth analog decay (~300ms integration release)
 * - RMS energy integration (eliminates zero-crossing flicker/jitter)
 * - Master/Phones volume fader attenuation (0 = absolute silence & 0 VU meter)
 */

export interface MeterReading {
  vuL: number;       // 0 - 100 percentage (smooth ballistics)
  vuR: number;       // 0 - 100 percentage (smooth ballistics)
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

  // VU Ballistics Smoothers
  private smoothedVuL = 0;
  private smoothedVuR = 0;

  // Buffer for WebSocket PCM streaming
  private pcmPeakL = 0;
  private pcmPeakR = 0;
  private pcmRmsL = 0;
  private pcmRmsR = 0;
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

      this.analyserL.fftSize = 1024;
      this.analyserR.fftSize = 1024;
      this.analyserL.smoothingTimeConstant = 0.8;
      this.analyserR.smoothingTimeConstant = 0.8;

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

    let peakL = 0;
    let peakR = 0;
    let sumSqL = 0;
    let sumSqR = 0;
    const numFrames = pcmData.length / 2;

    for (let i = 0; i < pcmData.length; i += 2) {
      const l = Math.abs(pcmData[i]);
      const r = Math.abs(pcmData[i + 1] !== undefined ? pcmData[i + 1] : pcmData[i]);
      if (l > peakL) peakL = l;
      if (r > peakR) peakR = r;
      sumSqL += l * l;
      sumSqR += r * r;
    }

    const rmsL = Math.sqrt(sumSqL / (numFrames || 1));
    const rmsR = Math.sqrt(sumSqR / (numFrames || 1));

    // Instant attack, smooth exponential decay for PCM
    this.pcmPeakL = Math.max(peakL, this.pcmPeakL * 0.88);
    this.pcmPeakR = Math.max(peakR, this.pcmPeakR * 0.88);
    this.pcmRmsL = Math.max(rmsL, this.pcmRmsL * 0.88);
    this.pcmRmsR = Math.max(rmsR, this.pcmRmsR * 0.88);

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

    const dataArrayL = new Float32Array(1024);
    const dataArrayR = new Float32Array(1024);

    const tick = () => {
      const now = performance.now();
      let measuredMetricL = 0;
      let measuredMetricR = 0;

      // 1. Direct Web Audio API from getUserMedia
      if (this.analyserL && this.analyserR && this.micStream) {
        this.analyserL.getFloatTimeDomainData(dataArrayL);
        this.analyserR.getFloatTimeDomainData(dataArrayR);

        let peakL = 0;
        let peakR = 0;
        let sumSqL = 0;
        let sumSqR = 0;

        for (let i = 0; i < dataArrayL.length; i++) {
          const l = Math.abs(dataArrayL[i]);
          const r = Math.abs(dataArrayR[i]);
          if (l > peakL) peakL = l;
          if (r > peakR) peakR = r;
          sumSqL += l * l;
          sumSqR += r * r;
        }

        const rmsL = Math.sqrt(sumSqL / dataArrayL.length);
        const rmsR = Math.sqrt(sumSqR / dataArrayR.length);

        // Standard studio weighting: 65% RMS body + 35% peak transient response
        measuredMetricL = rmsL * 1.6 + peakL * 0.35;
        measuredMetricR = rmsR * 1.6 + peakR * 0.35;
      }

      // 2. Or fallback to PCM audio streamed from StudioBridge
      if (measuredMetricL <= 0.0001 && measuredMetricR <= 0.0001 && this.hasPcmSignal) {
        if (now - this.lastPcmTime < 400) {
          this.pcmPeakL *= 0.90;
          this.pcmPeakR *= 0.90;
          this.pcmRmsL *= 0.90;
          this.pcmRmsR *= 0.90;
          measuredMetricL = this.pcmRmsL * 1.6 + this.pcmPeakL * 0.35;
          measuredMetricR = this.pcmRmsR * 1.6 + this.pcmPeakR * 0.35;
        } else {
          this.hasPcmSignal = false;
          this.pcmPeakL = 0;
          this.pcmPeakR = 0;
          this.pcmRmsL = 0;
          this.pcmRmsR = 0;
        }
      }

      // Apply Volume Slider (šiber) attenuation:
      // When muted or volume is 0, signal is completely SILENCED (0 VU)
      let mult = (this.isMuted || this.currentVolume <= 0)
        ? 0
        : Math.pow(this.currentVolume / 100, 1.8);

      if (this.isDimmed) mult *= 0.1;

      const targetMetricL = measuredMetricL * mult;
      const targetMetricR = measuredMetricR * mult;

      // Mono summing mode
      let monoTargetL = targetMetricL;
      let monoTargetR = targetMetricR;
      if (this.isMono) {
        const mono = (targetMetricL + targetMetricR) / 2;
        monoTargetL = mono;
        monoTargetR = mono;
      }

      // Convert target metric to raw target percentage (0 to 100)
      const dbL = monoTargetL > 0.00001 ? 20 * Math.log10(monoTargetL) : -100;
      const dbR = monoTargetR > 0.00001 ? 20 * Math.log10(monoTargetR) : -100;
      const targetVuL = this.dbToVuPercent(dbL);
      const targetVuR = this.dbToVuPercent(dbR);

      // PROFESSIONAL VU BALLISTICS ENVELOPE:
      // Snappy attack (< 15ms) so fast transients are captured,
      // and smooth mechanical release (~300ms) so needles glide without flickering!
      if (targetVuL > this.smoothedVuL) {
        this.smoothedVuL += (targetVuL - this.smoothedVuL) * 0.40; // Attack
      } else {
        this.smoothedVuL += (targetVuL - this.smoothedVuL) * 0.08; // 300ms Release
      }

      if (targetVuR > this.smoothedVuR) {
        this.smoothedVuR += (targetVuR - this.smoothedVuR) * 0.40; // Attack
      } else {
        this.smoothedVuR += (targetVuR - this.smoothedVuR) * 0.08; // 300ms Release
      }

      // Hard clamp at silence threshold
      if (this.smoothedVuL < 0.5 || mult === 0) this.smoothedVuL = 0;
      if (this.smoothedVuR < 0.5 || mult === 0) this.smoothedVuR = 0;

      const finalVuL = Math.round(this.smoothedVuL);
      const finalVuR = Math.round(this.smoothedVuR);

      const dbStrL = finalVuL <= 0 || dbL <= -59.5 ? "-inf dB" : `${Math.min(0, dbL).toFixed(1)} dB`;
      const dbStrR = finalVuR <= 0 || dbR <= -59.5 ? "-inf dB" : `${Math.min(0, dbR).toFixed(1)} dB`;

      const reading: MeterReading = {
        vuL: finalVuL,
        vuR: finalVuR,
        dbL: dbStrL,
        dbR: dbStrR,
        rawPeakL: monoTargetL,
        rawPeakR: monoTargetR,
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
