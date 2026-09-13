/**
 * main.js
 * Application Bootstrap
 */

import { Engine } from './core/Engine.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine();

    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            engine.input.requestLock();
        });
    }

    engine.start();
    console.log('Minecraft Engine Core booted successfully.');
});
