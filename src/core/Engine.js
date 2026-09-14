/**
 * Engine.js
 * Master game engine coordinator with procedural Web Audio,
 * responsive Minecraft UI/inventory modals, robust break/place interactions,
 * and mob management.
 */

import * as THREE from 'three';

import { BLOCK, BLOCK_DEFS } from './Constants.js';
import { TextureManager } from '../textures/TextureManager.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Interaction } from '../player/Interaction.js';
import { MobManager } from '../entities/MobManager.js';
import { SaveManager } from '../storage/SaveManager.js';
import { SoundManager } from '../audio/SoundManager.js';
import { ParticleManager } from '../effects/ParticleManager.js';

export class Engine {
    constructor() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
        }

        this.soundManager = new SoundManager();
        this.stepTimer = 0;
        this.torchLights = new Map();

        this.initThree();
        this.initEnvironment();
        this.initSystems();
        this.initDeathScreen();
        this.initInventoryAndCrafting();
        this.initInputs();
        this.initHUD();

        this.saveManager.loadGame(this.world, this.player, this);
        this.syncHotbarHUD();
        this.renderHUD();

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

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.85);
        this.scene.add(this.sunLight);

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

    initEnvironment() {
        this.cloudsGroup = new THREE.Group();
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.65,
            depthWrite: false
        });

        const cloudGeom = new THREE.BoxGeometry(8, 2, 8);
        for (let x = -40; x <= 40; x += 10) {
            for (let z = -40; z <= 40; z += 10) {
                if (Math.random() > 0.35) {
                    const cMesh = new THREE.Mesh(cloudGeom, cloudMat);
                    cMesh.position.set(x + (Math.random() * 4), 28, z + (Math.random() * 4));
                    cMesh.scale.set(1 + Math.random() * 0.8, 1, 1 + Math.random() * 0.8);
                    this.cloudsGroup.add(cMesh);
                }
            }
        }
        this.scene.add(this.cloudsGroup);

        const starCount = 350;
        const starGeom = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 240;

            starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i + 1] = Math.abs(r * Math.cos(phi));
            starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
        }

        starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        this.starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.8,
            transparent: true,
            opacity: 0.0
        });
        this.starField = new THREE.Points(starGeom, this.starMaterial);
        this.scene.add(this.starField);
    }

    initSystems() {
        this.textureManager = new TextureManager();
        this.world = new World(this.scene, this.textureManager);
        this.player = new Player(this.camera, this.world);

        if (!this.player.pos) this.player.pos = this.player.position || this.camera.position;
        if (!this.player.position) this.player.position = this.player.pos;

        this.particleManager = new ParticleManager(this.scene);
        this.interaction = new Interaction(this.scene, this.camera, this.world, this.textureManager);
        this.mobManager = new MobManager(this.scene, this.world, this.player, this.soundManager);
        this.saveManager = new SaveManager();

        this.player.onDamage = () => {
            const flash = document.getElementById('damage-flash');
            if (flash) {
                flash.style.opacity = '1';
                setTimeout(() => { flash.style.opacity = '0'; }, 200);
            }
        };

        this.player.onStatsChange = () => {
            this.renderHUD();
        };

        this.player.onDeath = () => {
            if (!this.isTouchDevice && document.pointerLockElement) document.exitPointerLock();
            if (this.deathScreenEl) {
                this.deathScreenEl.style.display = 'flex';
            }
        };
    }

    initDeathScreen() {
        let deathEl = document.getElementById('death-screen');
        if (!deathEl) {
            deathEl = document.createElement('div');
            deathEl.id = 'death-screen';
            deathEl.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(140, 0, 0, 0.75); display: none; flex-direction: column;
                justify-content: center; align-items: center; z-index: 99999;
                font-family: 'Minecraft', monospace, sans-serif; text-shadow: 2px 2px #000;
            `;
            deathEl.innerHTML = `
                <h1 style="color:#ffffff; font-size:42px; margin-bottom:15px;">You Died!</h1>
                <p style="color:#e0e0e0; font-size:16px; margin-bottom:25px;">You succumbed to the dark...</p>
                <button id="btn-respawn" style="
                    padding: 12px 28px; font-size: 18px; font-weight: bold; background: #2e7d32;
                    color: white; border: 2px solid #ffffff; cursor: pointer; border-radius: 4px;
                ">Respawn</button>
            `;
            document.body.appendChild(deathEl);
        }
        this.deathScreenEl = deathEl;

        const respawnBtn = document.getElementById('btn-respawn');
        if (respawnBtn) {
            respawnBtn.addEventListener('click', () => {
                this.player.respawn();
                this.deathScreenEl.style.display = 'none';
                this.renderHUD();
                if (!this.isTouchDevice) this.canvas.requestPointerLock();
            });
        }
    }

    getPlayerPosition() {
        return this.player.pos || this.player.position || this.camera.position;
    }

    getItemIconHTML(blockId, size = 22) {
        if (blockId === null || blockId === undefined) return '';
        const def = BLOCK_DEFS[blockId];
        const name = def ? def.name : '';
        if (this.textureManager && typeof this.textureManager.getItemIcon === 'function') {
            const iconUrl = this.textureManager.getItemIcon(blockId);
            if (iconUrl) {
                return `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;">
                        <img src="${iconUrl}" style="width:${size}px;height:${size}px;image-rendering:pixelated;pointer-events:none;">
                        <span style="font-size:8px; color:#fff; text-shadow:1px 1px #000; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%;">${name}</span>
                    </div>
                `;
            }
        }
        return `<span style="font-size:9px; color:#fff;">${name}</span>`;
    }

    initInventoryAndCrafting() {
        this.selectedHotbarIndex = 0;
        this.hotbarItems = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.mainInventory = new Array(27).fill(null);
        this.mainInventory[0] = BLOCK.LOG;
        this.mainInventory[1] = BLOCK.LOG;
        this.mainInventory[2] = BLOCK.CRAFTING_TABLE;

        this.craftGrid2x2 = [null, null, null, null];
        this.craftOutput2x2 = null;

        this.craftGrid3x3 = new Array(9).fill(null);
        this.craftOutput3x3 = null;

        this.activeModal = null;

        document.querySelectorAll('.hotbar-slot').forEach((slot, idx) => {
            slot.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.selectHotbarSlot(idx);
            });
        });

        const out2x2 = document.getElementById('craft-out-2x2');
        if (out2x2) {
            out2x2.addEventListener('click', () => {
                if (this.craftOutput2x2 !== null) {
                    const freeSlot = this.mainInventory.indexOf(null);
                    if (freeSlot !== -1) {
                        this.mainInventory[freeSlot] = this.craftOutput2x2;
                        for (let c = 0; c < 4; c++) this.craftGrid2x2[c] = null;
                        this.checkCrafting2x2();
                        this.soundManager.playPlace();
                        this.saveManager.saveGame(this.player, this);
                    }
                }
            });
        }

        document.querySelectorAll('.craft-in-2x2').forEach(slot => {
            slot.addEventListener('click', () => {
                const idx = parseInt(slot.dataset.cslot);
                if (this.craftGrid2x2[idx] !== null) {
                    const freeSlot = this.mainInventory.indexOf(null);
                    if (freeSlot !== -1) {
                        this.mainInventory[freeSlot] = this.craftGrid2x2[idx];
                        this.craftGrid2x2[idx] = null;
                        this.checkCrafting2x2();
                    }
                }
            });
        });

        const out3x3 = document.getElementById('craft-out-3x3');
        if (out3x3) {
            out3x3.addEventListener('click', () => {
                if (this.craftOutput3x3 !== null) {
                    const freeSlot = this.mainInventory.indexOf(null);
                    if (freeSlot !== -1) {
                        this.mainInventory[freeSlot] = this.craftOutput3x3;
                        for (let c = 0; c < 9; c++) this.craftGrid3x3[c] = null;
                        this.checkCrafting3x3();
                        this.soundManager.playPlace();
                        this.saveManager.saveGame(this.player, this);
                    }
                }
            });
        }

        document.querySelectorAll('.craft-in-3x3').forEach(slot => {
            slot.addEventListener('click', () => {
                const idx = parseInt(slot.dataset.tslot);
                if (this.craftGrid3x3[idx] !== null) {
                    const freeSlot = this.mainInventory.indexOf(null);
                    if (freeSlot !== -1) {
                        this.mainInventory[freeSlot] = this.craftGrid3x3[idx];
                        this.craftGrid3x3[idx] = null;
                        this.checkCrafting3x3();
                    }
                }
            });
        });

        const closeInv = document.getElementById('btn-close-inv');
        if (closeInv) closeInv.addEventListener('click', () => this.closeModals());

        const closeTable = document.getElementById('btn-close-table');
        if (closeTable) closeTable.addEventListener('click', () => this.closeModals());

        const btnInvMobile = document.getElementById('btn-inv-mobile');
        if (btnInvMobile) {
            btnInvMobile.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleInventory2x2();
            });
        }

        this.updateHeldBlock();
    }

    checkCrafting2x2() {
        this.craftOutput2x2 = null;
        const filled = this.craftGrid2x2.filter(x => x !== null).length;

        if (filled === 1 && this.craftGrid2x2.includes(BLOCK.LOG)) {
            this.craftOutput2x2 = BLOCK.PLANK;
        } else if (filled === 4 && this.craftGrid2x2.every(x => x === BLOCK.PLANK)) {
            this.craftOutput2x2 = BLOCK.CRAFTING_TABLE;
        } else if (
            (this.craftGrid2x2[0] === BLOCK.PLANK && this.craftGrid2x2[2] === BLOCK.PLANK && !this.craftGrid2x2[1] && !this.craftGrid2x2[3]) ||
            (this.craftGrid2x2[1] === BLOCK.PLANK && this.craftGrid2x2[3] === BLOCK.PLANK && !this.craftGrid2x2[0] && !this.craftGrid2x2[2])
        ) {
            this.craftOutput2x2 = BLOCK.STICK;
        }

        this.render2x2UI();
    }

    checkCrafting3x3() {
        this.craftOutput3x3 = null;
        const g = this.craftGrid3x3;
        const filled = g.filter(x => x !== null).length;

        if (filled === 1 && g.includes(BLOCK.LOG)) {
            this.craftOutput3x3 = BLOCK.PLANK;
        } else if (filled === 2 && (
            (g[0] === BLOCK.PLANK && g[3] === BLOCK.PLANK) ||
            (g[1] === BLOCK.PLANK && g[4] === BLOCK.PLANK) ||
            (g[3] === BLOCK.PLANK && g[6] === BLOCK.PLANK) ||
            (g[4] === BLOCK.PLANK && g[7] === BLOCK.PLANK)
        )) {
            this.craftOutput3x3 = BLOCK.STICK;
        } else if (
            g[0] === BLOCK.PLANK && g[1] === BLOCK.PLANK && g[2] === BLOCK.PLANK &&
            g[4] === BLOCK.STICK && g[7] === BLOCK.STICK && filled === 5
        ) {
            this.craftOutput3x3 = BLOCK.WOOD_PICKAXE;
        } else if (
            g[1] === BLOCK.PLANK && g[4] === BLOCK.PLANK && g[7] === BLOCK.STICK && filled === 3
        ) {
            this.craftOutput3x3 = BLOCK.WOOD_SWORD;
        } else if (
            g[1] === BLOCK.DIAMOND && g[4] === BLOCK.DIAMOND && g[7] === BLOCK.STICK && filled === 3
        ) {
            this.craftOutput3x3 = BLOCK.DIAMOND_SWORD;
        }

        this.render3x3UI();
    }

    render2x2UI() {
        document.querySelectorAll('.craft-in-2x2').forEach(slot => {
            const idx = parseInt(slot.dataset.cslot);
            const item = this.craftGrid2x2[idx];
            slot.innerHTML = this.getItemIconHTML(item, 24);
        });

        const out = document.getElementById('craft-out-2x2');
        if (out) out.innerHTML = this.getItemIconHTML(this.craftOutput2x2, 28);

        this.renderInventoryGrid('inv-main-grid-2x2', 'inv-hotbar-grid-2x2', (item, i) => {
            for (let c = 0; c < 4; c++) {
                if (this.craftGrid2x2[c] === null) {
                    this.craftGrid2x2[c] = item;
                    this.mainInventory[i] = null;
                    this.checkCrafting2x2();
                    break;
                }
            }
        });
    }

    render3x3UI() {
        document.querySelectorAll('.craft-in-3x3').forEach(slot => {
            const idx = parseInt(slot.dataset.tslot);
            const item = this.craftGrid3x3[idx];
            slot.innerHTML = this.getItemIconHTML(item, 24);
        });

        const out = document.getElementById('craft-out-3x3');
        if (out) out.innerHTML = this.getItemIconHTML(this.craftOutput3x3, 28);

        this.renderInventoryGrid('inv-main-grid-3x3', 'inv-hotbar-grid-3x3', (item, i) => {
            for (let c = 0; c < 9; c++) {
                if (this.craftGrid3x3[c] === null) {
                    this.craftGrid3x3[c] = item;
                    this.mainInventory[i] = null;
                    this.checkCrafting3x3();
                    break;
                }
            }
        });
    }

    renderInventoryGrid(mainId, hotbarId, onMainSlotClick) {
        const mainGrid = document.getElementById(mainId);
        if (mainGrid) {
            mainGrid.innerHTML = '';
            for (let i = 0; i < 27; i++) {
                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                const item = this.mainInventory[i];
                slot.innerHTML = this.getItemIconHTML(item, 24);
                slot.addEventListener('click', () => {
                    if (item !== null) onMainSlotClick(item, i);
                });
                mainGrid.appendChild(slot);
            }
        }

        const hotGrid = document.getElementById(hotbarId);
        if (hotGrid) {
            hotGrid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                const item = this.hotbarItems[i];
                slot.innerHTML = this.getItemIconHTML(item, 24);
                slot.addEventListener('click', () => {
                    if (item !== null) {
                        const freeIdx = this.mainInventory.indexOf(null);
                        if (freeIdx !== -1) {
                            this.mainInventory[freeIdx] = item;
                            this.hotbarItems[i] = null;
                            this.syncHotbarHUD();
                            if (this.activeModal === 'inv') this.render2x2UI();
                            if (this.activeModal === 'table') this.render3x3UI();
                        }
                    }
                });
                hotGrid.appendChild(slot);
            }
        }
    }

    syncHotbarHUD() {
        document.querySelectorAll('#hotbar .hotbar-slot').forEach((slot, i) => {
            const item = this.hotbarItems[i];
            const keySpan = `<span class="slot-key">${i + 1}</span>`;
            const iconHtml = this.getItemIconHTML(item, 28);
            slot.innerHTML = keySpan + iconHtml;
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
        if (this.interaction && typeof this.interaction.setHeldItem === 'function') {
            this.interaction.setHeldItem(blockId);
        }
        const name = (blockId !== null && BLOCK_DEFS[blockId]) ? BLOCK_DEFS[blockId].name : 'Empty';
        const debugEl = document.getElementById('debug-block');
        if (debugEl) debugEl.innerText = `Selected: ${name}`;
    }

    toggleInventory2x2() {
        if (this.player.isDead) return;
        if (this.activeModal === 'inv') {
            this.closeModals();
        } else {
            this.closeModals();
            this.activeModal = 'inv';
            if (!this.isTouchDevice && document.pointerLockElement) {
                document.exitPointerLock();
            }
            const invEl = document.getElementById('inventory-screen');
            if (invEl) {
                invEl.classList.remove('hidden');
                invEl.style.display = 'flex';
            }
            this.render2x2UI();
        }
    }

    openCraftingTable3x3() {
        if (this.player.isDead) return;
        this.closeModals();
        this.activeModal = 'table';
        if (!this.isTouchDevice && document.pointerLockElement) {
            document.exitPointerLock();
        }
        const tableEl = document.getElementById('crafting-table-screen');
        if (tableEl) {
            tableEl.classList.remove('hidden');
            tableEl.style.display = 'flex';
        }
        this.render3x3UI();
    }

    closeModals() {
        this.activeModal = null;
        const invEl = document.getElementById('inventory-screen');
        if (invEl) {
            invEl.classList.add('hidden');
            invEl.style.display = 'none';
        }
        const tableEl = document.getElementById('crafting-table-screen');
        if (tableEl) {
            tableEl.classList.add('hidden');
            tableEl.style.display = 'none';
        }
        if (!this.isTouchDevice && !this.player.isDead && this.isGameRunning) {
            this.canvas.requestPointerLock();
        }
        this.saveManager.saveGame(this.player, this);
    }

    initHUD() {
        this.renderHUD();
    }

    renderHUD() {
        const hBar = document.getElementById('health-bar');
        if (hBar) {
            hBar.innerHTML = '';
            const hp = this.player.health ?? 20;
            for (let i = 0; i < 10; i++) {
                const hVal = (i + 1) * 2;
                const heart = document.createElement('span');
                heart.className = 'heart';
                heart.innerText = hp >= hVal ? '❤️' : (hp >= hVal - 1 ? '💔' : '🖤');
                hBar.appendChild(heart);
            }
        }

        const fBar = document.getElementById('hunger-bar');
        if (fBar) {
            fBar.innerHTML = '';
            const foodVal = this.player.hunger ?? 20;
            for (let i = 0; i < 10; i++) {
                const food = document.createElement('span');
                food.className = 'food';
                food.innerText = foodVal >= (i + 1) * 2 ? '🍗' : '🦴';
                fBar.appendChild(food);
            }
        }

        const bBar = document.getElementById('bubble-bar');
        if (bBar) {
            bBar.innerHTML = '';
            if (this.player.headSubmerged) {
                bBar.style.display = 'flex';
                const ox = this.player.oxygen ?? 20;
                for (let i = 0; i < Math.ceil(ox / 2); i++) {
                    const bubble = document.createElement('span');
                    bubble.className = 'bubble';
                    bubble.innerText = '🫧';
                    bBar.appendChild(bubble);
                }
            } else {
                bBar.style.display = 'none';
            }
        }
    }

    initInputs() {
        this.keys = {};
        this.isLocked = false;
        this.isGameRunning = false;

        const pauseScreen = document.getElementById('pause-screen');
        const playBtn = document.getElementById('btn-play') || document.getElementById('btn-singleplayer');

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.soundManager.initContext();
                this.isGameRunning = true;
                if (pauseScreen) {
                    pauseScreen.classList.add('hidden');
                    pauseScreen.style.display = 'none';
                }
                this.canvas.requestPointerLock();
            });
        }

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = (document.pointerLockElement === this.canvas);
            if (this.isLocked) {
                this.soundManager.initContext();
                if (pauseScreen) pauseScreen.style.display = 'none';
                if (this.activeModal) this.closeModals();
            } else if (!this.activeModal && !this.player.isDead && this.isGameRunning) {
                if (pauseScreen) pauseScreen.style.display = 'flex';
            }
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isLocked && this.isGameRunning && !this.activeModal && !this.player.isDead) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked || this.activeModal || this.player.isDead) return;
            this.player.yaw -= e.movementX * 0.0024;
            this.player.pitch -= e.movementY * 0.0024;
            this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch));
        });

        window.addEventListener('mousedown', (e) => {
            this.soundManager.initContext();
            if (this.activeModal || this.player.isDead) return;

            if (!this.isLocked && !this.isTouchDevice) {
                this.canvas.requestPointerLock();
                return;
            }

            if (e.button === 0) {
                this.handleAttackOrBreak();
            } else if (e.button === 2) {
                this.handlePlaceOrInteract();
            }
        });

        window.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            if (this.player.isDead) return;

            if (e.code === 'KeyE') {
                e.preventDefault();
                this.toggleInventory2x2();
                return;
            }

            if (e.code === 'Escape') {
                if (this.activeModal) {
                    e.preventDefault();
                    this.closeModals();
                    return;
                }
            }

            if (this.activeModal) return;

            this.keys[e.code] = true;

            if (e.code.startsWith('Digit') && e.code !== 'Digit0') {
                const num = parseInt(e.code.replace('Digit', '')) - 1;
                if (num >= 0 && num < 9) this.selectHotbarSlot(num);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('wheel', (e) => {
            if (!this.isLocked || this.activeModal || this.player.isDead) return;
            if (e.deltaY > 0) this.selectHotbarSlot((this.selectedHotbarIndex + 1) % 9);
            else this.selectHotbarSlot((this.selectedHotbarIndex - 1 + 9) % 9);
        });
    }

    handleAttackOrBreak() {
        if (this.player.isDead) return;
        const heldId = this.hotbarItems[this.selectedHotbarIndex];
        const heldDef = (heldId !== null && BLOCK_DEFS[heldId]) ? BLOCK_DEFS[heldId] : BLOCK_DEFS[0];
        const weaponDamage = heldDef.attackDamage || 4;

        const raycaster = new THREE.Raycaster();
        raycaster.far = 4.5;
        raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

        if (this.mobManager) {
            const mobHits = raycaster.intersectObjects(this.mobManager.getHitMeshes(), false);
            if (mobHits.length > 0) {
                if (this.interaction && typeof this.interaction.triggerSwing === 'function') {
                    this.interaction.triggerSwing();
                }
                this.mobManager.hitMob(mobHits[0].object, this.getPlayerPosition(), weaponDamage);
                this.soundManager.playHit();
                return;
            }
        }

        if (this.interaction) {
            const targetHit = this.interaction.targetHit;
            const removedTypeId = this.interaction.breakBlock();
            if (removedTypeId !== null) {
                this.soundManager.playBreak();

                if (targetHit && targetHit.object && targetHit.object.userData) {
                    const pos = targetHit.object.userData;
                    if (pos.x !== undefined) {
                        const key = `${pos.x},${pos.y},${pos.z}`;
                        if (this.torchLights.has(key)) {
                            const light = this.torchLights.get(key);
                            this.scene.remove(light);
                            this.torchLights.delete(key);
                        }
                        this.saveManager.recordRemoval(pos.x, pos.y, pos.z);

                        if (this.particleManager) {
                            this.particleManager.spawnBreakParticles(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5, removedTypeId);
                        }
                    }
                }

                const freeSlot = this.mainInventory.indexOf(null);
                if (freeSlot !== -1) {
                    this.mainInventory[freeSlot] = removedTypeId;
                }
            }
        }
    }

    handlePlaceOrInteract() {
        if (this.player.isDead) return;

        if (this.interaction && this.interaction.targetHit) {
            const hitObj = this.interaction.targetHit.object;
            const hitBlockData = hitObj ? hitObj.userData : null;
            if (hitBlockData && hitBlockData.typeId === BLOCK.CRAFTING_TABLE) {
                this.openCraftingTable3x3();
                return;
            }
        }

        const blockId = this.hotbarItems[this.selectedHotbarIndex];
        if (blockId !== null && this.interaction && this.interaction.targetHit) {
            const bDef = BLOCK_DEFS[blockId];
            if (bDef && bDef.isItem) return;

            const hit = this.interaction.targetHit;
            const placed = this.interaction.placeBlock(blockId, this.player);
            if (placed) {
                this.soundManager.playPlace();

                if (hit && hit.face && hit.object && hit.object.userData) {
                    const normal = hit.face.normal;
                    const px = hit.object.userData.x + Math.round(normal.x);
                    const py = hit.object.userData.y + Math.round(normal.y);
                    const pz = hit.object.userData.z + Math.round(normal.z);

                    if (blockId === BLOCK.TORCH || blockId === 5) {
                        const torchLight = new THREE.PointLight(0xffa333, 1.8, 14, 1.2);
                        torchLight.position.set(px + 0.5, py + 0.7, pz + 0.5);
                        this.scene.add(torchLight);
                        this.torchLights.set(`${px},${py},${pz}`, torchLight);
                    }

                    this.saveManager.recordPlacement(px, py, pz, blockId);
                }
            }
        }
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const delta = Math.min((time - this.prevTime) / 1000, 0.1);
        this.prevTime = time;

        const playerPos = this.getPlayerPosition();

        if (this.cloudsGroup) {
            this.cloudsGroup.position.x = (this.cloudsGroup.position.x + delta * 1.2) % 60;
        }

        this.torchLights.forEach(light => {
            light.intensity = 1.6 + (Math.random() * 0.35);
        });

        this.dayTime = (this.dayTime + delta * 0.005) % 1.0;
        const sunAngle = this.dayTime * Math.PI * 2;
        this.celestialPivot.rotation.z = sunAngle;
        const sunHeight = Math.sin(sunAngle);

        const underTint = document.getElementById('underwater-tint');
        if (underTint) {
            underTint.style.display = this.player.headSubmerged ? 'block' : 'none';
        }

        if (this.player.headSubmerged) {
            this.scene.background.lerp(this.skyColorWater, delta * 4);
            this.scene.fog.color.lerp(this.skyColorWater, delta * 4);
            this.scene.fog.density = 0.08;
            if (this.starMaterial) this.starMaterial.opacity = 0;
        } else {
            this.scene.fog.density = 0.018;
            if (sunHeight > 0.2) {
                this.scene.background.lerp(this.skyColorDay, delta * 3);
                this.scene.fog.color.lerp(this.skyColorDay, delta * 3);
                this.ambientLight.intensity = 0.65;
                this.sunLight.intensity = 0.85;
                if (this.starMaterial) this.starMaterial.opacity = 0;
                const dbgTime = document.getElementById('debug-time');
                if (dbgTime) dbgTime.innerText = "Time: Day";
            } else if (sunHeight > -0.15) {
                this.scene.background.lerp(this.skyColorSunset, delta * 3);
                this.scene.fog.color.lerp(this.skyColorSunset, delta * 3);
                this.ambientLight.intensity = 0.45;
                this.sunLight.intensity = 0.45;
                if (this.starMaterial) this.starMaterial.opacity = 0.3;
                const dbgTime = document.getElementById('debug-time');
                if (dbgTime) dbgTime.innerText = "Time: Sunset";
            } else {
                this.scene.background.lerp(this.skyColorNight, delta * 3);
                this.scene.fog.color.lerp(this.skyColorNight, delta * 3);
                this.ambientLight.intensity = 0.22;
                this.sunLight.intensity = 0.12;
                if (this.starMaterial) this.starMaterial.opacity = 0.85;
                const dbgTime = document.getElementById('debug-time');
                if (dbgTime) dbgTime.innerText = "Time: Night (Monsters Active)";
            }
        }

        if (playerPos) {
            this.celestialPivot.position.copy(playerPos);
            if (this.starField) this.starField.position.copy(playerPos);
            this.sunLight.position.set(
                playerPos.x - Math.sin(sunAngle) * 60,
                playerPos.y + Math.cos(sunAngle) * 60,
                playerPos.z + 40
            );
        }

        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 1.0) {
            const dbgFps = document.getElementById('debug-fps');
            if (dbgFps) dbgFps.innerText = `FPS: ${this.frameCount}`;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        const isActive = this.isTouchDevice ? (this.isGameRunning && !this.activeModal) : (this.isLocked && !this.activeModal);

        if (isActive || this.player.isDead) {
            try {
                const isMoving = this.player.update(delta, this.keys, !!this.keys['ShiftLeft'], !!this.keys['Space']);

                if (isMoving && Math.abs(this.player.velocity.y) < 1.0 && !this.player.isDead) {
                    this.stepTimer += delta;
                    if (this.stepTimer >= 0.34) {
                        this.stepTimer = 0;
                        this.soundManager.playStep();
                    }
                } else {
                    this.stepTimer = 0.28;
                }

                if (this.interaction) this.interaction.update(delta, isMoving, this.player.isGrounded);
                if (this.mobManager) this.mobManager.update(delta, this.dayTime);
                if (this.saveManager) this.saveManager.update(delta, this.player, this);
            } catch (err) {
                console.warn('Physics loop error:', err);
            }
        } else if (this.interaction) {
            this.interaction.selectionBox.visible = false;
        }

        if (this.particleManager) {
            this.particleManager.update(delta);
        }

        if (playerPos) {
            const dbgPos = document.getElementById('debug-pos');
            if (dbgPos) {
                dbgPos.innerText = `XYZ: ${playerPos.x.toFixed(1)} / ${playerPos.y.toFixed(1)} / ${playerPos.z.toFixed(1)}`;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
