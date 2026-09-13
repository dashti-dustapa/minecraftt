/**
 * Chunk.js
 * 16x32x16 Voxel container with block interaction support.
 */

import * as THREE from 'three';
import { BLOCK } from '../core/Constants.js';

export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 32;

export class Chunk {
    constructor(cx, cz, textureManager) {
        this.cx = cx;
        this.cz = cz;
        this.textureManager = textureManager;

        this.voxels = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_WIDTH);
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.set(cx * CHUNK_WIDTH, 0, cz * CHUNK_WIDTH);

        this.generateTerrain();
        this.buildMesh();
    }

    getIndex(x, y, z) {
        return x + z * CHUNK_WIDTH + y * (CHUNK_WIDTH * CHUNK_WIDTH);
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_WIDTH) {
            return BLOCK.AIR;
        }
        return this.voxels[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, id) {
        if (x >= 0 && x < CHUNK_WIDTH && y >= 0 && y < CHUNK_HEIGHT && z >= 0 && z < CHUNK_WIDTH) {
            this.voxels[this.getIndex(x, y, z)] = id;
        }
    }

    setBlockAndRebuild(x, y, z, id) {
        this.setBlock(x, y, z, id);
        this.buildMesh();
    }

    generateTerrain() {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            for (let z = 0; z < CHUNK_WIDTH; z++) {
                const height = Math.floor(8 + Math.sin(x * 0.4) * 2 + Math.cos(z * 0.4) * 2);

                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    if (y === 0) {
                        this.setBlock(x, y, z, BLOCK.BEDROCK);
                    } else if (y < height - 3) {
                        this.setBlock(x, y, z, BLOCK.STONE);
                    } else if (y < height) {
                        this.setBlock(x, y, z, BLOCK.DIRT);
                    } else if (y === height) {
                        this.setBlock(x, y, z, BLOCK.GRASS);
                    } else {
                        this.setBlock(x, y, z, BLOCK.AIR);
                    }
                }
            }
        }
    }

    buildMesh() {
        while (this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children.pop();
            if (child.geometry) child.geometry.dispose();
        }

        const boxGeom = new THREE.BoxGeometry(1, 1, 1);

        for (let x = 0; x < CHUNK_WIDTH; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_WIDTH; z++) {
                    const blockId = this.getBlock(x, y, z);
                    if (blockId === BLOCK.AIR) continue;

                    const hasAirNeighbor =
                        this.getBlock(x + 1, y, z) === BLOCK.AIR ||
                        this.getBlock(x - 1, y, z) === BLOCK.AIR ||
                        this.getBlock(x, y + 1, z) === BLOCK.AIR ||
                        this.getBlock(x, y - 1, z) === BLOCK.AIR ||
                        this.getBlock(x, y, z + 1) === BLOCK.AIR ||
                        this.getBlock(x, y, z - 1) === BLOCK.AIR;

                    if (!hasAirNeighbor) continue;

                    let mat;
                    if (blockId === BLOCK.GRASS) {
                        mat = this.textureManager.materials.grass;
                    } else if (blockId === BLOCK.DIRT) {
                        mat = this.textureManager.materials.dirt;
                    } else if (blockId === BLOCK.WOOD_PLANK) {
                        mat = this.textureManager.materials.plank;
                    } else if (blockId === BLOCK.COBBLESTONE) {
                        mat = this.textureManager.materials.cobblestone;
                    } else {
                        mat = this.textureManager.materials.stone;
                    }

                    const blockMesh = new THREE.Mesh(boxGeom, mat);
                    blockMesh.position.set(x + 0.5, y + 0.5, z + 0.5);

                    // Attach voxel coordinates for Raycasting detection
                    blockMesh.userData = { chunk: this, x, y, z, blockId };
                    this.meshGroup.add(blockMesh);
                }
            }
        }
    }
}
