/**
 * SoundManager.js
 * Synthesizes realistic guttural zombie moans (Hhh-u-r-g-h) using
 * vocal tract formant filters & breath noise, with custom MP3 support.
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        // Optionally put a direct link to an MP3 here if you host the file
        this.customZombieAudioUrl = null; 
    }

    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    playZombieGroan() {
        // If an external real MP3 file is assigned, play it directly
        if (this.customZombieAudioUrl) {
            const audio = new Audio(this.customZombieAudioUrl);
            audio.volume = 0.8;
            audio.play().catch(() => {});
            return;
        }

        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.01;

        // 1. Vocal Cord Pulse (Deep guttural base rumble)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(68, now);
        osc.frequency.linearRampToValueAtTime(54, now + 0.6);
        osc.frequency.linearRampToValueAtTime(74, now + 1.1);
        osc.frequency.linearRampToValueAtTime(46, now + 1.8);

        // 2. Throat Breath Noise (Creates the dry "Hhh" and "Rrrgh" rasp)
        const bufferSize = Math.floor(ctx.sampleRate * 1.8);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.45;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // 3. Human Vocal Formants (Filters creating "Uuu-r-g-h" vowel resonance)
        const throatFormant = ctx.createBiquadFilter();
        throatFormant.type = 'bandpass';
        throatFormant.frequency.setValueAtTime(320, now);
        throatFormant.Q.setValueAtTime(4.0, now);

        const mouthFormant = ctx.createBiquadFilter();
        mouthFormant.type = 'bandpass';
        mouthFormant.frequency.setValueAtTime(760, now);
        mouthFormant.Q.setValueAtTime(2.8, now);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.02, now);
        masterGain.gain.linearRampToValueAtTime(0.75, now + 0.4); // Inhale gasp "Hhh"
        masterGain.gain.setValueAtTime(0.65, now + 1.2);          // Deep moan "Bruuuh"
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // Guttural drop "rgh"

        // Connect nodes
        osc.connect(throatFormant);
        noise.connect(mouthFormant);

        throatFormant.connect(masterGain);
        mouthFormant.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + 1.8);
        noise.stop(now + 1.8);
    }

    playSheepBaa() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(210, now + 0.7);

        lfo.frequency.setValueAtTime(9.5, now);
        lfoGain.gain.setValueAtTime(0.12, now);
        lfo.connect(gain.gain);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700, now);
        filter.Q.setValueAtTime(1.8, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.75);
        osc.stop(now + 0.75);
    }

    playPlayerHurt() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playStep() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);

        const bufferSize = Math.floor(ctx.sampleRate * 0.05);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(1.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
    }

    playBreak() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const bufferSize = Math.floor(ctx.sampleRate * 0.14);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.14);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
    }

    playPlace() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.1);

        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playHit() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}
