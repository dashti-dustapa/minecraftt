/**
 * Interaction.js
 * Handles block raycasting, Minecraft selection box,
 * first-person hand & tool swinging, and block break/place logic.
 */

import * as THREE from 'three';
import { BLOCK, BLOCK_DEFS } from '../core/Constants.js';

export class Interaction {
    constructor(scene, camera, world, textureManager) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.textureManager = textureManager;

        this.targetHit = null;
        this.reachDistance = 5.0;

        // 1. Minecraft Black Selection Box
        const boxGeom = new THREE.BoxGeometry(1.004, 1.004, 1.004);
        const edges = new THREE.EdgesGeometry(boxGeom);
        this.selectionBox = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
        );
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        // 2. First-Person Hand & Tool Visual
        this.initHand();

        this.swingProgress = 0;
        this.isSwinging = false;
        this.bobTimer = 0;
    }

    initHand() {
        this.handGroup = new THREE.Group();
        this.camera.add(this.handGroup);

        // Minecraft Steve Arm (Skin tone block)
        const armGeom = new THREE.BoxGeometry(0.18, 0.45, 0.18);
        const armMat = new THREE.MeshLambertMaterial({ color: 0xb57853 });
        this.handMesh = new THREE.Mesh(armGeom, armMat);
        this.handMesh.position.set(0.35, -0.35, -0.55);
        this.handMesh.rotation.set(0.2, -0.2, 0.1);
        this.handGroup.add(this.handMesh);

        // Held block display on hand
        const heldGeom = new THREE.BoxGeometry(0.22, 0.22, 0.22);
        const heldMat = new THREE.MeshLambertMaterial({ color: 0x5b8731 });
        this.heldItemMesh = new THREE.Mesh(heldGeom, heldMat);
        this.heldItemMesh.position.set(0.28, -0.25, -0.48);
        this.heldItemMesh.visible = false;
        this.handGroup.add(this.heldItemMesh);
    }

    setHeldItem(blockId) {
        if (!this.heldItemMesh) return;
        if (blockId === null || blockId === undefined || blockId === 0) {
            this.heldItemMesh.visible = false;
        } else {
            this.heldItemMesh.visible = true;
            if (this.textureManager && typeof this.textureManager.getBlockMaterial === 'function') {
                const mat = this.textureManager.getBlockMaterial(blockId);
                if (mat) this.heldItemMesh.material = mat;
            }
        }
    }

    triggerSwing() {
        this.isSwinging = true;
        this.swingProgress = 0;
    }

    // High-speed Voxel Raymarching (Guaranteed to find blocks)
    raycastWorld() {
        const origin = this.camera.position;
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);

        let lastEmpty = null;
        const stepSize = 0.04; // fine precision
        const maxSteps = Math.floor(this.reachDistance / stepSize);

        for (let i = 0; i <= maxSteps; i++) {
            const curDist = i * stepSize;
            const cx = origin.x + dir.x * curDist;
            const cy = origin.y + dir.y * curDist;
            const cz = origin.z + dir.z * curDist;

            const bx = Math.floor(cx);
            const by = Math.floor(cy);
            const bz = Math.floor(cz);

            const blockType = this.world.getBlock(bx, by, bz);

            if (blockType !== null && blockType !== undefined) {
                // Found targeted block! Determine which face was hit
                let normal = new THREE.Vector3(0, 1, 0);
                if (lastEmpty) {
                    const dx = lastEmpty.x - bx;
                    const dy = lastEmpty.y - by;
                    const dz = lastEmpty.z - bz;

                    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dz)) {
                        normal.set(Math.sign(dx), 0, 0);
                    } else if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) {
                        normal.set(0, Math.sign(dy), 0);
                    } else {
                        normal.set(0, 0, Math.sign(dz));
                    }
                }

                return {
                    point: new THREE.Vector3(cx, cy, cz),
                    face: { normal },
                    object: {
                        userData: {
                            x: bx,
                            y: by,
                            z: bz,
                            typeId: blockType
                        }
                    }
                };
            }

            lastEmpty = { x: bx, y: by, z: bz };
        }

        return null;
    }

    update(delta, isMoving, isGrounded) {
        // 1. Raycast and position black selection box
        this.targetHit = this.raycastWorld();

        if (this.targetHit) {
            const { x, y, z } = this.targetHit.object.userData;
            this.selectionBox.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.selectionBox.visible = true;
        } else {
            this.selectionBox.visible = false;
        }

        // 2. Hand Animation & Swing
        if (this.isSwinging) {
            this.swingProgress += delta * 7.5;
            const angle = Math.sin(this.swingProgress * Math.PI) * 0.45;
            this.handGroup.rotation.x = angle;
            this.handGroup.rotation.y = -angle * 0.5;

            if (this.swingProgress >= 1.0) {
                this.isSwinging = false;
                this.handGroup.rotation.set(0, 0, 0);
            }
        } else if (isMoving && isGrounded) {
            // Walking Bobbing
            this.bobTimer += delta * 10.0;
            this.handGroup.position.y = Math.sin(this.bobTimer) * 0.025;
            this.handGroup.position.x = Math.cos(this.bobTimer * 0.5) * 0.015;
        } else {
            this.handGroup.position.set(0, 0, 0);
        }
    }

    breakBlock() {
        if (!this.targetHit) return null;

        const { x, y, z, typeId } = this.targetHit.object.userData;
        this.triggerSwing();

        // Remove from world map
        this.world.removeBlock(x, y, z);

        // Rebuild 3D graphics mesh
        if (typeof this.world.rebuildMesh === 'function') {
            this.world.rebuildMesh();
        }

        this.targetHit = null;
        this.selectionBox.visible = false;
        return typeId;
    }

    placeBlock(blockId, player) {
        if (!this.targetHit) return false;

        const normal = this.targetHit.face.normal;
        const px = this.targetHit.object.userData.x + Math.round(normal.x);
        const py = this.targetHit.object.userData.y + Math.round(normal.y);
        const pz = this.targetHit.object.userData.z + Math.round(normal.z);

        // Prevent suffocating player inside placed block
        if (player) {
            const pPos = player.pos || player.position;
            if (pPos) {
                const minX = pPos.x - 0.35, maxX = pPos.x + 0.35;
                const minY = pPos.y - 1.62, maxY = pPos.y + 0.18;
                const minZ = pPos.z - 0.35, maxZ = pPos.z + 0.35;

                if (px >= Math.floor(minX) && px <= Math.floor(maxX) &&
                    py >= Math.floor(minY) && py <= Math.floor(maxY) &&
                    pz >= Math.floor(minZ) && pz <= Math.floor(maxZ)) {
                    return false; // Intersects player body
                }
            }
        }

        this.triggerSwing();

        // Set block in world map
        this.world.setBlock(px, py, pz, blockId);

        // Rebuild 3D graphics mesh
        if (typeof this.world.rebuildMesh === 'function') {
            this.world.rebuildMesh();
        }

        return true;
    }
}
