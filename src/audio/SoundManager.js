/**
 * SoundManager.js
 * High-performance sound manager loading official Minecraft audio files
 * for Sheep (Say, Step) and Zombies (Idle, Hurt, Death) with zero synthesizer noise.
 */

export class SoundManager {
    constructor() {
        this.ctx = null;

        // Sheep official audio files
        this.sheepSaySounds = [
            'sounds/Sheep1.ogg',
            'sounds/Sheep2.ogg',
            'sounds/Sheep3.ogg'
        ].map(src => this.createAudioElement(src));

        this.sheepStepSounds = [
            'sounds/Sheep_step1.ogg.mp3',
            'sounds/Sheep_step2.ogg.mp3',
            'sounds/Sheep_step3.ogg.mp3',
            'sounds/Sheep_step4.ogg.mp3',
            'sounds/Sheep_step5.ogg.mp3'
        ].map(src => this.createAudioElement(src));

        // Zombie official uploaded audio files (exact case-sensitive paths)
        this.zombieIdleSounds = [
            'sounds/Zombie_idle1.ogg',
            'sounds/Zombie_idle2.ogg',
            'sounds/Zombie_idle3.ogg'
        ].map(src => this.createAudioElement(src));

        this.zombieHurtSounds = [
            'sounds/Zombie_hurt1.ogg',
            'sounds/Zombie_hurt2.ogg'
        ].map(src => this.createAudioElement(src));

        this.zombieDeathSounds = [
            'sounds/Zombie_death.ogg'
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
        const valid = list.filter(a => a && a.src);
        if (valid.length === 0) return false;

        try {
            const sound = valid[Math.floor(Math.random() * valid.length)].cloneNode();
            sound.volume = volume;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
            return true;
        } catch {
            return false;
        }
    }

    // ================= SHEEP SOUNDS =================

    playSheepBaa() {
        this.playAudioList(this.sheepSaySounds, 0.65);
    }

    playSheepHurt() {
        this.playAudioList(this.sheepSaySounds, 0.85);
        this.playHit();
    }

    playSheepStep() {
        this.playAudioList(this.sheepStepSounds, 0.3);
    }

    // ================= OFFICIAL ZOMBIE SOUNDS =================

    playZombieGroan() {
        this.playAudioList(this.zombieIdleSounds, 0.7);
    }

    playZombieHurt() {
        this.playAudioList(this.zombieHurtSounds, 0.8);
    }

    playZombieDeath() {
        this.playAudioList(this.zombieDeathSounds, 0.85);
    }

    // ================= INTERACTIONS =================

    playHit() {
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

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

        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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
}
