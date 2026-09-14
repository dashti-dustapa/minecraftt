/**
 * SoundManager.js
 * Hybrid audio engine supporting procedural Web Audio synthesizer fallbacks
 * and external audio samples (zombies, sheep footsteps, baas, block interactions).
 */

export class SoundManager {
    constructor() {
        this.ctx = null;

        // Sheep voice variations (Say / Baa)
        this.sheepSaySounds = [
            'sounds/Sheep1.ogg',
            'sounds/Sheep2.ogg',
            'sounds/Sheep3.ogg',
            'sounds/sheep1.ogg',
            'sounds/sheep2.ogg',
            'sounds/sheep3.ogg'
        ].map(src => this.createAudioElement(src));

        // Sheep footstep sound variations
        this.sheepStepSounds = [
            'sounds/Sheep_step1.ogg.mp3',
            'sounds/Sheep_step2.ogg.mp3',
            'sounds/Sheep_step3.ogg.mp3',
            'sounds/Sheep_step4.ogg.mp3',
            'sounds/Sheep_step5.ogg.mp3',
            'sounds/Sheep_step1.ogg',
            'sounds/Sheep_step2.ogg',
            'sounds/Sheep_step3.ogg',
            'sounds/Sheep_step4.ogg',
            'sounds/Sheep_step5.ogg'
        ].map(src => this.createAudioElement(src));

        // Sheep hurt audio fallback elements
        this.sheepHurtSounds = [
            'sounds/sheep_hurt.ogg',
            'sounds/sheep_hurt1.ogg',
            'sounds/sheep_hurt.mp3'
        ].map(src => this.createAudioElement(src));

        // Zombie sounds
        this.zombieGroanSounds = [
            'sounds/zombie_say1.ogg',
            'sounds/zombie_say2.ogg',
            'sounds/zombie_say3.ogg'
        ].map(src => this.createAudioElement(src));

        this.zombieHurtSounds = [
            'sounds/zombie_hurt1.ogg',
            'sounds/zombie_hurt2.ogg'
        ].map(src => this.createAudioElement(src));
    }

    createAudioElement(src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        return audio;
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    playAudioList(list, volume = 0.6) {
        if (!list || list.length === 0) return false;
        const validElements = list.filter(a => a && a.src);
        if (validElements.length === 0) return false;

        const sound = validElements[Math.floor(Math.random() * validElements.length)].cloneNode();
        sound.volume = volume;
        sound.play().catch(() => {});
        return true;
    }

    // ================= SHEEP SOUNDS =================

    playSheepBaa() {
        if (this.playAudioList(this.sheepSaySounds, 0.65)) return;

        // Procedural Synthesizer Fallback if audio files fail to load
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.7);

        lfo.frequency.setValueAtTime(11, now);
        lfoGain.gain.setValueAtTime(0.18, now);
        lfo.connect(gain.gain);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(2.2, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.75);
        osc.stop(now + 0.75);
    }

    playSheepHurt() {
        if (this.playAudioList(this.sheepHurtSounds, 0.7)) return;

        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime + 0.005;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.22);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playSheepStep() {
        if (this.playAudioList(this.sheepStepSounds, 0.35)) return;

        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // ================= ZOMBIE SOUNDS =================

    playZombieGroan() {
        if (this.playAudioList(this.zombieGroanSounds, 0.6)) return;

        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.8);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
    }

    playZombieHurt() {
        if (this.playAudioList(this.zombieHurtSounds, 0.7)) return;

        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    // ================= PLAYER & ENVIRONMENT INTERACTIONS =================

    playStep() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    playBreak() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    }

    playPlace() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    playHit() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    playSplash() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(1.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    }
}
