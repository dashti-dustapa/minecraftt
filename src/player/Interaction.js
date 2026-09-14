/**
 * Interaction.js
 * Raycasting, block selection outline, block breaking/placing,
 * and first-person hand viewmodel controller.
 */

import * as THREE from 'three';
import { BLOCK_DEFS } from '../core/Constants.js';

export class Interaction {
    constructor(scene, camera, world, textureManager) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.textureManager = textureManager;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 6.0;
        this.targetHit = null;

        // Block Selection Outline
        const outlineGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
        const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.selectionBox = new THREE.LineSegments(outlineGeom, outlineMat);
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        // First-Person Hand Item Viewmodel
        this.handContainer = new THREE.Group();
        this.camera.add(this.handContainer);
        this.scene.add(this.camera);

        const initialMat = this.textureManager.getBlockMaterial(0);
        this.handItemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), initialMat);
        this.handItemMesh.position.set(0.48, -0.42, -0.65);
        this.handItemMesh.rotation.set(0.2, -0.4, 0.1);
        this.handContainer.add(this.handItemMesh);

        this.isSwinging = false;
        this.swingProgress = 0;
        this.walkTimer = 0;
    }

    setHeldItem(typeId) {
        if (typeId === null || typeId === undefined) {
            this.handItemMesh.visible = false;
        } else {
            this.handItemMesh.visible = true;
            this.handItemMesh.material = this.textureManager.getBlockMaterial(typeId);
        }
    }

    update(delta, isMoving, isGrounded) {
        // Update Raycasting
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const meshes = this.world.getAllMeshes();
        const hits = this.raycaster.intersectObjects(meshes, false);

        if (hits.length > 0) {
            this.targetHit = hits[0];
            this.selectionBox.position.copy(this.targetHit.object.position);
            this.selectionBox.visible = true;
        } else {
            this.targetHit = null;
            this.selectionBox.visible = false;
        }

        // Viewmodel Walking Bobbing
        if (isMoving && isGrounded) {
            this.walkTimer += delta * 12;
            this.handItemMesh.position.y = -0.42 + Math.sin(this.walkTimer) * 0.03;
            this.handItemMesh.position.x = 0.48 + Math.cos(this.walkTimer * 0.5) * 0.03;
        } else {
            this.handItemMesh.position.y = -0.42;
            this.handItemMesh.position.x = 0.48;
        }

        // Arm Swing Animation
        if (this.isSwinging) {
            this.swingProgress += delta * 15;
            this.handItemMesh.rotation.x = 0.2 + Math.sin(this.swingProgress) * 0.8;
            this.handItemMesh.rotation.y = -0.4 - Math.sin(this.swingProgress) * 0.4;
            if (this.swingProgress >= Math.PI) {
                this.swingProgress = 0;
                this.isSwinging = false;
                this.handItemMesh.rotation.set(0.2, -0.4, 0.1);
            }
        }
    }

    triggerSwing() {
        this.isSwinging = true;
    }

    breakBlock() {
        this.triggerSwing();
        if (!this.targetHit) return null;

        const data = this.targetHit.object.userData;
        const removedTypeId = this.world.removeBlock(data.x, data.y, data.z);
        return removedTypeId;
    }

    placeBlock(typeId, player) {
        this.triggerSwing();
        if (!this.targetHit || typeId === null || typeId === undefined) return false;

        const normal = this.targetHit.face.normal;
        const px = this.targetHit.object.userData.x + Math.round(normal.x);
        const py = this.targetHit.object.userData.y + Math.round(normal.y);
        const pz = this.targetHit.object.userData.z + Math.round(normal.z);

        // Prevent placing block inside player's AABB bounding box
        const playerMinY = player.pos.y - player.eyeHeight;
        const playerMaxY = player.pos.y - player.eyeHeight + player.totalHeight;

        const insidePlayer =
            px >= Math.floor(player.pos.x - player.radius) &&
            px <= Math.floor(player.pos.x + player.radius) &&
            pz >= Math.floor(player.pos.z - player.radius) &&
            pz <= Math.floor(player.pos.z + player.radius) &&
            py >= Math.floor(playerMinY) &&
            py <= Math.floor(playerMaxY);

        if (!insidePlayer) {
            this.world.createBlock(px, py, pz, typeId);
            return true;
        }

        return false;
    }
}
