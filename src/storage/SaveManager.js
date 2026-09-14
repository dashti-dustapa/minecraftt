/**
 * SaveManager.js
 * Safe LocalStorage persistence for world deltas and player states.
 */

export class SaveManager {
    constructor(storageKey = 'minecraft_web_save') {
        this.storageKey = storageKey;
        this.modifications = { placed: [], removed: [] };
        this.autoSaveInterval = 15;
        this.timer = 0;
    }

    recordPlacement(x, y, z, typeId) {
        const key = `${x},${y},${z}`;
        this.modifications.removed = this.modifications.removed.filter(k => k !== key);
        const idx = this.modifications.placed.findIndex(b => b.x === x && b.y === y && b.z === z);
        if (idx !== -1) {
            this.modifications.placed[idx].typeId = typeId;
        } else {
            this.modifications.placed.push({ x, y, z, typeId });
        }
    }

    recordRemoval(x, y, z) {
        const key = `${x},${y},${z}`;
        this.modifications.placed = this.modifications.placed.filter(b => !(b.x === x && b.y === y && b.z === z));
        if (!this.modifications.removed.includes(key)) {
            this.modifications.removed.push(key);
        }
    }

    getPlayerCoords(player, engine) {
        if (player && player.pos && player.pos.x !== undefined) return player.pos;
        if (player && player.position && player.position.x !== undefined) return player.position;
        if (player && player.camera && player.camera.position) return player.camera.position;
        if (engine && engine.camera) return engine.camera.position;
        return { x: 0, y: 15, z: 0 };
    }

    saveGame(player, engine) {
        const pPos = this.getPlayerCoords(player, engine);
        const saveData = {
            player: {
                x: pPos.x || 0,
                y: pPos.y || 15,
                z: pPos.z || 0,
                yaw: player ? player.yaw || 0 : 0,
                pitch: player ? player.pitch || 0 : 0,
                health: player ? player.health ?? 20 : 20,
                hunger: player ? player.hunger ?? 20 : 20,
                oxygen: player ? player.oxygen ?? 20 : 20
            },
            inventory: {
                hotbar: engine ? engine.hotbarItems : [],
                main: engine ? engine.mainInventory : [],
                selectedHotbarIndex: engine ? engine.selectedHotbarIndex : 0
            },
            time: engine ? engine.dayTime : 0.2,
            modifications: this.modifications
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            this.showSaveNotification();
        } catch (e) {
            console.warn('LocalStorage error:', e);
        }
    }

    loadGame(world, player, engine) {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);
            if (data.player && player) {
                const targetPos = player.pos || player.position || (player.camera ? player.camera.position : null);
                if (targetPos && typeof targetPos.set === 'function') {
                    targetPos.set(data.player.x, data.player.y, data.player.z);
                }
                player.yaw = data.player.yaw || 0;
                player.pitch = data.player.pitch || 0;
                player.health = data.player.health ?? 20;
                player.hunger = data.player.hunger ?? 20;
                player.oxygen = data.player.oxygen ?? 20;
            }

            if (data.inventory && engine) {
                if (data.inventory.hotbar) engine.hotbarItems = data.inventory.hotbar;
                if (data.inventory.main) engine.mainInventory = data.inventory.main;
                if (data.inventory.selectedHotbarIndex !== undefined) {
                    engine.selectedHotbarIndex = data.inventory.selectedHotbarIndex;
                }
            }

            if (data.time !== undefined && engine) {
                engine.dayTime = data.time;
            }

            if (data.modifications) {
                this.modifications = data.modifications;
                if (Array.isArray(this.modifications.removed)) {
                    this.modifications.removed.forEach(key => {
                        const [x, y, z] = key.split(',').map(Number);
                        world.removeBlock(x, y, z);
                    });
                }
                if (Array.isArray(this.modifications.placed)) {
                    this.modifications.placed.forEach(b => {
                        world.createBlock(b.x, b.y, b.z, b.typeId);
                    });
                }
            }
            return true;
        } catch (e) {
            console.error('Failed to parse save data:', e);
            return false;
        }
    }

    showSaveNotification() {
        let toast = document.getElementById('save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'save-toast';
            toast.style.position = 'absolute';
            toast.style.bottom = '65px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(0, 0, 0, 0.65)';
            toast.style.color = '#55ff55';
            toast.style.border = '1px solid #55ff55';
            toast.style.padding = '4px 12px';
            toast.style.fontSize = '11px';
            toast.style.fontWeight = 'bold';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '100';
            toast.style.pointerEvents = 'none';
            toast.style.transition = 'opacity 0.4s ease';
            document.body.appendChild(toast);
        }
        toast.innerText = 'Game Saved';
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 1200);
    }

    update(delta, player, engine) {
        this.timer += delta;
        if (this.timer >= this.autoSaveInterval) {
            this.timer = 0;
            this.saveGame(player, engine);
        }
    }
}
