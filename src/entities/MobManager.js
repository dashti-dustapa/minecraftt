/**
 * MobManager.js
 * Handles entity spawning, AI behaviors (Sheep wandering & grazing, Zombie chasing & attacking),
 * procedural animations, hitboxes, and audio cues for passive and hostile mobs.
 */

import * as THREE from 'three';
import { BLOCK } from '../core/Constants.js';

export class MobManager {
    constructor(scene, world, player, soundManager) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.soundManager = soundManager;

        this.mobs = [];
        this.hitMeshes = [];
        this.spawnTimer = 0;
        this.maxMobs = 14;

        // Initialize starting ambient mobs
        this.initStartingMobs();
    }

    initStartingMobs() {
        const pPos = this.player.pos || this.player.position || { x: 48, y: 20, z: 48 };

        // Spawn initial passive sheep flock
        for (let i = 0; i < 5; i++) {
            const ox = (Math.random() - 0.5) * 32;
            const oz = (Math.random() - 0.5) * 32;
            const spawnX = Math.floor(pPos.x + ox);
            const spawnZ = Math.floor(pPos.z + oz);
            const spawnY = this.getHighestGround(spawnX, spawnZ);

            if (spawnY !== null) {
                this.spawnMob('sheep', spawnX + 0.5, spawnY + 1, spawnZ + 0.5);
            }
        }
    }

    getHighestGround(x, z) {
        for (let y = 60; y >= 0; y--) {
            const b = this.world.getBlock(x, y, z);
            if (b !== null && b !== undefined && b !== 0 && b !== BLOCK.WATER) {
                return y;
            }
        }
        return null;
    }

    // ================= MESH FACTORIES =================

    createSheepMesh() {
        const group = new THREE.Group();

        const woolMat = new THREE.MeshLambertMaterial({ color: 0xededed });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xd9b38c });
        const pinkMat = new THREE.MeshLambertMaterial({ color: 0xcca094 });

        // Sheep Body (fluffy wool)
        const bodyGeom = new THREE.BoxGeometry(0.9, 0.85, 1.25);
        const bodyMesh = new THREE.Mesh(bodyGeom, woolMat);
        bodyMesh.position.y = 0.8;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // Sheep Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.15, 0.65);

        const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.55);
        const headMesh = new THREE.Mesh(headGeom, woolMat);
        headGroup.add(headMesh);

        const snoutGeom = new THREE.BoxGeometry(0.35, 0.3, 0.25);
        const snoutMesh = new THREE.Mesh(snoutGeom, skinMat);
        snoutMesh.position.set(0, -0.08, 0.32);
        headGroup.add(snoutMesh);

        group.add(headGroup);
        group.head = headGroup;

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.24, 0.65, 0.24);
        group.legs = [];

        const legOffsets = [
            [-0.28, 0.32, 0.42],  // front-left
            [0.28, 0.32, 0.42],   // front-right
            [-0.28, 0.32, -0.42], // back-left
            [0.28, 0.32, -0.42]   // back-right
        ];

        legOffsets.forEach(pos => {
            const leg = new THREE.Mesh(legGeom, woolMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            group.add(leg);
            group.legs.push(leg);
        });

        group.userData = { mobType: 'sheep' };
        return group;
    }

    createZombieMesh() {
        const group = new THREE.Group();

        const greenSkin = new THREE.MeshLambertMaterial({ color: 0x3d782c });
        const cyanShirt = new THREE.MeshLambertMaterial({ color: 0x1f7878 });
        const bluePants = new THREE.MeshLambertMaterial({ color: 0x222659 });

        // Head
        const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeom, greenSkin);
        head.position.y = 1.65;
        group.add(head);
        group.head = head;

        // Torso
        const torsoGeom = new THREE.BoxGeometry(0.5, 0.75, 0.28);
        const torso = new THREE.Mesh(torsoGeom, cyanShirt);
        torso.position.y = 1.05;
        group.add(torso);

        // Arms (outstretched forward)
        const armGeom = new THREE.BoxGeometry(0.22, 0.72, 0.22);
        const leftArm = new THREE.Mesh(armGeom, greenSkin);
        leftArm.position.set(-0.38, 1.05, 0.3);
        leftArm.rotation.x = Math.PI / 2;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeom, greenSkin);
        rightArm.position.set(0.38, 1.05, 0.3);
        rightArm.rotation.x = Math.PI / 2;
        group.add(rightArm);
        group.arms = [leftArm, rightArm];

        // Legs
        const legGeom = new THREE.BoxGeometry(0.24, 0.72, 0.24);
        const leftLeg = new THREE.Mesh(legGeom, bluePants);
        leftLeg.position.set(-0.14, 0.36, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeom, bluePants);
        rightLeg.position.set(0.14, 0.36, 0);
        group.add(rightLeg);
        group.legs = [leftLeg, rightLeg];

        group.userData = { mobType: 'zombie' };
        return group;
    }

    spawnMob(type, x, y, z) {
        const mesh = (type === 'sheep') ? this.createSheepMesh() : this.createZombieMesh();
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        const mob = {
            type,
            mesh,
            health: type === 'zombie' ? 20 : 8,
            maxHealth: type === 'zombie' ? 20 : 8,
            velocity: new THREE.Vector3(0, 0, 0),
            yaw: Math.random() * Math.PI * 2,
            targetYaw: Math.random() * Math.PI * 2,
            isGrounded: false,
            walkCycle: 0,
            wanderTimer: 1 + Math.random() * 3,
            soundTimer: 3 + Math.random() * 7,
            stepTimer: 0.35,
            attackCooldown: 0,
            hurtTimer: 0
        };

        mesh.userData.mobRef = mob;
        this.mobs.push(mob);
        this.updateHitMeshes();
        return mob;
    }

    updateHitMeshes() {
        this.hitMeshes = [];
        this.mobs.forEach(m => {
            m.mesh.traverse(child => {
                if (child.isMesh) {
                    child.userData.mobRef = m;
                    this.hitMeshes.push(child);
                }
            });
        });
    }

    getHitMeshes() {
        return this.hitMeshes;
    }

    // ================= GAMEPLAY UPDATE LOOP =================

    update(delta, dayTime) {
        const pPos = this.player.pos || this.player.position || this.player.camera?.position;
        if (!pPos) return;

        // Periodic mob spawning
        this.spawnTimer += delta;
        if (this.spawnTimer >= 7.0 && this.mobs.length < this.maxMobs) {
            this.spawnTimer = 0;
            const isNight = (dayTime > 0.45 && dayTime < 0.95);
            const type = isNight ? (Math.random() > 0.4 ? 'zombie' : 'sheep') : 'sheep';

            const angle = Math.random() * Math.PI * 2;
            const dist = 24 + Math.random() * 20;
            const sx = Math.floor(pPos.x + Math.cos(angle) * dist);
            const sz = Math.floor(pPos.z + Math.sin(angle) * dist);
            const sy = this.getHighestGround(sx, sz);

            if (sy !== null) {
                this.spawnMob(type, sx + 0.5, sy + 1, sz + 0.5);
            }
        }

        // Update each mob instance
        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];

            if (mob.type === 'sheep') {
                this.updateSheep(mob, delta, pPos);
            } else if (mob.type === 'zombie') {
                this.updateZombie(mob, delta, pPos, dayTime);
            }

            // Despawn if mob is too far from player
            if (mob.mesh.position.distanceTo(pPos) > 65) {
                this.removeMob(mob);
            }
        }
    }

    updateSheep(mob, delta, pPos) {
        const distToPlayer = mob.mesh.position.distanceTo(pPos);

        // 1. Ambient Bleating Audio
        mob.soundTimer -= delta;
        if (mob.soundTimer <= 0) {
            mob.soundTimer = 7 + Math.random() * 12;
            if (distToPlayer < 22 && this.soundManager && typeof this.soundManager.playSheepBaa === 'function') {
                this.soundManager.playSheepBaa();
            }
        }

        // 2. Wandering AI Behavior
        mob.wanderTimer -= delta;
        if (mob.wanderTimer <= 0) {
            mob.wanderTimer = 3 + Math.random() * 5;
            mob.isMoving = Math.random() > 0.35;
            if (mob.isMoving) {
                mob.targetYaw += (Math.random() - 0.5) * 2.2;
            }
        }

        // Smooth angle interpolation
        let diff = mob.targetYaw - mob.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        mob.yaw += diff * delta * 3.0;
        mob.mesh.rotation.y = mob.yaw;

        const moveSpeed = mob.isMoving ? 1.8 : 0;
        if (mob.isMoving) {
            mob.velocity.x = -Math.sin(mob.yaw) * moveSpeed;
            mob.velocity.z = -Math.cos(mob.yaw) * moveSpeed;

            // Leg animation swing
            mob.walkCycle += delta * 7.0;
            const swing = Math.sin(mob.walkCycle) * 0.45;
            if (mob.mesh.legs && mob.mesh.legs.length === 4) {
                mob.mesh.legs[0].rotation.x = swing;
                mob.mesh.legs[1].rotation.x = -swing;
                mob.mesh.legs[2].rotation.x = -swing;
                mob.mesh.legs[3].rotation.x = swing;
            }

            // Sheep Footstep sound
            if (mob.isGrounded) {
                mob.stepTimer -= delta;
                if (mob.stepTimer <= 0) {
                    mob.stepTimer = 0.38;
                    if (distToPlayer < 14 && this.soundManager && typeof this.soundManager.playSheepStep === 'function') {
                        this.soundManager.playSheepStep();
                    }
                }
            }
        } else {
            mob.velocity.x *= 0.5;
            mob.velocity.z *= 0.5;
            if (mob.mesh.legs) {
                mob.mesh.legs.forEach(l => l.rotation.x = 0);
            }
        }

        // Physics & Block Obstacle Jumping
        this.applyMobPhysics(mob, delta);
    }

    updateZombie(mob, delta, pPos, dayTime) {
        const distToPlayer = mob.mesh.position.distanceTo(pPos);

        // 1. Ambient Zombie Groan Audio
        mob.soundTimer -= delta;
        if (mob.soundTimer <= 0) {
            mob.soundTimer = 6 + Math.random() * 10;
            if (distToPlayer < 24 && this.soundManager && typeof this.soundManager.playZombieGroan === 'function') {
                this.soundManager.playZombieGroan();
            }
        }

        // 2. Aggressive Player Tracking
        if (distToPlayer < 20) {
            const dx = pPos.x - mob.mesh.position.x;
            const dz = pPos.z - mob.mesh.position.z;
            mob.targetYaw = Math.atan2(-dx, -dz);
            mob.isMoving = true;
        } else {
            // Idle wander when player is out of range
            mob.wanderTimer -= delta;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 3 + Math.random() * 4;
                mob.isMoving = Math.random() > 0.4;
                if (mob.isMoving) mob.targetYaw += (Math.random() - 0.5) * 2.0;
            }
        }

        let diff = mob.targetYaw - mob.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        mob.yaw += diff * delta * 4.0;
        mob.mesh.rotation.y = mob.yaw;

        const moveSpeed = mob.isMoving ? 2.6 : 0;
        if (mob.isMoving) {
            mob.velocity.x = -Math.sin(mob.yaw) * moveSpeed;
            mob.velocity.z = -Math.cos(mob.yaw) * moveSpeed;

            mob.walkCycle += delta * 6.5;
            const swing = Math.sin(mob.walkCycle) * 0.5;
            if (mob.mesh.legs && mob.mesh.legs.length === 2) {
                mob.mesh.legs[0].rotation.x = swing;
                mob.mesh.legs[1].rotation.x = -swing;
            }
        } else {
            mob.velocity.x *= 0.5;
            mob.velocity.z *= 0.5;
            if (mob.mesh.legs) {
                mob.mesh.legs.forEach(l => l.rotation.x = 0);
            }
        }

        // 3. Attack Player on close contact
        if (distToPlayer < 1.4) {
            mob.attackCooldown -= delta;
            if (mob.attackCooldown <= 0) {
                mob.attackCooldown = 1.0;
                if (typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(3);
                }
            }
        }

        this.applyMobPhysics(mob, delta);
    }

    applyMobPhysics(mob, delta) {
        // Gravity
        mob.velocity.y -= 22.0 * delta;

        // Auto-jump over 1-block obstacles in front of the mob
        if (mob.isGrounded && mob.isMoving) {
            const frontX = Math.floor(mob.mesh.position.x - Math.sin(mob.yaw) * 0.7);
            const frontY = Math.floor(mob.mesh.position.y);
            const frontZ = Math.floor(mob.mesh.position.z - Math.cos(mob.yaw) * 0.7);

            const blockInFront = this.world.getBlock(frontX, frontY, frontZ);
            const blockAbove = this.world.getBlock(frontX, frontY + 1, frontZ);

            if (blockInFront && (!blockAbove || blockAbove === 0)) {
                mob.velocity.y = 7.2;
                mob.isGrounded = false;
            }
        }

        // Update coordinate positions
        mob.mesh.position.x += mob.velocity.x * delta;
        mob.mesh.position.z += mob.velocity.z * delta;
        mob.mesh.position.y += mob.velocity.y * delta;

        // Ground check and simple floor collision
        const bx = Math.floor(mob.mesh.position.x);
        const by = Math.floor(mob.mesh.position.y);
        const bz = Math.floor(mob.mesh.position.z);

        const groundBlock = this.world.getBlock(bx, by, bz);
        if (groundBlock !== null && groundBlock !== undefined && groundBlock !== 0 && groundBlock !== BLOCK.WATER) {
            mob.mesh.position.y = by + 1.0;
            mob.velocity.y = 0;
            mob.isGrounded = true;
        } else {
            mob.isGrounded = false;
        }

        // Reset Hurt flash animation
        if (mob.hurtTimer > 0) {
            mob.hurtTimer -= delta;
            if (mob.hurtTimer <= 0) {
                mob.mesh.traverse(child => {
                    if (child.isMesh && child.userData.origColor) {
                        child.material.color.setHex(child.userData.origColor);
                    }
                });
            }
        }
    }

    // ================= COMBAT & DAMAGE =================

    hitMob(hitMesh, playerPos, damage = 4) {
        let mob = hitMesh.userData.mobRef;
        if (!mob) {
            let p = hitMesh.parent;
            while (p && !mob) {
                if (p.userData && p.userData.mobRef) mob = p.userData.mobRef;
                p = p.parent;
            }
        }
        if (!mob) return;

        mob.health -= damage;
        mob.hurtTimer = 0.25;

        // Red hurt flash effect
        mob.mesh.traverse(child => {
            if (child.isMesh) {
                if (!child.userData.origColor) child.userData.origColor = child.material.color.getHex();
                child.material.color.setHex(0xff3333);
            }
        });

        // Directional Knockback
        if (playerPos) {
            const kbDir = new THREE.Vector3().subVectors(mob.mesh.position, playerPos).normalize();
            mob.velocity.x += kbDir.x * 5.5;
            mob.velocity.z += kbDir.z * 5.5;
            mob.velocity.y = 4.2;
            mob.isGrounded = false;
        }

        // Trigger hurt audio by entity type
        if (mob.type === 'sheep') {
            if (this.soundManager && typeof this.soundManager.playSheepHurt === 'function') {
                this.soundManager.playSheepHurt();
            }
        } else if (mob.type === 'zombie') {
            if (this.soundManager && typeof this.soundManager.playZombieHurt === 'function') {
                this.soundManager.playZombieHurt();
            }
        }

        // Check for entity death
        if (mob.health <= 0) {
            this.killMob(mob);
        }
    }

    killMob(mob) {
        // Drop items based on mob type
        if (mob.type === 'sheep') {
            // Sheep drops wool / mutton into player inventory if space exists
            if (window.gameEngine && window.gameEngine.mainInventory) {
                const freeSlot = window.gameEngine.mainInventory.indexOf(null);
                if (freeSlot !== -1) {
                    window.gameEngine.mainInventory[freeSlot] = BLOCK.LEAVES || 3; // Wool fallback
                }
            }
        }

        this.removeMob(mob);
    }

    removeMob(mob) {
        const idx = this.mobs.indexOf(mob);
        if (idx !== -1) {
            this.mobs.splice(idx, 1);
            this.scene.remove(mob.mesh);
            this.updateHitMeshes();
        }
    }
}
