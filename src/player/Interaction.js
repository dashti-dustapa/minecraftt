/**
 * Interaction.js
 * Crosshair raycaster: Target selection box, block destruction, and block placement.
 */

import * as THREE from 'three';
import { BLOCK, PLAYER_REACH } from '../core/Constants.js';

export class Interaction {
    constructor(camera, scene, input, chunks) {
        this.camera = camera;
        this.scene = scene;
        this.input = input;
        this.chunks = chunks;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = PLAYER_REACH;

        // Visual selection outline box
        const outlineGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
        const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.selectionBox = new THREE.LineSegments(outlineGeom, outlineMat);
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        // Map hotbar slot index (0 - 8) to block types
        this.slotToBlock = [
            BLOCK.STONE,       // Slot 1
            BLOCK.DIRT,        // Slot 2
            BLOCK.WOOD_PLANK,  // Slot 3
            BLOCK.COBBLESTONE, // Slot 4
            BLOCK.GRASS        // Slot 5
        ];
    }

    update() {
        if (!this.input.isLocked) {
            this.selectionBox.visible = false;
            return;
        }

        // Raycast from camera straight forward
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

        // Gather all block meshes from all chunks
        const meshes = [];
        for (let i = 0; i < this.chunks.length; i++) {
            meshes.push(...this.chunks[i].meshGroup.children);
        }

        const intersects = this.raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const mesh = hit.object;
            const data = mesh.userData;

            // Snap selection box to the target block
            const worldPos = new THREE.Vector3();
            mesh.getWorldPosition(worldPos);
            this.selectionBox.position.copy(worldPos);
            this.selectionBox.visible = true;

            // 1. Destroy Block (Left Click)
            if (this.input.leftClick) {
                if (data.blockId !== BLOCK.BEDROCK) {
                    data.chunk.setBlockAndRebuild(data.x, data.y, data.z, BLOCK.AIR);
                }
                this.input.leftClick = false;
            }

            // 2. Place Block (Right Click)
            if (this.input.rightClick) {
                const normal = hit.face.normal;
                const placeX = data.x + Math.round(normal.x);
                const placeY = data.y + Math.round(normal.y);
                const placeZ = data.z + Math.round(normal.z);

                const selectedBlock = this.slotToBlock[this.input.selectedSlot] || BLOCK.STONE;
                data.chunk.setBlockAndRebuild(placeX, placeY, placeZ, selectedBlock);

                this.input.rightClick = false;
            }
        } else {
            this.selectionBox.visible = false;
            this.input.leftClick = false;
            this.input.rightClick = false;
        }
    }
}
