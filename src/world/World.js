/**
 * World.js
 * Terrain generator with solid grass surface, dirt base, and block storage.
 */

import * as THREE from 'three';

export class World {
    constructor(scene, textureManager) {
        this.scene = scene;
        this.textureManager = textureManager;
        this.blocks = new Map();
        this.meshes = [];

        this.generateTerrain();
    }

    generateTerrain() {
        const size = 16; // 32x32 platform (from -16 to 16)
        
        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                // Bedrock/Stone at base
                this.createBlock(x, 0, z, 2); // Stone
                this.createBlock(x, 1, z, 1); // Dirt
                this.createBlock(x, 2, z, 1); // Dirt
                this.createBlock(x, 3, z, 0); // Grass Block on top
            }
        }
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
        
        // Remove existing block at this position if any
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
