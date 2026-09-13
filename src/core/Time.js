/**
 * Time.js
 * High-precision game loop timing, delta smoothing, and fixed-step ticker.
 */

import { FIXED_TIME_STEP } from './Constants.js';

export class Time {
    constructor() {
        this.start = performance.now();
        this.current = this.start;
        this.previous = this.start;
        this.delta = 0;
        this.elapsed = 0;

        this.accumulator = 0;
        this.fixedDelta = FIXED_TIME_STEP;
        this.tickCount = 0;

        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
    }

    update(timestamp) {
        this.current = timestamp;
        
        let rawDelta = (this.current - this.previous) / 1000;
        this.previous = this.current;

        this.delta = Math.min(rawDelta, 0.1);
        this.elapsed = (this.current - this.start) / 1000;

        this.accumulator += this.delta;

        this.frameCount++;
        this.fpsTimer += this.delta;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer -= 1.0;
        }
    }

    shouldTick() {
        if (this.accumulator >= this.fixedDelta) {
            this.accumulator -= this.fixedDelta;
            this.tickCount++;
            return true;
        }
        return false;
    }
}
