/**
 * World.js
 * Voxel storage, terrain generation, trees, ore distribution, and torch lighting.
 */

import * as THREE from 'three';
import { WORLD_SIZE, SEA_LEVEL, BLOCK, BLOCK_DEFS } from '../core/Constants.js';

export class World {
    constructor(scene, textureManager) {
        this.scene = scene;
        this.textureManager = textureManager;

        this.blocks = new Map();
        this.torchLights = new Map();

        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.torchGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);

        this.generateTerrain();
    }

    posKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    getBlock(x, y, z) {
        return this.blocks.get(this.posKey(x, y, z));
    }

    isSolid(x, y, z) {
        const b = this.getBlock(x, y, z);
        return b ? b.userData.solid : false;
    }

    isWater(x, y, z) {
        const b = this.getBlock(x, y, z);
        return b ? b.userData.isWater : false;
    }

    addTorchLight(x, y, z) {
        const pLight = new THREE.PointLight(0xffaa33, 1.4, 14, 1.2);
        pLight.position.set(x + 0.5, y + 0.7, z + 0.5);
        this.scene.add(pLight);
        this.torchLights.set(this.posKey(x, y, z), pLight);
    }

    removeTorchLight(x, y, z) {
        const key = this.posKey(x, y, z);
        const light = this.torchLights.get(key);
        if (light) {
            this.scene.remove(light);
            this.torchLights.delete(key);
        }
    }

    createBlock(x, y, z, typeId) {
        const key = this.posKey(x, y, z);
        if (this.blocks.has(key)) return;

        const def = BLOCK_DEFS[typeId] || BLOCK_DEFS[0];
        const geom = def.isTorch ? this.torchGeometry : this.blockGeometry;
        const mat = this.textureManager.getBlockMaterial(typeId);

        const mesh = new THREE.Mesh(geom, mat);

        if (def.isTorch) {
            mesh.position.set(x + 0.5, y + 0.35, z + 0.5);
            this.addTorchLight(x, y, z);
        } else {
            mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        }

        mesh.userData = {
            x, y, z,
            typeId,
            solid: def.solid,
            isWater: def.isWater,
            isTorch: def.isTorch
        };

        this.scene.add(mesh);
        this.blocks.set(key, mesh);
        return mesh;
    }

    removeBlock(x, y, z) {
        const key = this.posKey(x, y, z);
        const mesh = this.blocks.get(key);
        if (mesh) {
            if (mesh.userData.isTorch) {
                this.removeTorchLight(x, y, z);
            }
            this.scene.remove(mesh);
            this.blocks.delete(key);
            return mesh.userData.typeId;
        }
        return null;
    }

    growTree(baseX, baseY, baseZ) {
        const trunkHeight = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < trunkHeight; i++) {
            this.createBlock(baseX, baseY + i, baseZ, BLOCK.LOG);
        }
        const leafStart = baseY + trunkHeight - 2;
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                for (let ly = 0; ly <= 2; ly++) {
                    if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.4) continue;
                    const wx = baseX + lx;
                    const wy = leafStart + ly;
                    const wz = baseZ + lz;
                    if (!this.blocks.has(this.posKey(wx, wy, wz))) {
                        // Place Leaves (Plank material placeholder or glass style)
                        this.createBlock(wx, wy, wz, BLOCK.PLANK);
                    }
                }
            }
        }
    }

    generateTerrain() {
        for (let x = -WORLD_SIZE / 2; x < WORLD_SIZE / 2; x++) {
            for (let z = -WORLD_SIZE / 2; z < WORLD_SIZE / 2; z++) {
                const height = Math.floor(5 + Math.sin(x * 0.22) * 3 + Math.cos(z * 0.22) * 3);
                for (let y = 0; y <= Math.max(height, SEA_LEVEL); y++) {
                    if (y <= height) {
                        if (y === height) {
                            this.createBlock(x, y, z, BLOCK.GRASS);
                            if (Math.random() < 0.025 && Math.abs(x) > 3 && Math.abs(z) > 3) {
                                this.growTree(x, y + 1, z);
                            }
                        } else if (y > height - 3) {
                            this.createBlock(x, y, z, BLOCK.DIRT);
                        } else {
                            if (Math.random() < 0.04) {
                                this.createBlock(x, y, z, BLOCK.DIAMOND);
                            } else {
                                this.createBlock(x, y, z, BLOCK.STONE);
                            }
                        }
                    } else if (y <= SEA_LEVEL) {
                        this.createBlock(x, y, z, BLOCK.WATER);
                    }
                }
            }
        }
    }

    getAllMeshes() {
        return Array.from(this.blocks.values());
    }
}
