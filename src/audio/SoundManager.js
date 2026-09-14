/**
 * SoundManager.js
 * Audible procedural audio engine for footsteps, block breaking,
 * block placing, and combat hits using Web Audio API.
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isUnlocked = false;

        // Auto-unlock audio context on ANY user interaction
        const unlock = () => {
            this.initContext();
            if (this.ctx && this.ctx.state === 'running') {
                this.isUnlocked = true;
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('click', unlock);
            }
        };

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('click', unlock);
    }

    initContext() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.warn('Web Audio initialization error:', e);
        }
    }

    playStep() {
        this.initContext();
        if (!this.ctx || this.ctx.state !== 'running') return;

        const now = this.ctx.currentTime;

        // Crisp grass crunchy noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(850, now);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playBreak() {
        this.initContext();
        if (!this.ctx || this.ctx.state !== 'running') return;

        const now = this.ctx.currentTime;

        // Punchy block break crack
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playPlace() {
        this.initContext();
        if (!this.ctx || this.ctx.state !== 'running') return;

        const now = this.ctx.currentTime;

        // Deep woody pop tone for placing blocks
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playHit() {
        this.initContext();
        if (!this.ctx || this.ctx.state !== 'running') return;

        const now = this.ctx.currentTime;

        // Sharp hit impact tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    }
}
