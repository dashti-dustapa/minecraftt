/**
 * SoundManager.js
 * Multi-track audio engine with official Minecraft OGG/MP3 files
 * and procedural fallback audio.
 */

export class SoundManager {
    constructor() {
        this.ctx = null;

        // Path to official sound assets
        this.zombieAudio = {
            idle: [
                './assets/sounds/Zombie_idle1.ogg',
                './assets/sounds/Zombie_idle2.ogg',
                './assets/sounds/Zombie_idle3.ogg'
            ],
            hurt: [
                './assets/sounds/Zombie_hurt1.ogg',
                './assets/sounds/Zombie_hurt2.ogg'
            ],
            death: [
                './assets/sounds/Zombie_death.ogg'
            ]
        };
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

    playAudioFile(list, volume = 0.75) {
        if (!list || list.length === 0) return;
        const randomSrc = list[Math.floor(Math.random() * list.length)];
        const audio = new Audio(randomSrc);
        audio.volume = volume;
        audio.play().catch(() => {
            // Falls back to procedural audio if local file is missing
            this.playProceduralGroan();
        });
    }

    playZombieGroan() {
        this.playAudioFile(this.zombieAudio.idle, 0.7);
    }

    playZombieHurt() {
        this.playAudioFile(this.zombieAudio.hurt, 0.85);
    }

    playZombieDeath() {
        this.playAudioFile(this.zombieAudio.death, 0.9);
    }

    playProceduralGroan() {
        const ctx = this.initContext();
        if (!ctx) return;
        const now = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(50, now + 1.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
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
