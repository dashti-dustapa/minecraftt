/**
 * MobManager.js
 * Controls active entities with full 3D AABB voxel collision detection,
 * solid block obstruction (no clipping into grass blocks), forward-facing movement,
 * and audio synchronization.
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

        this.WORLD_MIN = 6;
        this.WORLD_MAX = 90;

        this.initStartingMobs();
    }

    initStartingMobs() {
        const pPos = this.player.pos || this.player.position || { x: 48, y: 20, z: 48 };

        for (let i = 0; i < 6; i++) {
            const ox = (Math.random() - 0.5) * 24;
            const oz = (Math.random() - 0.5) * 24;
            const spawnX = Math.max(this.WORLD_MIN + 2, Math.min(this.WORLD_MAX - 2, Math.floor(pPos.x + ox)));
            const spawnZ = Math.max(this.WORLD_MIN + 2, Math.min(this.WORLD_MAX - 2, Math.floor(pPos.z + oz)));
            const spawnY = this.getHighestGround(spawnX, spawnZ);

            if (spawnY !== null) {
                this.spawnMob('sheep', spawnX + 0.5, spawnY + 1.0, spawnZ + 0.5);
            }
        }
    }

    getHighestGround(x, z) {
        for (let y = 50; y >= 0; y--) {
            const b = this.world.getBlock(x, y, z);
            if (b !== null && b !== undefined && b !== 0 && b !== BLOCK.WATER) {
                return y;
            }
        }
        return null;
    }

    // Helper: Checks if a block is solid physical terrain
    isSolid(x, y, z) {
        const bx = Math.floor(x);
        const by = Math.floor(y);
        const bz = Math.floor(z);
        if (by < 0 || by > 128) return false;
        const b = this.world.getBlock(bx, by, bz);
        return b !== null && b !== undefined && b !== 0 && b !== BLOCK.WATER;
    }

    createSheepMesh() {
        const group = new THREE.Group();

        const woolMat = new THREE.MeshLambertMaterial({ color: 0xededed });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xd9b38c });

        // Body
        const bodyGeom = new THREE.BoxGeometry(0.9, 0.85, 1.25);
        const bodyMesh = new THREE.Mesh(bodyGeom, woolMat);
        bodyMesh.position.y = 0.8;
        group.add(bodyMesh);

        // Head (Facing +Z Forward)
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

        // Legs (Soles rest exactly at y = 0)
        const legGeom = new THREE.BoxGeometry(0.24, 0.65, 0.24);
        group.legs = [];
        const legOffsets = [
            [-0.28, 0.325, 0.42],
            [0.28, 0.325, 0.42],
            [-0.28, 0.325, -0.42],
            [0.28, 0.325, -0.42]
        ];

        legOffsets.forEach(pos => {
            const leg = new THREE.Mesh(legGeom, woolMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            group.add(leg);
            group.legs.push(leg);
        });

        // Expanded hitbox for reliable hits
        const hitBoxGeom = new THREE.BoxGeometry(1.3, 1.4, 1.5);
        const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
        hitBox.position.y = 0.8;
        group.add(hitBox);

        group.userData = { mobType: 'sheep' };
        return group;
    }

    createZombieMesh() {
        const group = new THREE.Group();

        const greenSkin = new THREE.MeshLambertMaterial({ color: 0x3d782c });
        const cyanShirt = new THREE.MeshLambertMaterial({ color: 0x1f7878 });
        const bluePants = new THREE.MeshLambertMaterial({ color: 0x222659 });

        const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeom, greenSkin);
        head.position.y = 1.65;
        group.add(head);

        const torsoGeom = new THREE.BoxGeometry(0.5, 0.75, 0.28);
        const torso = new THREE.Mesh(torsoGeom, cyanShirt);
        torso.position.y = 1.05;
        group.add(torso);

        const armGeom = new THREE.BoxGeometry(0.22, 0.72, 0.22);
        const leftArm = new THREE.Mesh(armGeom, greenSkin);
        leftArm.position.set(-0.38, 1.05, 0.3);
        leftArm.rotation.x = Math.PI / 2;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeom, greenSkin);
        rightArm.position.set(0.38, 1.05, 0.3);
        rightArm.rotation.x = Math.PI / 2;
        group.add(rightArm);

        const legGeom = new THREE.BoxGeometry(0.24, 0.72, 0.24);
        const leftLeg = new THREE.Mesh(legGeom, bluePants);
        leftLeg.position.set(-0.14, 0.36, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeom, bluePants);
        rightLeg.position.set(0.14, 0.36, 0);
        group.add(rightLeg);
        group.legs = [leftLeg, rightLeg];

        const hitBoxGeom = new THREE.BoxGeometry(1.0, 2.0, 1.0);
        const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
        hitBox.position.y = 1.0;
        group.add(hitBox);

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
            velocity: new THREE.Vector3(0, 0, 0),
            yaw: Math.random() * Math.PI * 2,
            targetYaw: Math.random() * Math.PI * 2,
            isGrounded: false,
            walkCycle: 0,
            wanderTimer: 1 + Math.random() * 3,
            soundTimer: 3 + Math.random() * 6,
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

    update(delta, dayTime) {
        const pPos = this.player.pos || this.player.position || { x: 48, y: 20, z: 48 };

        this.spawnTimer += delta;
        if (this.spawnTimer >= 6.0 && this.mobs.length < this.maxMobs) {
            this.spawnTimer = 0;
            const isNight = (dayTime > 0.45 && dayTime < 0.95);
            const type = isNight ? (Math.random() > 0.4 ? 'zombie' : 'sheep') : 'sheep';

            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 14;
            const sx = Math.max(this.WORLD_MIN + 2, Math.min(this.WORLD_MAX - 2, Math.floor(pPos.x + Math.cos(angle) * dist)));
            const sz = Math.max(this.WORLD_MIN + 2, Math.min(this.WORLD_MAX - 2, Math.floor(pPos.z + Math.sin(angle) * dist)));
            const sy = this.getHighestGround(sx, sz);

            if (sy !== null) {
                this.spawnMob(type, sx + 0.5, sy + 1.0, sz + 0.5);
            }
        }

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];

            if (mob.type === 'sheep') {
                this.updateSheep(mob, delta, pPos);
            } else if (mob.type === 'zombie') {
                this.updateZombie(mob, delta, pPos);
            }

            if (mob.mesh.position.distanceTo(pPos) > 60) {
                this.removeMob(mob);
            }
        }
    }

    updateSheep(mob, delta, pPos) {
        const distToPlayer = mob.mesh.position.distanceTo(pPos);

        mob.soundTimer -= delta;
        if (mob.soundTimer <= 0) {
            mob.soundTimer = 6 + Math.random() * 8;
            if (distToPlayer < 20 && this.soundManager) {
                this.soundManager.playSheepBaa();
            }
        }

        mob.wanderTimer -= delta;
        if (mob.wanderTimer <= 0) {
            mob.wanderTimer = 2.5 + Math.random() * 4;
            mob.isMoving = Math.random() > 0.35;
            if (mob.isMoving) {
                mob.targetYaw += (Math.random() - 0.5) * 2.2;
            }
        }

        const curX = mob.mesh.position.x;
        const curZ = mob.mesh.position.z;
        if (curX <= this.WORLD_MIN || curX >= this.WORLD_MAX || curZ <= this.WORLD_MIN || curZ >= this.WORLD_MAX) {
            mob.targetYaw = Math.atan2(48 - curX, 48 - curZ);
            mob.isMoving = true;
        }

        let diff = mob.targetYaw - mob.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        mob.yaw += diff * delta * 3.5;
        mob.mesh.rotation.y = mob.yaw;

        const moveSpeed = mob.isMoving ? 1.7 : 0;
        if (mob.isMoving) {
            mob.velocity.x = Math.sin(mob.yaw) * moveSpeed;
            mob.velocity.z = Math.cos(mob.yaw) * moveSpeed;

            mob.walkCycle += delta * 7.0;
            const swing = Math.sin(mob.walkCycle) * 0.45;
            if (mob.mesh.legs && mob.mesh.legs.length === 4) {
                mob.mesh.legs[0].rotation.x = swing;
                mob.mesh.legs[1].rotation.x = -swing;
                mob.mesh.legs[2].rotation.x = -swing;
                mob.mesh.legs[3].rotation.x = swing;
            }

            if (mob.isGrounded) {
                mob.stepTimer -= delta;
                if (mob.stepTimer <= 0) {
                    mob.stepTimer = 0.36;
                    if (distToPlayer < 14 && this.soundManager) {
                        this.soundManager.playSheepStep();
                    }
                }
            }
        } else {
            mob.velocity.x *= 0.5;
            mob.velocity.z *= 0.5;
            if (mob.mesh.legs) mob.mesh.legs.forEach(l => l.rotation.x = 0);
        }

        this.applyMobPhysics(mob, delta);
    }

    updateZombie(mob, delta, pPos) {
        const distToPlayer = mob.mesh.position.distanceTo(pPos);

        mob.soundTimer -= delta;
        if (mob.soundTimer <= 0) {
            mob.soundTimer = 5 + Math.random() * 8;
            if (distToPlayer < 22 && this.soundManager) {
                this.soundManager.playZombieGroan();
            }
        }

        if (distToPlayer < 18) {
            const dx = pPos.x - mob.mesh.position.x;
            const dz = pPos.z - mob.mesh.position.z;
            mob.targetYaw = Math.atan2(dx, dz);
            mob.isMoving = true;
        } else {
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

        const moveSpeed = mob.isMoving ? 2.5 : 0;
        if (mob.isMoving) {
            mob.velocity.x = Math.sin(mob.yaw) * moveSpeed;
            mob.velocity.z = Math.cos(mob.yaw) * moveSpeed;

            mob.walkCycle += delta * 6.5;
            const swing = Math.sin(mob.walkCycle) * 0.5;
            if (mob.mesh.legs && mob.mesh.legs.length === 2) {
                mob.mesh.legs[0].rotation.x = swing;
                mob.mesh.legs[1].rotation.x = -swing;
            }
        } else {
            mob.velocity.x *= 0.5;
            mob.velocity.z *= 0.5;
        }

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

    // ================= SOLID BLOCK PHYSICS & AABB COLLISION =================
    applyMobPhysics(mob, delta) {
        const r = (mob.type === 'sheep') ? 0.38 : 0.3;
        const h = (mob.type === 'sheep') ? 0.9 : 1.8;

        // Apply gravity
        mob.velocity.y -= 24.0 * delta;

        // --- 1. HORIZONTAL X COLLISION (Prevents walking inside grass blocks) ---
        let dx = mob.velocity.x * delta;
        if (dx !== 0) {
            const checkX = mob.mesh.position.x + dx + (dx > 0 ? r : -r);
            const footY = mob.mesh.position.y + 0.15;
            const chestY = mob.mesh.position.y + Math.min(0.75, h - 0.1);

            const hitFoot = this.isSolid(checkX, footY, mob.mesh.position.z);
            const hitChest = this.isSolid(checkX, chestY, mob.mesh.position.z);

            if (hitFoot || hitChest) {
                // If only 1-block high obstacle, step up onto top of grass block
                const headAboveY = mob.mesh.position.y + 1.15;
                const canStepUp = hitFoot && !hitChest && !this.isSolid(checkX, headAboveY, mob.mesh.position.z);

                if (canStepUp && mob.isGrounded) {
                    mob.mesh.position.y = Math.floor(footY) + 1.0;
                    mob.mesh.position.x += dx;
                } else {
                    // Block is solid barrier! Completely block penetration
                    dx = 0;
                    mob.velocity.x = 0;
                    mob.targetYaw += (Math.random() > 0.5 ? 1 : -1) * 1.6;
                }
            } else {
                mob.mesh.position.x += dx;
            }
        }

        // --- 2. HORIZONTAL Z COLLISION (Prevents walking inside grass blocks) ---
        let dz = mob.velocity.z * delta;
        if (dz !== 0) {
            const checkZ = mob.mesh.position.z + dz + (dz > 0 ? r : -r);
            const footY = mob.mesh.position.y + 0.15;
            const chestY = mob.mesh.position.y + Math.min(0.75, h - 0.1);

            const hitFoot = this.isSolid(mob.mesh.position.x, footY, checkZ);
            const hitChest = this.isSolid(mob.mesh.position.x, chestY, checkZ);

            if (hitFoot || hitChest) {
                const headAboveY = mob.mesh.position.y + 1.15;
                const canStepUp = hitFoot && !hitChest && !this.isSolid(mob.mesh.position.x, headAboveY, checkZ);

                if (canStepUp && mob.isGrounded) {
                    mob.mesh.position.y = Math.floor(footY) + 1.0;
                    mob.mesh.position.z += dz;
                } else {
                    dz = 0;
                    mob.velocity.z = 0;
                    mob.targetYaw += (Math.random() > 0.5 ? 1 : -1) * 1.6;
                }
            } else {
                mob.mesh.position.z += dz;
            }
        }

        // Clamp to map borders
        mob.mesh.position.x = Math.max(this.WORLD_MIN, Math.min(this.WORLD_MAX, mob.mesh.position.x));
        mob.mesh.position.z = Math.max(this.WORLD_MIN, Math.min(this.WORLD_MAX, mob.mesh.position.z));

        // --- 3. VERTICAL GROUND COLLISION (Stands firmly on top of grass) ---
        const dy = mob.velocity.y * delta;
        mob.mesh.position.y += dy;

        const underY = mob.mesh.position.y;
        const groundHit = this.isSolid(mob.mesh.position.x, underY - 0.04, mob.mesh.position.z) ||
                          this.isSolid(mob.mesh.position.x + r * 0.6, underY - 0.04, mob.mesh.position.z) ||
                          this.isSolid(mob.mesh.position.x - r * 0.6, underY - 0.04, mob.mesh.position.z) ||
                          this.isSolid(mob.mesh.position.x, underY - 0.04, mob.mesh.position.z + r * 0.6) ||
                          this.isSolid(mob.mesh.position.x, underY - 0.04, mob.mesh.position.z - r * 0.6);

        if (groundHit) {
            // Place feet precisely on top surface of block (y = by + 1.0)
            mob.mesh.position.y = Math.floor(underY - 0.04) + 1.0;
            mob.velocity.y = 0;
            mob.isGrounded = true;
        } else {
            // Anti-sink: if slightly clipped inside grass block, push directly to surface
            if (this.isSolid(mob.mesh.position.x, mob.mesh.position.y + 0.08, mob.mesh.position.z)) {
                mob.mesh.position.y = Math.floor(mob.mesh.position.y + 0.08) + 1.0;
                mob.velocity.y = 0;
                mob.isGrounded = true;
            } else {
                mob.isGrounded = false;
            }
        }

        // Hurt flash reset
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

        mob.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.visible !== false) {
                if (!child.userData.origColor) child.userData.origColor = child.material.color.getHex();
                child.material.color.setHex(0xff3333);
            }
        });

        if (playerPos) {
            const kbDir = new THREE.Vector3().subVectors(mob.mesh.position, playerPos).normalize();
            mob.velocity.x += kbDir.x * 5.5;
            mob.velocity.z += kbDir.z * 5.5;
            mob.velocity.y = 4.0;
            mob.isGrounded = false;
        }

        if (mob.type === 'sheep') {
            if (this.soundManager) this.soundManager.playSheepHurt();
        } else if (mob.type === 'zombie') {
            if (this.soundManager) this.soundManager.playZombieHurt();
        }

        if (mob.health <= 0) {
            this.killMob(mob);
        }
    }

    killMob(mob) {
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
