/**
 * World.js - Void World Test
 * Empties all terrain to test gravity, movement, and void falling.
 */

import * as THREE from 'three';

export class World {
    constructor(scene, textureManager) {
        this.scene = scene;
        this.textureManager = textureManager;
        this.blocks = new Map();
        this.meshes = [];
    }

    getBlock(x, y, z) {
        return null; // Empty void - no blocks
    }

    getAllMeshes() {
        return this.meshes;
    }

    createBlock(x, y, z, typeId) {
        // Can still place blocks manually in the void
        const mat = this.textureManager.getBlockMaterial(typeId);
        const geom = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.userData = { x, y, z, typeId };

        this.scene.add(mesh);
        this.meshes.push(mesh);
        this.blocks.set(`${x},${y},${z}`, typeId);
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
            this.blocks.delete(key);
            return mesh.userData.typeId;
        }
        return null;
    }
}
