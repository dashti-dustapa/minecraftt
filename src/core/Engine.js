/**
 * Engine.js
 * Master game engine coordinator: Three.js setup, celestial cycle, cross-platform inputs,
 * HUD/Survival stats, and inventory/crafting management.
 */

const THREE = window.THREE;

import { BLOCK_DEFS } from './Constants.js';
import { TextureManager } from '../textures/TextureManager.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Interaction } from '../player/Interaction.js';

export class Engine {
    constructor() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
        }

        this.initThree();
        this.initSystems();
        this.initInventory();
        this.initInputs();
        this.initHUD();

        this.prevTime = performance.now();
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.dayTime = 0.2;

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene = new THREE.Scene();
        this.skyColorDay = new THREE.Color(0x78a7ff);
        this.skyColorSunset = new THREE.Color(0xd66236);
        this.skyColorNight = new THREE.Color(0x0a0c18);
        this.skyColorWater = new THREE.Color(0x163470);

        this.scene.background = this.skyColorDay.clone();
        this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.018);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.scene.add(this.sunLight);

        // Sun & Moon
        this.celestialPivot = new THREE.Group();
        this.scene.add(this.celestialPivot);

        const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0xffffcc, side: THREE.DoubleSide }));
        sunMesh.position.set(0, 200, 0);
        sunMesh.rotation.x = Math.PI / 2;
        this.celestialPivot.add(sunMesh);

        const moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        moonMesh.position.set(0, -200, 0);
        moonMesh.rotation.x = -Math.PI / 2;
        this.celestialPivot.add(moonMesh);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initSystems() {
        this.textureManager = new TextureManager();
        this.world = new World(this.scene, this.textureManager);
        this.player = new Player(this.camera, this.world);
        this.interaction = new Interaction(this.scene, this.camera, this.world, this.textureManager);

        this.player.onDamage = () => {
            const flash = document.getElementById('damage-flash');
            flash.style.opacity = '1';
            setTimeout(() => { flash.style.opacity = '0'; }, 200);
        };

        this.player.onStatsChange = () => {
            this.renderHUD();
        };
    }

    initInventory() {
        this.selectedHotbarIndex = 0;
        this.hotbarItems = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.mainInventory = new Array(27).fill(null);
        this.mainInventory[0] = 9; // Oak Log
        this.mainInventory[1] = 9;
        this.mainInventory[2] = 4; // Oak Planks

        this.craftGrid = [null, null, null, null];
        this.craftOutput = null;
        this.isInventoryOpen = false;

        document.querySelectorAll('.hotbar-slot').forEach((slot, idx) => {
            slot.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.selectHotbarSlot(idx);
            });
        });

        document.getElementById('craft-out').addEventListener('click', () => {
            if (this.craftOutput !== null) {
                const freeSlot = this.mainInventory.indexOf(null);
                if (freeSlot !== -1) {
                    this.mainInventory[freeSlot] = this.craftOutput;
                    for (let c = 0; c < 4; c++) this.craftGrid[c] = null;
                    this.checkCraftingRecipe();
                }
            }
        });

        document.querySelectorAll('.craft-in').forEach(slot => {
            slot.addEventListener('click', () => {
                const idx = parseInt(slot.dataset.cslot);
                if (this.craftGrid[idx] !== null) {
                    const freeSlot = this.mainInventory.indexOf(null);
                    if (freeSlot !== -1) {
                        this.mainInventory[freeSlot] = this.craftGrid[idx];
                        this.craftGrid[idx] = null;
                        this.checkCraftingRecipe();
                    }
                }
            });
        });

        document.getElementById('btn-close-inv').addEventListener('click', () => this.toggleInventory());
        document.getElementById('btn-inv-mobile').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleInventory();
        });

        this.updateHeldBlock();
    }

    checkCraftingRecipe() {
        this.craftOutput = null;
        const filledCount = this.craftGrid.filter(x => x !== null).length;

        if (filledCount === 1 && this.craftGrid.includes(9)) {
            this.craftOutput = 4; // 1 Log -> 4 Planks
        } else if (filledCount === 4 && this.craftGrid.every(x => x === 4)) {
            this.craftOutput = 10; // 4 Planks -> 1 Crafting Table
        }
        this.renderInventoryUI();
    }

    renderInventoryUI() {
        document.querySelectorAll('.craft-in').forEach(slot => {
            const idx = parseInt(slot.dataset.cslot);
            const item = this.craftGrid[idx];
            slot.innerText = item !== null ? BLOCK_DEFS[item].name.split(' ')[0] : '';
        });

        const outSlot = document.getElementById('craft-out');
        outSlot.innerText = this.craftOutput !== null ? BLOCK_DEFS[this.craftOutput].name.split(' ')[0] : '';

        const mainGrid = document.getElementById('inv-main-grid');
        mainGrid.innerHTML = '';
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            const item = this.mainInventory[i];
            slot.innerText = item !== null ? BLOCK_DEFS[item].name.split(' ')[0] : '';
            slot.addEventListener('click', () => {
                if (item !== null) {
                    for (let c = 0; c < 4; c++) {
                        if (this.craftGrid[c] === null) {
                            this.craftGrid[c] = item;
                            this.mainInventory[i] = null;
                            this.checkCraftingRecipe();
                            break;
                        }
                    }
                }
            });
            mainGrid.appendChild(slot);
        }

        const hotGrid = document.getElementById('inv-hotbar-grid');
        hotGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            const item = this.hotbarItems[i];
            slot.innerText = item !== null ? BLOCK_DEFS[item].name.split(' ')[0] : '';
            slot.addEventListener('click', () => {
                if (item !== null) {
                    const freeIdx = this.mainInventory.indexOf(null);
                    if (freeIdx !== -1) {
                        this.mainInventory[freeIdx] = item;
                        this.hotbarItems[i] = null;
                        this.syncHotbarHUD();
                        this.renderInventoryUI();
                    }
                }
            });
            hotGrid.appendChild(slot);
        }
    }

    syncHotbarHUD() {
        document.querySelectorAll('#hotbar .hotbar-slot').forEach((slot, i) => {
            const item = this.hotbarItems[i];
            const keySpan = `<span class="slot-key">${i + 1}</span>`;
            slot.innerHTML = keySpan + (item !== null ? BLOCK_DEFS[item].name.split(' ')[0] : '');
        });
        this.updateHeldBlock();
    }

    selectHotbarSlot(idx) {
        this.selectedHotbarIndex = idx;
        document.querySelectorAll('.hotbar-slot').forEach((s, i) => {
            if (i === idx) s.classList.add('active');
            else s.classList.remove('active');
        });
        this.updateHeldBlock();
    }

    updateHeldBlock() {
        const blockId = this.hotbarItems[this.selectedHotbarIndex];
        this.interaction.setHeldItem(blockId);
        const name = blockId !== null ? BLOCK_DEFS[blockId].name : 'Empty';
        document.getElementById('debug-block').innerText = `Selected: ${name}`;
    }

    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        const invScreen = document.getElementById('inventory-screen');

        if (this.isInventoryOpen) {
            if (!this.isTouchDevice) document.exitPointerLock();
            invScreen.classList.remove('hidden');
            this.renderInventoryUI();
        } else {
            invScreen.classList.add('hidden');
            if (!this.isTouchDevice) this.canvas.requestPointerLock();
        }
    }

    initHUD() {
        this.renderHUD();
    }

    renderHUD() {
        const hBar = document.getElementById('health-bar');
        hBar.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const hVal = (i + 1) * 2;
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.innerText = this.player.health >= hVal ? '❤️' : (this.player.health >= hVal - 1 ? '💔' : '🖤');
            hBar.appendChild(heart);
        }

        const fBar = document.getElementById('hunger-bar');
        fBar.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const food = document.createElement('span');
            food.className = 'food';
            food.innerText = this.player.hunger >= (i + 1) * 2 ? '🍗' : '🦴';
            fBar.appendChild(food);
        }

        const bBar = document.getElementById('bubble-bar');
        bBar.innerHTML = '';
        if (this.player.headSubmerged) {
            bBar.style.display = 'flex';
            for (let i = 0; i < Math.ceil(this.player.oxygen / 2); i++) {
                const bubble = document.createElement('span');
                bubble.className = 'bubble';
                bubble.innerText = '🫧';
                bBar.appendChild(bubble);
            }
        } else {
            bBar.style.display = 'none';
        }
    }

    initInputs() {
        this.keys = {};
        this.isLocked = false;
        this.isGameRunning = false;

        const pauseScreen = document.getElementById('pause-screen');
        const playBtn = document.getElementById('btn-play');

        playBtn.addEventListener('click', () => {
            this.isGameRunning = true;
            pauseScreen.classList.add('hidden');
            if (!this.isTouchDevice) this.canvas.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (!this.isTouchDevice) {
                this.isLocked = document.pointerLockElement === this.canvas;
                if (this.isLocked) {
                    pauseScreen.classList.add('hidden');
                    this.isInventoryOpen = false;
                    document.getElementById('inventory-screen').classList.add('hidden');
                } else if (!this.isInventoryOpen) {
                    pauseScreen.classList.remove('hidden');
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked || this.isInventoryOpen || this.isTouchDevice) return;
            this.player.yaw -= e.movementX * 0.0022;
            this.player.pitch -= e.movementY * 0.0022;
            this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch));
        });

        // Mobile Camera Look Touch
        this.cameraTouchId = null;
        this.lastTouchX = 0;
        this.lastTouchY = 0;

        window.addEventListener('touchstart', (e) => {
            if (!this.isGameRunning || this.isInventoryOpen) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.clientX > window.innerWidth * 0.35 && this.cameraTouchId === null) {
                    this.cameraTouchId = t.identifier;
                    this.lastTouchX = t.clientX;
                    this.lastTouchY = t.clientY;
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!this.isGameRunning || this.isInventoryOpen) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === this.cameraTouchId) {
                    const dx = t.clientX - this.lastTouchX;
                    const dy = t.clientY - this.lastTouchY;
                    this.player.yaw -= dx * 0.004;
                    this.player.pitch -= dy * 0.004;
                    this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch));
                    this.lastTouchX = t.clientX;
                    this.lastTouchY = t.clientY;
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.cameraTouchId) {
                    this.cameraTouchId = null;
                }
            }
        });

        // Touch Virtual D-Pad
        const bindTouch = (id, key) => {
            const el = document.getElementById(id);
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
            el.addEventListener('touchcancel', (e) => { e.preventDefault(); this.keys[key] = false; });
        };

        bindTouch('btn-up', 'KeyW');
        bindTouch('btn-down', 'KeyS');
        bindTouch('btn-left', 'KeyA');
        bindTouch('btn-right', 'KeyD');
        bindTouch('btn-jump', 'Space');

        document.getElementById('btn-break').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleBreak();
        });

        document.getElementById('btn-place').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePlace();
        });

        // Desktop Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                this.toggleInventory();
                return;
            }
            if (this.isInventoryOpen) return;
            this.keys[e.code] = true;

            if (e.code.startsWith('Digit') && e.code !== 'Digit0') {
                const num = parseInt(e.code.replace('Digit', '')) - 1;
                if (num >= 0 && num < 9) this.selectHotbarSlot(num);
            }
        });

        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        window.addEventListener('wheel', (e) => {
            if (!this.isLocked || this.isInventoryOpen) return;
            if (e.deltaY > 0) this.selectHotbarSlot((this.selectedHotbarIndex + 1) % 9);
            else this.selectHotbarSlot((this.selectedHotbarIndex - 1 + 9) % 9);
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.isLocked || this.isInventoryOpen) return;
            if (e.button === 0) this.handleBreak();
            else if (e.button === 2) this.handlePlace();
        });

        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    handleBreak() {
        const removedTypeId = this.interaction.breakBlock();
        if (removedTypeId !== null) {
            const freeSlot = this.mainInventory.indexOf(null);
            if (freeSlot !== -1) this.mainInventory[freeSlot] = removedTypeId;
        }
    }

    handlePlace() {
        const blockId = this.hotbarItems[this.selectedHotbarIndex];
        if (blockId !== null) {
            this.interaction.placeBlock(blockId, this.player);
        }
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const delta = Math.min((time - this.prevTime) / 1000, 0.1);
        this.prevTime = time;

        // Day/Night celestial cycle
        this.dayTime = (this.dayTime + delta * 0.005) % 1.0;
        const sunAngle = this.dayTime * Math.PI * 2;
        this.celestialPivot.rotation.z = sunAngle;
        const sunHeight = Math.sin(sunAngle);

        document.getElementById('underwater-tint').style.display = this.player.headSubmerged ? 'block' : 'none';

        if (this.player.headSubmerged) {
            this.scene.background.lerp(this.skyColorWater, delta * 4);
            this.scene.fog.color.lerp(this.skyColorWater, delta * 4);
            this.scene.fog.density = 0.08;
        } else {
            this.scene.fog.density = 0.018;
            if (sunHeight > 0.2) {
                this.scene.background.lerp(this.skyColorDay, delta * 3);
                this.scene.fog.color.lerp(this.skyColorDay, delta * 3);
                this.ambientLight.intensity = 0.65;
                this.sunLight.intensity = 0.85;
                document.getElementById('debug-time').innerText = "Time: Day";
            } else if (sunHeight > -0.15) {
                this.scene.background.lerp(this.skyColorSunset, delta * 3);
                this.scene.fog.color.lerp(this.skyColorSunset, delta * 3);
                this.ambientLight.intensity = 0.45;
                this.sunLight.intensity = 0.45;
                document.getElementById('debug-time').innerText = "Time: Sunset";
            } else {
                this.scene.background.lerp(this.skyColorNight, delta * 3);
                this.scene.fog.color.lerp(this.skyColorNight, delta * 3);
                this.ambientLight.intensity = 0.22;
                this.sunLight.intensity = 0.12;
                document.getElementById('debug-time').innerText = "Time: Night";
            }
        }

        this.celestialPivot.position.copy(this.player.pos);
        this.sunLight.position.set(
            this.player.pos.x - Math.sin(sunAngle) * 60,
            this.player.pos.y + Math.cos(sunAngle) * 60,
            this.player.pos.z + 40
        );

        // FPS
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 1.0) {
            document.getElementById('debug-fps').innerText = `FPS: ${this.frameCount}`;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        const isActive = this.isTouchDevice ? (this.isGameRunning && !this.isInventoryOpen) : (this.isLocked && !this.isInventoryOpen);

        if (isActive) {
            const isMoving = this.player.update(delta, this.keys, !!this.keys['ShiftLeft'], !!this.keys['Space']);
            this.interaction.update(delta, isMoving, this.player.isGrounded);
        } else {
            this.interaction.selectionBox.visible = false;
        }

        document.getElementById('debug-pos').innerText =
            `XYZ: ${this.player.pos.x.toFixed(1)} / ${this.player.pos.y.toFixed(1)} / ${this.player.pos.z.toFixed(1)}`;

        this.renderer.render(this.scene, this.camera);
    }
}
