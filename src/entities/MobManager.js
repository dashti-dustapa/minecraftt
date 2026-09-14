/**
 * MobManager.js
 * Controls passive mobs (Sheep) with ground clamping, wandering physics,
 * leg-swing walking animations, and combat reactions.
 */

import * as THREE from 'three';

export class MobManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.mobs = [];
        this.hitMeshes = [];

        this.initMaterials();
        this.spawnInitialSheep(5);
    }

    initMaterials() {
        this.materials = {
            wool: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
            head: new THREE.MeshLambertMaterial({ color: 0xd9b38c }),
            leg: new THREE.MeshLambertMaterial({ color: 0x4a3c31 }),
            hitFlash: new THREE.MeshBasicMaterial({ color: 0xff3333 })
        };
    }

    createSheep() {
        const sheepGroup = new THREE.Group();

        // 1. Wool Body (Origin at feet y = 0)
        const bodyGeom = new THREE.BoxGeometry(0.8, 0.65, 1.1);
        const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.wool);
        bodyMesh.position.set(0, 0.75, 0);
        sheepGroup.add(bodyMesh);

        // 2. Head
        const headGeom = new THREE.BoxGeometry(0.35, 0.35, 0.4);
        const headMesh = new THREE.Mesh(headGeom, this.materials.head);
        headMesh.position.set(0, 0.95, 0.65);
        sheepGroup.add(headMesh);

        // 3. Legs
        const legGeom = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        const legs = [];
        const legPositions = [
            [-0.25, 0.25, 0.35],  // Front-Left
            [0.25, 0.25, 0.35],   // Front-Right
            [-0.25, 0.25, -0.35], // Back-Left
            [0.25, 0.25, -0.35]   // Back-Right
        ];

        legPositions.forEach(pos => {
            const legMesh = new THREE.Mesh(legGeom, this.materials.leg);
            legMesh.position.set(...pos);
            sheepGroup.add(legMesh);
            legs.push(legMesh);
        });

        // Store references for raycasting & animation
        bodyMesh.userData = { parentMob: sheepGroup };
        headMesh.userData = { parentMob: sheepGroup };
        this.hitMeshes.push(bodyMesh, headMesh);

        const mobData = {
            group: sheepGroup,
            bodyMesh: bodyMesh,
            legs: legs,
            health: 8,
            walkTimer: Math.random() * 10,
            moveSpeed: 1.2,
            targetAngle: Math.random() * Math.PI * 2,
            isMoving: false,
            changeDirTimer: 2 + Math.random() * 3,
            hitTimer: 0
        };

        sheepGroup.userData = mobData;
        return mobData;
    }

    getGroundHeight(x, z) {
        // Ground grass surface is at Y = 4.0
        if (this.world) {
            for (let y = 10; y >= 0; y--) {
                const block = this.world.getBlock(Math.floor(x), y, Math.floor(z));
                if (block !== null && block !== 7 && block !== 5) { // not air/water/torch
                    return y + 1.0;
                }
            }
        }
        return 4.0;
    }

    spawnInitialSheep(count = 5) {
        for (let i = 0; i < count; i++) {
            const mob = this.createSheep();
            // Spawn around the meadow, away from center
            const x = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            const y = this.getGroundHeight(x, z);

            mob.group.position.set(x, y, z);
            mob.group.rotation.y = Math.random() * Math.PI * 2;

            this.scene.add(mob.group);
            this.mobs.push(mob);
        }
    }

    getHitMeshes() {
        return this.hitMeshes;
    }

    hitMob(hitObject, playerPos, damage = 4) {
        const mobGroup = hitObject.userData.parentMob;
        if (!mobGroup) return;

        const mob = mobGroup.userData;
        mob.health -= damage;
        mob.hitTimer = 0.25;
        mob.bodyMesh.material = this.materials.hitFlash;

        // Knockback away from player
        const knockDir = new THREE.Vector3().subVectors(mob.group.position, playerPos);
        knockDir.y = 0;
        knockDir.normalize();

        mob.group.position.addScaledVector(knockDir, 0.7);

        // Die if health reaches 0
        if (mob.health <= 0) {
            this.scene.remove(mob.group);
            this.mobs = this.mobs.filter(m => m !== mob);
            this.hitMeshes = this.hitMeshes.filter(m => m !== hitObject && m.userData.parentMob !== mobGroup);
        }
    }

    update(delta, dayTime) {
        for (let i = 0; i < this.mobs.length; i++) {
            const mob = this.mobs[i];

            // Reset hit flash material
            if (mob.hitTimer > 0) {
                mob.hitTimer -= delta;
                if (mob.hitTimer <= 0) {
                    mob.bodyMesh.material = this.materials.wool;
                }
            }

            // AI Decision: Idle or Walk
            mob.changeDirTimer -= delta;
            if (mob.changeDirTimer <= 0) {
                mob.isMoving = Math.random() > 0.45;
                mob.targetAngle = Math.random() * Math.PI * 2;
                mob.changeDirTimer = 2.5 + Math.random() * 4;
            }

            // Movement & Ground Adherence
            if (mob.isMoving) {
                mob.group.rotation.y = mob.targetAngle;

                const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mob.targetAngle);
                mob.group.position.x += forward.x * mob.moveSpeed * delta;
                mob.group.position.z += forward.z * mob.moveSpeed * delta;

                // Keep bounded inside world platform (-14 to 14)
                mob.group.position.x = Math.max(-14, Math.min(14, mob.group.position.x));
                mob.group.position.z = Math.max(-14, Math.min(14, mob.group.position.z));

                // Leg swing walking animation
                mob.walkTimer += delta * 7;
                const swing = Math.sin(mob.walkTimer) * 0.45;
                mob.legs[0].rotation.x = swing;
                mob.legs[1].rotation.x = -swing;
                mob.legs[2].rotation.x = -swing;
                mob.legs[3].rotation.x = swing;
            } else {
                // Stand still
                mob.legs.forEach(l => { l.rotation.x = 0; });
            }

            // Lock precisely to ground surface level
            const targetY = this.getGroundHeight(mob.group.position.x, mob.group.position.z);
            mob.group.position.y = targetY;
        }
    }
}
