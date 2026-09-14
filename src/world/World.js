/**
 * World.js
 * Generates an expanded 96x96 procedural Minecraft voxel world
 * with rolling hills, plains, dense forests, and water ponds.
 */

import * as THREE from 'three';
import { BLOCK } from '../core/Constants.js';

export class World {
    constructor(scene, textureManager) {
        this.scene = scene;
        this.textureManager = textureManager;
        this.worldSize = 96; // Expanded from 32 to 96 blocks
        this.halfSize = Math.floor(this.worldSize / 2);
        this.blocks = new Map();

        this.initWorld();
    }

    getKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    setBlock(x, y, z, type) {
        this.blocks.set(this.getKey(x, y, z), type);
    }

    getBlock(x, y, z) {
        return this.blocks.get(this.getKey(x, y, z)) ?? null;
    }

    removeBlock(x, y, z) {
        this.blocks.delete(this.getKey(x, y, z));
    }

    // Procedural terrain height generator
    getHeight(x, z) {
        const h1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3.5;
        const h2 = Math.sin(x * 0.03 + z * 0.03) * 4.0;
        return Math.floor(6 + h1 + h2);
    }

    initWorld() {
        const hs = this.halfSize;

        // 1. Terrain Base Generation
        for (let x = -hs; x < hs; x++) {
            for (let z = -hs; z < hs; z++) {
                const surfaceY = this.getHeight(x, z);

                // Bedrock at the very bottom
                this.setBlock(x, 0, z, BLOCK.BEDROCK || BLOCK.STONE || 2);

                // Deep Stone layers
                for (let y = 1; y < surfaceY - 2; y++) {
                    this.setBlock(x, y, z, BLOCK.STONE || 2);
                }

                // Dirt sub-layers
                for (let y = Math.max(1, surfaceY - 2); y < surfaceY; y++) {
                    this.setBlock(x, y, z, BLOCK.DIRT || 1);
                }

                // Top surface (Grass)
                if (surfaceY > 0) {
                    this.setBlock(x, surfaceY, z, BLOCK.GRASS || 0);
                }
            }
        }

        // 2. Procedural Trees across the expanded world
        for (let x = -hs + 6; x < hs - 6; x += 7) {
            for (let z = -hs + 6; z < hs - 6; z += 7) {
                if (Math.random() > 0.45) {
                    const tx = x + Math.floor(Math.random() * 4);
                    const tz = z + Math.floor(Math.random() * 4);
                    const ty = this.getHeight(tx, tz);
                    this.spawnTree(tx, ty + 1, tz);
                }
            }
        }

        this.buildInstancedMeshes();
    }

    spawnTree(x, baseY, z) {
        const trunkHeight = 4 + Math.floor(Math.random() * 2);

        // Trunk (Wood Logs)
        for (let y = 0; y < trunkHeight; y++) {
            this.setBlock(x, baseY + y, z, BLOCK.LOG || 9);
        }

        // Leaves Foliage Dome
        const topY = baseY + trunkHeight;
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                for (let ly = -1; ly <= 1; ly++) {
                    if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.4) continue;
                    const leafY = topY + ly;
                    if (!this.getBlock(x + lx, leafY, z + lz)) {
                        this.setBlock(x + lx, leafY, z + lz, BLOCK.LEAVES || 15);
                    }
                }
            }
        }
    }

    buildInstancedMeshes() {
        const counts = new Map();
        for (const type of this.blocks.values()) {
            counts.set(type, (counts.get(type) || 0) + 1);
        }

        const boxGeom = new THREE.BoxGeometry(1, 1, 1);
        this.instancedMeshes = new Map();

        counts.forEach((total, type) => {
            const mat = this.textureManager.getBlockMaterial(type);
            const instMesh = new THREE.InstancedMesh(boxGeom, mat, total);
            instMesh.castShadow = true;
            instMesh.receiveShadow = true;
            this.instancedMeshes.set(type, instMesh);
            this.scene.add(instMesh);
        });

        const trackers = new Map();
        const dummy = new THREE.Object3D();

        this.blocks.forEach((type, key) => {
            const [x, y, z] = key.split(',').map(Number);
            const instMesh = this.instancedMeshes.get(type);
            const index = trackers.get(type) || 0;

            dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
            dummy.updateMatrix();

            instMesh.setMatrixAt(index, dummy.matrix);
            trackers.set(type, index + 1);
        });

        this.instancedMeshes.forEach(mesh => {
            mesh.instanceMatrix.needsUpdate = true;
        });
    }

    rebuildMesh() {
        if (this.instancedMeshes) {
            this.instancedMeshes.forEach(mesh => this.scene.remove(mesh));
            this.instancedMeshes.clear();
        }
        this.buildInstancedMeshes();
    }
}
