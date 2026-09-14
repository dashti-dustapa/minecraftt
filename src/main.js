/**
 * main.js
 * Application entry point.
 */

import { Engine } from './core/Engine.js';

window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new Engine();
});
