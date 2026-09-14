/**
 * Player.js
 * First-person kinematic controller with full 3D Voxel AABB Collision,
 * gravity, jumping, camera synchronization, and void respawning.
 */

import * as THREE from 'three';
import {
    PLAYER_HEIGHT,
    PLAYER_EYE_HEIGHT,
    PLAYER_RADIUS,
    PLAYER_WALK_SPEED,
    PLAYER_SPRINT_SPEED,
    PLAYER_JUMP_FORCE,
    GRAVITY
} from '../core/Constants.js';

export class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;

        // Position & Coordinates
        this.pos = new THREE.Vector3(0, 18, 0);
        this.position = this.pos; // Alias for engine safety
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.height = PLAYER_HEIGHT;
        this.eyeHeight = PLAYER_EYE_HEIGHT;
        this.radius = PLAYER_RADIUS;

        // Viewing angles
        this.yaw = 0;
        this.pitch = 0;

        // Physical States
        this.isGrounded = false;
        this.headSubmerged = false;

        // Survival Vitals
        this.health = 20;
        this.hunger = 20;
        this.oxygen = 20;

        this.onDamage = null;
        this.onStatsChange = null;
    }

    isDown(keys, code) {
        if (!keys) return false;
        if (typeof keys.isKeyDown === 'function') return keys.isKeyDown(code);
        return !!keys[code];
    }

    isSolidBlock(x, y, z) {
        if (!this.world) return false;
        const block = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        if (block === null || block === undefined) return false;
        if (typeof block === 'object') {
            return block.solid !== false;
        }
        // Block IDs: water=7 and torch=5 are non-solid
        return block !== 7 && block !== 5;
    }

    collideWithWorld(displacement) {
        const r = this.radius;
        const p = this.pos;

        // 1. Resolve X Axis Collision
        p.x += displacement.x;
        const minY = p.y - this.eyeHeight + 0.05;
        const maxY = p.y - this.eyeHeight + this.height - 0.05;

        for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
            for (let z = Math.floor(p.z - r); z <= Math.floor(p.z + r); z++) {
                if (displacement.x > 0) {
                    const blockX = Math.floor(p.x + r);
                    if (this.isSolidBlock(blockX, y, z)) {
                        p.x = blockX - r - 0.001;
                        this.velocity.x = 0;
                    }
                } else if (displacement.x < 0) {
                    const blockX = Math.floor(p.x - r);
                    if (this.isSolidBlock(blockX, y, z)) {
                        p.x = blockX + 1 + r + 0.001;
                        this.velocity.x = 0;
                    }
                }
            }
        }

        // 2. Resolve Z Axis Collision
        p.z += displacement.z;
        for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
            for (let x = Math.floor(p.x - r); x <= Math.floor(p.x + r); x++) {
                if (displacement.z > 0) {
                    const blockZ = Math.floor(p.z + r);
                    if (this.isSolidBlock(x, y, blockZ)) {
                        p.z = blockZ - r - 0.001;
                        this.velocity.z = 0;
                    }
                } else if (displacement.z < 0) {
                    const blockZ = Math.floor(p.z - r);
                    if (this.isSolidBlock(x, y, blockZ)) {
                        p.z = blockZ + 1 + r + 0.001;
                        this.velocity.z = 0;
                    }
                }
            }
        }

        // 3. Resolve Y Axis Collision (Ground / Ceiling)
        p.y += displacement.y;
        this.isGrounded = false;

        const currentFeetY = p.y - this.eyeHeight;
        const currentHeadY = p.y - this.eyeHeight + this.height;

        for (let x = Math.floor(p.x - r); x <= Math.floor(p.x + r); x++) {
            for (let z = Math.floor(p.z - r); z <= Math.floor(p.z + r); z++) {
                // Ceiling collision
                if (displacement.y > 0) {
                    const blockY = Math.floor(currentHeadY);
                    if (this.isSolidBlock(x, blockY, z)) {
                        p.y = blockY - (this.height - this.eyeHeight) - 0.001;
                        this.velocity.y = 0;
                    }
                }
                // Floor collision (Landing on ground)
                else if (displacement.y < 0) {
                    const blockY = Math.floor(currentFeetY);
                    if (this.isSolidBlock(x, blockY, z)) {
                        p.y = blockY + 1 + this.eyeHeight;
                        this.velocity.y = 0;
                        this.isGrounded = true;
                    }
                }
            }
        }
    }

    update(delta, keys, isSprinting, isJumping) {
        // Sync rotation with camera
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Handle movement inputs
        const moveDir = new THREE.Vector3();
        if (this.isDown(keys, 'KeyW') || this.isDown(keys, 'ArrowUp')) moveDir.z -= 1;
        if (this.isDown(keys, 'KeyS') || this.isDown(keys, 'ArrowDown')) moveDir.z += 1;
        if (this.isDown(keys, 'KeyA') || this.isDown(keys, 'ArrowLeft')) moveDir.x -= 1;
        if (this.isDown(keys, 'KeyD') || this.isDown(keys, 'ArrowRight')) moveDir.x += 1;

        const isMoving = moveDir.lengthSq() > 0;
        if (isMoving) {
            moveDir.normalize();
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        }

        const speed = isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;
        this.velocity.x = moveDir.x * speed;
        this.velocity.z = moveDir.z * speed;

        // Gravity & Jump Physics
        const jumpPressed = isJumping || this.isDown(keys, 'Space');

        if (!this.isGrounded) {
            this.velocity.y += GRAVITY * delta;
        } else {
            if (this.velocity.y < 0) this.velocity.y = 0;
            if (jumpPressed) {
                this.velocity.y = PLAYER_JUMP_FORCE;
                this.isGrounded = false;
            }
        }

        // Apply movement displacement and world collisions
        const displacement = this.velocity.clone().multiplyScalar(delta);
        this.collideWithWorld(displacement);

        // Void Fall Respawn: If falling into the void below -30, teleport back up
        if (this.pos.y < -30) {
            this.pos.set(0, 20, 0);
            this.velocity.set(0, 0, 0);
        }

        // Camera tracks the player eyes
        this.camera.position.copy(this.pos);

        return isMoving;
    }
}
