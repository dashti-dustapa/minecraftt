/**
 * SaveManager.js
 * Browser LocalStorage persistence for block modifications, player state,
 * inventory arrays, and celestial day/night cycle.
 */

export class SaveManager {
    constructor(storageKey = 'minecraft_web_save') {
        this.storageKey = storageKey;
        this.modifications = {
            placed: [],   // Array of { x, y, z, typeId }
            removed: []   // Array of 'x,y,z'
        };
        this.autoSaveInterval = 15; // Auto-save every 15 seconds
        this.timer = 0;
    }

    recordPlacement(x, y, z, typeId) {
        const key = `${x},${y},${z}`;
        // Remove from removed list if it was previously broken
        this.modifications.removed = this.modifications.removed.filter(k => k !== key);

        // Update or append to placed list
        const existingIdx = this.modifications.placed.findIndex(b => b.x === x && b.y === y && b.z === z);
        if (existingIdx !== -1) {
            this.modifications.placed[existingIdx].typeId = typeId;
        } else {
            this.modifications.placed.push({ x, y, z, typeId });
        }
    }

    recordRemoval(x, y, z) {
        const key = `${x},${y},${z}`;
        // Remove from placed list if it was previously placed
        this.modifications.placed = this.modifications.placed.filter(b => !(b.x === x && b.y === y && b.z === z));

        if (!this.modifications.removed.includes(key)) {
            this.modifications.removed.push(key);
        }
    }

    saveGame(player, engine) {
        const saveData = {
            player: {
                x: player.pos.x,
                y: player.pos.y,
                z: player.pos.z,
                yaw: player.yaw,
                pitch: player.pitch,
                health: player.health,
                hunger: player.hunger,
                oxygen: player.oxygen
            },
            inventory: {
                hotbar: engine.hotbarItems,
                main: engine.mainInventory,
                selectedHotbarIndex: engine.selectedHotbarIndex
            },
            time: engine.dayTime,
            modifications: this.modifications
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            this.showSaveNotification();
        } catch (e) {
            console.warn('Unable to save to LocalStorage:', e);
        }
    }

    loadGame(world, player, engine) {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);

            // 1. Restore Player State
            if (data.player) {
                player.pos.set(data.player.x, data.player.y, data.player.z);
                player.yaw = data.player.yaw || 0;
                player.pitch = data.player.pitch || 0;
                player.health = data.player.health ?? 20;
                player.hunger = data.player.hunger ?? 20;
                player.oxygen = data.player.oxygen ?? 20;
            }

            // 2. Restore Inventory State
            if (data.inventory) {
                if (data.inventory.hotbar) engine.hotbarItems = data.inventory.hotbar;
                if (data.inventory.main) engine.mainInventory = data.inventory.main;
                if (data.inventory.selectedHotbarIndex !== undefined) {
                    engine.selectedHotbarIndex = data.inventory.selectedHotbarIndex;
                }
            }

            // 3. Restore Celestial Time
            if (data.time !== undefined) {
                engine.dayTime = data.time;
            }

            // 4. Apply World Modifications (Deltas)
            if (data.modifications) {
                this.modifications = data.modifications;

                // Remove destroyed blocks
                if (Array.isArray(this.modifications.removed)) {
                    this.modifications.removed.forEach(key => {
                        const [x, y, z] = key.split(',').map(Number);
                        world.removeBlock(x, y, z);
                    });
                }

                // Create placed blocks
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

    clearSave() {
        localStorage.removeItem(this.storageKey);
        location.reload();
    }
}
