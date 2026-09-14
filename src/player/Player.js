/**
 * Player.js
 * First-person controller with guaranteed death state handling,
 * health clamping, and respawn support.
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

        this.pos = new THREE.Vector3(0, 12, 0);
        this.position = this.pos;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.height = PLAYER_HEIGHT;
        this.eyeHeight = PLAYER_EYE_HEIGHT;
        this.radius = PLAYER_RADIUS;

        this.yaw = 0;
        this.pitch = 0;

        this.isGrounded = false;
        this.headSubmerged = false;

        // Health & Survival States
        this.health = 20;
        this.hunger = 20;
        this.oxygen = 20;
        this.isDead = false;

        this.onDamage = null;
        this.onStatsChange = null;
        this.onDeath = null;
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health = Math.max(0, this.health - amount);

        if (typeof this.onDamage === 'function') this.onDamage();
        if (typeof this.onStatsChange === 'function') this.onStatsChange();

        // Check fatal death immediately
        if (this.health <= 0) {
            this.triggerDeath();
        }
    }

    triggerDeath() {
        this.isDead = true;
        this.health = 0;

        // Direct fallback: Show death screen even if onDeath wasn't assigned
        const deathEl = document.getElementById('death-screen');
        if (deathEl) {
            deathEl.style.display = 'flex';
        }
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        if (typeof this.onDeath === 'function') {
            this.onDeath();
        }
    }

    respawn() {
        this.health = 20;
        this.hunger = 20;
        this.oxygen = 20;
        this.isDead = false;

        this.pos.set(0, 12, 0);
        this.velocity.set(0, 0, 0);
        this.pitch = 0;

        const deathEl = document.getElementById('death-screen');
        if (deathEl) deathEl.style.display = 'none';

        if (typeof this.onStatsChange === 'function') this.onStatsChange();
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
        if (typeof block === 'object') return block.solid !== false;
        return block !== 7 && block !== 5;
    }

    collideWithWorld(displacement) {
        const r = this.radius;
        const p = this.pos;

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

        p.y += displacement.y;
        this.isGrounded = false;

        const currentFeetY = p.y - this.eyeHeight;
        const currentHeadY = p.y - this.eyeHeight + this.height;

        for (let x = Math.floor(p.x - r); x <= Math.floor(p.x + r); x++) {
            for (let z = Math.floor(p.z - r); z <= Math.floor(p.z + r); z++) {
                if (displacement.y > 0) {
                    const blockY = Math.floor(currentHeadY);
                    if (this.isSolidBlock(x, blockY, z)) {
                        p.y = blockY - (this.height - this.eyeHeight) - 0.001;
                        this.velocity.y = 0;
                    }
                } else if (displacement.y < 0) {
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
        if (this.isDead) {
            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.z = 0.55;
            return false;
        }

        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

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

        const displacement = this.velocity.clone().multiplyScalar(delta);
        this.collideWithWorld(displacement);

        if (this.pos.y < -30) {
            this.takeDamage(20);
        }

        this.camera.position.copy(this.pos);
        return isMoving;
    }
}
