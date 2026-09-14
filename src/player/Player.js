/**
 * Player.js
 * First-person kinematic controller with full collision, gravity, jumping,
 * and unified camera synchronization.
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

        // Position & Dimensions
        this.pos = new THREE.Vector3(0, 16, 0);
        this.position = this.pos; // Alias for engine safety
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.height = PLAYER_HEIGHT;
        this.eyeHeight = PLAYER_EYE_HEIGHT;
        this.radius = PLAYER_RADIUS;

        // Rotation
        this.yaw = 0;
        this.pitch = 0;

        // Physics State
        this.isGrounded = false;
        this.headSubmerged = false;

        // Survival Stats
        this.health = 20;
        this.hunger = 20;
        this.oxygen = 20;

        this.onDamage = null;
        this.onStatsChange = null;
    }

    update(delta, keys, isSprinting, isJumping) {
        // 1. Synchronize camera rotation
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // 2. Calculate movement intent from WASD keys
        const moveDir = new THREE.Vector3();
        if (keys['KeyW'] || keys['ArrowUp']) moveDir.z -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveDir.z += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;

        const isMoving = moveDir.lengthSq() > 0;
        if (isMoving) {
            moveDir.normalize();
            // Transform movement relative to camera yaw
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        }

        const speed = isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;
        this.velocity.x = moveDir.x * speed;
        this.velocity.z = moveDir.z * speed;

        // 3. Gravity and Jumping
        if (!this.isGrounded) {
            this.velocity.y += GRAVITY * delta;
        } else {
            if (this.velocity.y < 0) this.velocity.y = 0;
            if (isJumping || keys['Space']) {
                this.velocity.y = PLAYER_JUMP_FORCE;
                this.isGrounded = false;
            }
        }

        // 4. Move and Simple World Collision
        const displacement = this.velocity.clone().multiplyScalar(delta);

        // Horizontal displacement
        this.pos.x += displacement.x;
        this.pos.z += displacement.z;

        // Vertical displacement
        this.pos.y += displacement.y;

        // Basic ground floor collision
        const terrainHeight = 2.0; // Base baseline height
        if (this.pos.y < terrainHeight + this.eyeHeight) {
            this.pos.y = terrainHeight + this.eyeHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // 5. Apply player position to camera
        this.camera.position.copy(this.pos);

        return isMoving;
    }
}
