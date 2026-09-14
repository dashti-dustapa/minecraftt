/**
 * MobManager.js
 * Controls detailed Sheep and Zombies with procedural/file-based audio,
 * Minecraft head features, pathfinding, and fatal player damage.
 */

import * as THREE from 'three';

export class MobManager {
    constructor(scene, world, player, soundManager) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.soundManager = soundManager;

        this.mobs = [];
        this.zombies = [];
        this.hitMeshes = [];

        this.zombieSpawnTimer = 0;
        this.initMaterials();
        this.spawnInitialSheep(4);
    }

    initMaterials() {
        this.materials = {
            wool: new THREE.MeshLambertMaterial({ color: 0xefefef }),
            sheepSkin: new THREE.MeshLambertMaterial({ color: 0xd6af8b }),
            sheepEye: new THREE.MeshBasicMaterial({ color: 0x222222 }),
            sheepNose: new THREE.MeshLambertMaterial({ color: 0xcca090 }),
            sheepLeg: new THREE.MeshLambertMaterial({ color: 0x5a4838 }),
            hitFlash: new THREE.MeshBasicMaterial({ color: 0xff3333 }),

            // Zombie High-Detail Materials
            zombieSkin: new THREE.MeshLambertMaterial({ color: 0x4a7337 }),
            zombieDarkSkin: new THREE.MeshLambertMaterial({ color: 0x365427 }),
            zombieEye: new THREE.MeshBasicMaterial({ color: 0x111111 }),
            zombieShirt: new THREE.MeshLambertMaterial({ color: 0x228b8b }),
            zombiePants: new THREE.MeshLambertMaterial({ color: 0x253569 }),
            zombieBurn: new THREE.MeshBasicMaterial({ color: 0xff6600 })
        };
    }

    getGroundHeight(x, z) {
        if (this.world) {
            for (let y = 14; y >= 0; y--) {
                const block = this.world.getBlock(Math.floor(x), y, Math.floor(z));
                if (block !== null && block !== 7 && block !== 5) {
                    return y + 1.0;
                }
            }
        }
        return 4.0;
    }

    /* ---------------- HIGH-DETAIL SHEEP ---------------- */

    createSheep() {
        const sheepGroup = new THREE.Group();

        // 1. Multi-layer Wool Body
        const bodyGeom = new THREE.BoxGeometry(0.85, 0.7, 1.15);
        const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.wool);
        bodyMesh.position.set(0, 0.78, 0);
        sheepGroup.add(bodyMesh);

        // 2. Head
        const headGeom = new THREE.BoxGeometry(0.38, 0.38, 0.45);
        const headMesh = new THREE.Mesh(headGeom, this.materials.sheepSkin);
        headMesh.position.set(0, 0.95, 0.65);
        sheepGroup.add(headMesh);

        // Eyes (Left & Right)
        const eyeGeom = new THREE.BoxGeometry(0.06, 0.06, 0.02);
        const leftEye = new THREE.Mesh(eyeGeom, this.materials.sheepEye);
        leftEye.position.set(-0.14, 1.0, 0.88);
        sheepGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, this.materials.sheepEye);
        rightEye.position.set(0.14, 1.0, 0.88);
        sheepGroup.add(rightEye);

        // Pink Snout/Nose
        const noseGeom = new THREE.BoxGeometry(0.16, 0.1, 0.04);
        const noseMesh = new THREE.Mesh(noseGeom, this.materials.sheepNose);
        noseMesh.position.set(0, 0.87, 0.88);
        sheepGroup.add(noseMesh);

        // 3. Legs
        const legGeom = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        const legs = [];
        const legPositions = [
            [-0.25, 0.25, 0.35],
            [0.25, 0.25, 0.35],
            [-0.25, 0.25, -0.35],
            [0.25, 0.25, -0.35]
        ];

        legPositions.forEach(pos => {
            const legMesh = new THREE.Mesh(legGeom, this.materials.sheepLeg);
            legMesh.position.set(...pos);
            sheepGroup.add(legMesh);
            legs.push(legMesh);
        });

        bodyMesh.userData = { parentMob: sheepGroup, isZombie: false };
        headMesh.userData = { parentMob: sheepGroup, isZombie: false };
        this.hitMeshes.push(bodyMesh, headMesh);

        const mobData = {
            group: sheepGroup,
            bodyMesh: bodyMesh,
            legs: legs,
            health: 8,
            walkTimer: Math.random() * 10,
            soundTimer: 4 + Math.random() * 8, // Periodic Baaa
            moveSpeed: 1.2,
            targetAngle: Math.random() * Math.PI * 2,
            isMoving: false,
            changeDirTimer: 2 + Math.random() * 3,
            hitTimer: 0
        };

        sheepGroup.userData = mobData;
        return mobData;
    }

    spawnInitialSheep(count = 4) {
        for (let i = 0; i < count; i++) {
            const mob = this.createSheep();
            const x = (Math.random() - 0.5) * 18;
            const z = (Math.random() - 0.5) * 18;
            const y = this.getGroundHeight(x, z);

            mob.group.position.set(x, y, z);
            mob.group.rotation.y = Math.random() * Math.PI * 2;

            this.scene.add(mob.group);
            this.mobs.push(mob);
        }
    }

    /* ---------------- HIGH-DETAIL MINECRAFT ZOMBIE ---------------- */

    createZombie() {
        const zombieGroup = new THREE.Group();

        // 1. Head
        const headGeom = new THREE.BoxGeometry(0.42, 0.42, 0.42);
        const headMesh = new THREE.Mesh(headGeom, this.materials.zombieSkin);
        headMesh.position.set(0, 1.6, 0);
        zombieGroup.add(headMesh);

        // Hollow dark eyes
        const eyeGeom = new THREE.BoxGeometry(0.08, 0.06, 0.02);
        const leftEye = new THREE.Mesh(eyeGeom, this.materials.zombieEye);
        leftEye.position.set(-0.11, 1.62, 0.22);
        zombieGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, this.materials.zombieEye);
        rightEye.position.set(0.11, 1.62, 0.22);
        zombieGroup.add(rightEye);

        // 2. Torso (Shirt)
        const bodyGeom = new THREE.BoxGeometry(0.52, 0.68, 0.28);
        const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.zombieShirt);
        bodyMesh.position.set(0, 1.05, 0);
        zombieGroup.add(bodyMesh);

        // 3. Outstretched Arms
        const armGeom = new THREE.BoxGeometry(0.18, 0.62, 0.18);
        const leftArm = new THREE.Mesh(armGeom, this.materials.zombieSkin);
        leftArm.position.set(-0.35, 1.15, 0.32);
        leftArm.rotation.x = -Math.PI / 2;
        zombieGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeom, this.materials.zombieSkin);
        rightArm.position.set(0.35, 1.15, 0.32);
        rightArm.rotation.x = -Math.PI / 2;
        zombieGroup.add(rightArm);

        // 4. Pants & Legs
        const legGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const leftLeg = new THREE.Mesh(legGeom, this.materials.zombiePants);
        leftLeg.position.set(-0.14, 0.35, 0);
        zombieGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeom, this.materials.zombiePants);
        rightLeg.position.set(0.14, 0.35, 0);
        zombieGroup.add(rightLeg);

        bodyMesh.userData = { parentMob: zombieGroup, isZombie: true };
        headMesh.userData = { parentMob: zombieGroup, isZombie: true };
        this.hitMeshes.push(bodyMesh, headMesh);

        const zombieData = {
            group: zombieGroup,
            bodyMesh: bodyMesh,
            headMesh: headMesh,
            leftLeg: leftLeg,
            rightLeg: rightLeg,
            health: 16,
            walkTimer: 0,
            soundTimer: 2 + Math.random() * 5, // Periodic Groan
            moveSpeed: 2.2,
            attackCooldown: 0,
            hitTimer: 0,
            isZombie: true
        };

        zombieGroup.userData = zombieData;
        return zombieData;
    }

    spawnNightZombie(playerPos) {
        if (!playerPos) return;
        const zombie = this.createZombie();

        const angle = Math.random() * Math.PI * 2;
        const dist = 11 + Math.random() * 4;
        const x = Math.max(-14, Math.min(14, playerPos.x + Math.cos(angle) * dist));
        const z = Math.max(-14, Math.min(14, playerPos.z + Math.sin(angle) * dist));
        const y = this.getGroundHeight(x, z);

        zombie.group.position.set(x, y, z);
        this.scene.add(zombie.group);
        this.zombies.push(zombie);

        if (this.soundManager) this.soundManager.playZombieGroan();
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

        if (mob.bodyMesh) {
            mob.bodyMesh.material = this.materials.hitFlash;
        }

        // Trigger appropriate audio based on survival/death
        if (mob.isZombie && this.soundManager) {
            if (mob.health <= 0) {
                this.soundManager.playZombieDeath();
            } else {
                this.soundManager.playZombieHurt();
            }
        } else if (!mob.isZombie && this.soundManager) {
            this.soundManager.playSheepBaa();
        }

        const knockDir = new THREE.Vector3().subVectors(mob.group.position, playerPos);
        knockDir.y = 0;
        knockDir.normalize();
        mob.group.position.addScaledVector(knockDir, 0.8);

        if (mob.health <= 0) {
            this.scene.remove(mob.group);
            this.mobs = this.mobs.filter(m => m !== mob);
            this.zombies = this.zombies.filter(z => z !== mob);
            this.hitMeshes = this.hitMeshes.filter(m => m !== hitObject && m.userData.parentMob !== mobGroup);
        }
    }

    update(delta, dayTime) {
        const playerPos = this.player.pos || this.player.position;
        const sunAngle = dayTime * Math.PI * 2;
        const isNight = Math.sin(sunAngle) < -0.15;

        // Spawn Zombies in Night
        if (isNight) {
            this.zombieSpawnTimer += delta;
            if (this.zombieSpawnTimer >= 5.5 && this.zombies.length < 3) {
                this.zombieSpawnTimer = 0;
                this.spawnNightZombie(playerPos);
            }
        } else {
            this.zombieSpawnTimer = 0;
        }

        // Sheep Loop
        for (let i = 0; i < this.mobs.length; i++) {
            const mob = this.mobs[i];

            if (mob.hitTimer > 0) {
                mob.hitTimer -= delta;
                if (mob.hitTimer <= 0) mob.bodyMesh.material = this.materials.wool;
            }

            // Periodic Sheep Baa
            mob.soundTimer -= delta;
            if (mob.soundTimer <= 0) {
                mob.soundTimer = 9 + Math.random() * 12;
                if (this.soundManager && Math.random() > 0.4) {
                    this.soundManager.playSheepBaa();
                }
            }

            mob.changeDirTimer -= delta;
            if (mob.changeDirTimer <= 0) {
                mob.isMoving = Math.random() > 0.45;
                mob.targetAngle = Math.random() * Math.PI * 2;
                mob.changeDirTimer = 2.5 + Math.random() * 4;
            }

            if (mob.isMoving) {
                mob.group.rotation.y = mob.targetAngle;
                const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mob.targetAngle);
                mob.group.position.x += forward.x * mob.moveSpeed * delta;
                mob.group.position.z += forward.z * mob.moveSpeed * delta;

                mob.group.position.x = Math.max(-14, Math.min(14, mob.group.position.x));
                mob.group.position.z = Math.max(-14, Math.min(14, mob.group.position.z));

                mob.walkTimer += delta * 7;
                const swing = Math.sin(mob.walkTimer) * 0.45;
                mob.legs[0].rotation.x = swing;
                mob.legs[1].rotation.x = -swing;
                mob.legs[2].rotation.x = -swing;
                mob.legs[3].rotation.x = swing;
            } else {
                mob.legs.forEach(l => { l.rotation.x = 0; });
            }

            mob.group.position.y = this.getGroundHeight(mob.group.position.x, mob.group.position.z);
        }

        // Zombie Loop
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];

            // Burn in daylight
            if (!isNight) {
                z.health -= delta * 5;
                z.bodyMesh.material = this.materials.zombieBurn;
                if (z.health <= 0) {
                    if (this.soundManager) this.soundManager.playZombieDeath();
                    this.scene.remove(z.group);
                    this.hitMeshes = this.hitMeshes.filter(m => m.userData.parentMob !== z.group);
                    this.zombies.splice(i, 1);
                    continue;
                }
            } else if (z.hitTimer > 0) {
                z.hitTimer -= delta;
                if (z.hitTimer <= 0) z.bodyMesh.material = this.materials.zombieShirt;
            }

            // Periodic Zombie Groans
            z.soundTimer -= delta;
            if (z.soundTimer <= 0) {
                z.soundTimer = 5 + Math.random() * 7;
                if (this.soundManager) this.soundManager.playZombieGroan();
            }

            if (playerPos && !this.player.isDead) {
                const dx = playerPos.x - z.group.position.x;
                const dz = playerPos.z - z.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                const angle = Math.atan2(dx, dz);
                z.group.rotation.y = angle;

                if (dist > 1.25) {
                    const speed = z.moveSpeed * delta;
                    z.group.position.x += Math.sin(angle) * speed;
                    z.group.position.z += Math.cos(angle) * speed;

                    z.walkTimer += delta * 6;
                    const swing = Math.sin(z.walkTimer) * 0.5;
                    z.leftLeg.rotation.x = swing;
                    z.rightLeg.rotation.x = -swing;
                } else {
                    z.leftLeg.rotation.x = 0;
                    z.rightLeg.rotation.x = 0;

                    if (z.attackCooldown <= 0) {
                        z.attackCooldown = 1.1;
                        if (this.soundManager) {
                            this.soundManager.playPlayerHurt();
                            this.soundManager.playZombieGroan();
                        }
                        this.player.takeDamage(4);
                    }
                }

                if (z.attackCooldown > 0) z.attackCooldown -= delta;
            }

            z.group.position.y = this.getGroundHeight(z.group.position.x, z.group.position.z);
        }
    }
}
