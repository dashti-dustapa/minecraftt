/**
 * Player.js
 * First-person kinematic controller with robust keyboard input handling,
 * gravity, jumping, and camera tracking.
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
        this.pos = new THREE.Vector3(0, 16, 0);
        this.position = this.pos;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.height = PLAYER_HEIGHT;
        this.eyeHeight = PLAYER_EYE_HEIGHT;
        this.radius = PLAYER_RADIUS;

        // Viewing angles
        this.yaw = 0;
        this.pitch = 0;

        // States
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

    update(delta, keys, isSprinting, isJumping) {
        // 1. Sync rotation with camera
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // 2. Read movement inputs (compatible with object or map)
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

        // 3. Gravity and Jumping
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

        // 4. Apply displacement
        const displacement = this.velocity.clone().multiplyScalar(delta);
        this.pos.x += displacement.x;
        this.pos.z += displacement.z;
        this.pos.y += displacement.y;

        // Basic terrain collision baseline
        const baseGroundY = 2.0;
        if (this.pos.y < baseGroundY + this.eyeHeight) {
            this.pos.y = baseGroundY + this.eyeHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // 5. Update camera position to follow player
        this.camera.position.copy(this.pos);

        return isMoving;
    }
}
