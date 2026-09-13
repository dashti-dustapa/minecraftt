/**
 * Player.js
 * First-person controller: WASD movement, mouse look, jump, and camera.
 */

import * as THREE from 'three';
import {
    PLAYER_WALK_SPEED,
    PLAYER_SPRINT_SPEED,
    PLAYER_EYE_HEIGHT,
    GRAVITY,
    PLAYER_JUMP_FORCE
} from '../core/Constants.js';

export class Player {
    constructor(camera, input, scene) {
        this.camera = camera;
        this.input = input;
        this.scene = scene;

        this.position = new THREE.Vector3(0, 15, 0);
        this.velocity = new THREE.Vector3();

        this.yaw = 0;
        this.pitch = 0;
        this.isGrounded = false;
        this.isSprinting = false;
        this.mouseSensitivity = 0.0022;

        this.camera.position.copy(this.position);
        this.camera.rotation.order = 'YXZ';
    }

    update(delta) {
        this.handleMouseLook();
        this.handleMovement(delta);
        this.updateCamera();
    }

    handleMouseLook() {
        if (!this.input.isLocked) return;

        const mouseDelta = this.input.getAndResetMouseDelta();
        this.yaw -= mouseDelta.x * this.mouseSensitivity;
        this.pitch -= mouseDelta.y * this.mouseSensitivity;

        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }

    handleMovement(delta) {
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        const moveDir = new THREE.Vector3();
        if (this.input.isKeyDown('KeyW')) moveDir.add(forward);
        if (this.input.isKeyDown('KeyS')) moveDir.sub(forward);
        if (this.input.isKeyDown('KeyD')) moveDir.add(right);
        if (this.input.isKeyDown('KeyA')) moveDir.sub(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
        }

        this.isSprinting = this.input.isKeyDown('ShiftLeft') || this.input.isKeyDown('ShiftRight');
        const speed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;

        this.velocity.x = moveDir.x * speed;
        this.velocity.z = moveDir.z * speed;

        if (this.position.y > PLAYER_EYE_HEIGHT) {
            this.velocity.y += GRAVITY * delta;
        } else {
            this.position.y = PLAYER_EYE_HEIGHT;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        if (this.input.isKeyDown('Space') && this.isGrounded) {
            this.velocity.y = PLAYER_JUMP_FORCE;
            this.isGrounded = false;
        }

        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.position.z += this.velocity.z * delta;
    }

    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        const posElem = document.getElementById('debug-pos');
        if (posElem) {
            posElem.innerText = `XYZ: ${this.position.x.toFixed(3)} / ${this.position.y.toFixed(3)} / ${this.position.z.toFixed(3)}`;
        }
    }
}
