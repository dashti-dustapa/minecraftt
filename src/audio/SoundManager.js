/**
 * SoundManager.js
 * Master audio manager handling procedural Web Audio and local audio samples
 * for player actions, block manipulation, and mob reactions.
 */

export class SoundManager {
    constructor() {
        this.ctx = null;

        // Sheep voice variations (Say / Baa)
        this.sheepSaySounds = [
            'sounds/Sheep1.ogg',
            'sounds/Sheep2.ogg',
            'sounds/Sheep3.ogg'
        ].map(src => this.createAudioElement(src));

        // Sheep footstep sound variations
        this.sheepStepSounds = [
            'sounds/Sheep_step1.ogg.mp3',
            'sounds/Sheep_step2.ogg.mp3',
            'sounds/Sheep_step3.ogg.mp3',
            'sounds/Sheep_step4.ogg.mp3',
            'sounds/Sheep_step5.ogg.mp3'
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

    playAudioList(list, volume = 0.6, playbackRate = 1.0) {
        if (!list || list.length === 0) return false;
        const valid = list.filter(a => a && a.src);
        if (valid.length === 0) return false;

        const sound = valid[Math.floor(Math.random() * valid.length)].cloneNode();
        sound.volume = volume;
        sound.playbackRate = playbackRate;
        sound.play().catch(() => {});
        return true;
    }

    // ================= SHEEP SOUNDS =================

    playSheepBaa() {
        this.playAudioList(this.sheepSaySounds, 0.65, 1.0);
    }

    playSheepHurt() {
        // Play sheep voice with high pitch + impact punch
        this.playAudioList(this.sheepSaySounds, 0.85, 1.35);
        this.playHit();
    }

    playSheepStep() {
        this.playAudioList(this.sheepStepSounds, 0.35, 1.0);
    }

    // ================= ZOMBIE SOUNDS =================

    playZombieGroan() {
        this.playAudioList(this.zombieGroanSounds, 0.6);
    }

    playZombieHurt() {
        this.playAudioList(this.zombieHurtSounds, 0.7);
        this.playHit();
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

        gain.gain.setValueAtTime(0.65, now);
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
