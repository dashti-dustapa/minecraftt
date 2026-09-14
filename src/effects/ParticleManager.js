/**
 * ParticleManager.js
 * High-performance 3D block break particle emitter with gravity and decay.
 */

import * as THREE from 'three';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.sharedGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);

        // Color palettes per block type
        this.colorPalette = {
            0: [0x5b8c32, 0x866043, 0x4c7828], // Grass (Green + Dirt)
            1: [0x866043, 0x68482f, 0x9b7454], // Dirt
            2: [0x787878, 0x5e5e5e, 0x8c8c8c], // Stone
            3: [0x6c6c6c, 0x3a3a3a, 0x4f4f4f], // Cobblestone
            4: [0x9c7849, 0x6b4f2c],           // Planks
            5: [0xffaa00, 0xffffff, 0x6b4f2c], // Torch
            6: [0xc4e3f3, 0xe8f7ff],           // Glass
            7: [0x2e5ec4, 0x3b6ddb],           // Water
            8: [0x4cedd9, 0x787878, 0x267b70], // Diamond
            9: [0x6d5332, 0x48361f, 0x8f6f47], // Log
            10: [0x9c7849, 0x5c4028],          // Crafting Table
            15: [0x32691e, 0x244e15, 0x45852b] // Leaves
        };
    }

    spawnBreakParticles(x, y, z, blockId, count = 14) {
        const colors = this.colorPalette[blockId] || [0x787878, 0x5e5e5e];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(this.sharedGeometry, mat);

            // Jitter around the block's center
            mesh.position.set(
                x + (Math.random() - 0.5) * 0.65,
                y + (Math.random() - 0.5) * 0.65,
                z + (Math.random() - 0.5) * 0.65
            );

            // Random outward explosion velocities
            const angle = Math.random() * Math.PI * 2;
            const horizSpeed = 1.4 + Math.random() * 2.2;
            const upSpeed = 2.2 + Math.random() * 2.6;

            const velocity = new THREE.Vector3(
                Math.cos(angle) * horizSpeed,
                upSpeed,
                Math.sin(angle) * horizSpeed
            );

            this.scene.add(mesh);

            this.particles.push({
                mesh,
                mat,
                velocity,
                life: 0.55 + Math.random() * 0.25,
                maxLife: 0.8
            });
        }
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mat.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            // Gravity pulling particles down
            p.velocity.y -= 22.0 * delta;

            // Apply movement
            p.mesh.position.addScaledVector(p.velocity, delta);

            // Shrink over time
            const scale = Math.max(0.01, p.life / p.maxLife);
            p.mesh.scale.set(scale, scale, scale);
        }
    }
}
