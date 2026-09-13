/**
 * Engine.js
 * Core Three.js initialization, viewport manager, and master execution loop.
 */

import * as THREE from 'three';
import { Time } from './Time.js';
import { Input } from './Input.js';
import { Player } from '../player/Player.js';
import { Interaction } from '../player/Interaction.js';
import { TextureManager } from '../textures/TextureManager.js';
import { Chunk } from '../world/Chunk.js';

export class Engine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.pauseScreen = document.getElementById('pause-screen');

        this.time = new Time();
        this.input = new Input(this.canvas, this.pauseScreen);
        this.textureManager = new TextureManager();

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.interaction = null;
        this.chunks = [];

        this.updateHooks = [];
        this.tickHooks = [];

        this.initThree();
        this.initWorld();
        this.initPlayer();
        this.initInteraction();
        this.initEvents();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x78a7ff);
        this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.015);

        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.75);
        sunLight.position.set(50, 100, 50);
        this.scene.add(sunLight);
    }

    initWorld() {
        for (let cx = 0; cx < 2; cx++) {
            for (let cz = 0; cz < 2; cz++) {
                const chunk = new Chunk(cx, cz, this.textureManager);
                this.chunks.push(chunk);
                this.scene.add(chunk.meshGroup);
            }
        }
    }

    initPlayer() {
        this.player = new Player(this.camera, this.input, this.scene);
        this.player.position.set(8, 14, 8);
        this.addUpdateHook((delta) => this.player.update(delta));
    }

    initInteraction() {
        this.interaction = new Interaction(this.camera, this.scene, this.input, this.chunks);
        this.addUpdateHook(() => this.interaction.update());
    }

    initEvents() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    addUpdateHook(callback) {
        this.updateHooks.push(callback);
    }

    addTickHook(callback) {
        this.tickHooks.push(callback);
    }

    start() {
        const loop = (timestamp) => {
            this.time.update(timestamp);

            while (this.time.shouldTick()) {
                for (let i = 0; i < this.tickHooks.length; i++) {
                    this.tickHooks[i]();
                }
            }

            for (let i = 0; i < this.updateHooks.length; i++) {
                this.updateHooks[i](this.time.delta);
            }

            this.renderer.render(this.scene, this.camera);
            this.updateDebugUI();

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    updateDebugUI() {
        const fpsElem = document.getElementById('debug-fps');
        if (fpsElem) {
            fpsElem.innerText = `FPS: ${this.time.fps}`;
        }
    }
}
