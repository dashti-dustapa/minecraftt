/**
 * World.js
 * Terrain generator with solid ground and procedural Oak Trees (Trunk & Leaves).
 */

import * as THREE from 'three';

export class World {
    constructor(scene, textureManager) {
        this.scene = scene;
        this.textureManager = textureManager;
        this.blocks = new Map();
        this.meshes = [];

        this.generateTerrain();
        this.generateTrees();
    }

    generateTerrain() {
        const size = 16; // 32x32 platform (from -16 to 16)
        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                this.createBlock(x, 0, z, 2); // Stone base
                this.createBlock(x, 1, z, 1); // Dirt
                this.createBlock(x, 2, z, 1); // Dirt
                this.createBlock(x, 3, z, 0); // Grass Block
            }
        }
    }

    generateTrees() {
        // Natural distribution of trees across the meadow (keeping center free)
        const treeLocations = [
            { x: -9, z: -9 },
            { x: 9, z: -8 },
            { x: -8, z: 8 },
            { x: 10, z: 10 },
            { x: -5, z: 12 },
            { x: 7, z: -12 },
            { x: -12, z: -2 }
        ];

        treeLocations.forEach(loc => {
            this.growTree(loc.x, 4, loc.z);
        });
    }

    growTree(trunkX, groundY, trunkZ) {
        const trunkHeight = 5;

        // 1. Oak Wood Trunk (Block 9)
        for (let y = 0; y < trunkHeight; y++) {
            this.createBlock(trunkX, groundY + y, trunkZ, 9);
        }

        // 2. Oak Leaves Canopy (Block 15)
        const topY = groundY + trunkHeight;

        // Lower broad foliage (5x5 layer)
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.4) continue;
                if (lx === 0 && lz === 0) continue; // Keep trunk inside
                this.createBlock(trunkX + lx, topY - 2, trunkZ + lz, 15);
                this.createBlock(trunkX + lx, topY - 1, trunkZ + lz, 15);
            }
        }

        // Upper foliage (3x3 layer)
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                this.createBlock(trunkX + lx, topY, trunkZ + lz, 15);
            }
        }

        // Crown top cross
        this.createBlock(trunkX, topY + 1, trunkZ, 15);
        this.createBlock(trunkX + 1, topY + 1, trunkZ, 15);
        this.createBlock(trunkX - 1, topY + 1, trunkZ, 15);
        this.createBlock(trunkX, topY + 1, trunkZ + 1, 15);
        this.createBlock(trunkX, topY + 1, trunkZ - 1, 15);
    }

    getBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.blocks.has(key)) {
            return this.blocks.get(key);
        }
        return null;
    }

    getAllMeshes() {
        return this.meshes;
    }

    createBlock(x, y, z, typeId) {
        const key = `${x},${y},${z}`;
        if (this.blocks.has(key)) {
            this.removeBlock(x, y, z);
        }

        const mat = this.textureManager.getBlockMaterial(typeId);
        const geom = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.userData = { x, y, z, typeId };

        this.scene.add(mesh);
        this.meshes.push(mesh);
        this.blocks.set(key, typeId);
        return mesh;
    }

    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const idx = this.meshes.findIndex(m => m.userData.x === x && m.userData.y === y && m.userData.z === z);
        if (idx !== -1) {
            const mesh = this.meshes[idx];
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            this.meshes.splice(idx, 1);
            const typeId = this.blocks.get(key);
            this.blocks.delete(key);
            return typeId;
        }
        return null;
    }
}
