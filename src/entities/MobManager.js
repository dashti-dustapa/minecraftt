/**
 * MobManager.js
 * Controls passive Sheep and hostile Night Zombies with path-tracking,
 * attack cooldowns, damage reactions, and daylight burning.
 */

import * as THREE from 'three';

export class MobManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.mobs = []; // Sheep
        this.zombies = []; // Hostile Zombies
        this.hitMeshes = [];

        this.zombieSpawnTimer = 0;
        this.initMaterials();
        this.spawnInitialSheep(4);
    }

    initMaterials() {
        this.materials = {
            wool: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
            sheepHead: new THREE.MeshLambertMaterial({ color: 0xd9b38c }),
            sheepLeg: new THREE.MeshLambertMaterial({ color: 0x4a3c31 }),
            hitFlash: new THREE.MeshBasicMaterial({ color: 0xff3333 }),

            // Zombie Materials
            zombieSkin: new THREE.MeshLambertMaterial({ color: 0x4a7337 }),
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

    /* ---------------- SHEEP LOGIC ---------------- */

    createSheep() {
        const sheepGroup = new THREE.Group();

        const bodyGeom = new THREE.BoxGeometry(0.8, 0.65, 1.1);
        const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.wool);
        bodyMesh.position.set(0, 0.75, 0);
        sheepGroup.add(bodyMesh);

        const headGeom = new THREE.BoxGeometry(0.35, 0.35, 0.4);
        const headMesh = new THREE.Mesh(headGeom, this.materials.sheepHead);
        headMesh.position.set(0, 0.95, 0.65);
        sheepGroup.add(headMesh);

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

    /* ---------------- ZOMBIE LOGIC ---------------- */

    createZombie() {
        const zombieGroup = new THREE.Group();

        // 1. Head
        const headGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMesh = new THREE.Mesh(headGeom, this.materials.zombieSkin);
        headMesh.position.set(0, 1.6, 0);
        zombieGroup.add(headMesh);

        // 2. Torso
        const bodyGeom = new THREE.BoxGeometry(0.5, 0.65, 0.28);
        const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.zombieShirt);
        bodyMesh.position.set(0, 1.05, 0);
        zombieGroup.add(bodyMesh);

        // 3. Arms Outstretched
        const armGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
        const leftArm = new THREE.Mesh(armGeom, this.materials.zombieSkin);
        leftArm.position.set(-0.35, 1.15, 0.3);
        leftArm.rotation.x = -Math.PI / 2;
        zombieGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeom, this.materials.zombieSkin);
        rightArm.position.set(0.35, 1.15, 0.3);
        rightArm.rotation.x = -Math.PI / 2;
        zombieGroup.add(rightArm);

        // 4. Legs
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
            moveSpeed: 2.1,
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

        // Spawn in outer radius around player (11-15 blocks away)
        const angle = Math.random() * Math.PI * 2;
        const dist = 11 + Math.random() * 4;
        const x = Math.max(-14, Math.min(14, playerPos.x + Math.cos(angle) * dist));
        const z = Math.max(-14, Math.min(14, playerPos.z + Math.sin(angle) * dist));
        const y = this.getGroundHeight(x, z);

        zombie.group.position.set(x, y, z);
        this.scene.add(zombie.group);
        this.zombies.push(zombie);
    }

    /* ---------------- COMBAT & INTERACTIONS ---------------- */

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

        // Knockback away from player
        const knockDir = new THREE.Vector3().subVectors(mob.group.position, playerPos);
        knockDir.y = 0;
        knockDir.normalize();
        mob.group.position.addScaledVector(knockDir, 0.8);

        // Death logic
        if (mob.health <= 0) {
            this.scene.remove(mob.group);
            this.mobs = this.mobs.filter(m => m !== mob);
            this.zombies = this.zombies.filter(z => z !== mob);
            this.hitMeshes = this.hitMeshes.filter(m => m.userData.parentMob !== mobGroup);
        }
    }

    /* ---------------- UPDATE LOOP ---------------- */

    update(delta, dayTime) {
        const playerPos = this.player.pos || this.player.position;
        const sunAngle = dayTime * Math.PI * 2;
        const isNight = Math.sin(sunAngle) < -0.15;

        // Zombie Spawner in Nighttime
        if (isNight) {
            this.zombieSpawnTimer += delta;
            if (this.zombieSpawnTimer >= 5.0 && this.zombies.length < 3) {
                this.zombieSpawnTimer = 0;
                this.spawnNightZombie(playerPos);
            }
        } else {
            this.zombieSpawnTimer = 0;
        }

        // Update Sheep
        for (let i = 0; i < this.mobs.length; i++) {
            const mob = this.mobs[i];

            if (mob.hitTimer > 0) {
                mob.hitTimer -= delta;
                if (mob.hitTimer <= 0) {
                    mob.bodyMesh.material = this.materials.wool;
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

        // Update Hostile Zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];

            // Burn in daylight
            if (!isNight) {
                z.health -= delta * 5;
                z.bodyMesh.material = this.materials.zombieBurn;
                if (z.health <= 0) {
                    this.scene.remove(z.group);
                    this.hitMeshes = this.hitMeshes.filter(m => m.userData.parentMob !== z.group);
                    this.zombies.splice(i, 1);
                    continue;
                }
            } else if (z.hitTimer > 0) {
                z.hitTimer -= delta;
                if (z.hitTimer <= 0) {
                    z.bodyMesh.material = this.materials.zombieShirt;
                }
            }

            // Pathfinding towards player
            if (playerPos) {
                const dx = playerPos.x - z.group.position.x;
                const dz = playerPos.z - z.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                const angle = Math.atan2(dx, dz);
                z.group.rotation.y = angle;

                if (dist > 1.25) {
                    // Chase player
                    const speed = z.moveSpeed * delta;
                    z.group.position.x += Math.sin(angle) * speed;
                    z.group.position.z += Math.cos(angle) * speed;

                    z.walkTimer += delta * 6;
                    const swing = Math.sin(z.walkTimer) * 0.5;
                    z.leftLeg.rotation.x = swing;
                    z.rightLeg.rotation.x = -swing;
                } else {
                    // Attack Player
                    z.leftLeg.rotation.x = 0;
                    z.rightLeg.rotation.x = 0;

                    if (z.attackCooldown <= 0) {
                        z.attackCooldown = 1.2; // Attack every 1.2 seconds
                        if (typeof this.player.health === 'number') {
                            this.player.health = Math.max(0, this.player.health - 3);
                            if (typeof this.player.onDamage === 'function') {
                                this.player.onDamage();
                            }
                            if (typeof this.player.onStatsChange === 'function') {
                                this.player.onStatsChange();
                            }
                        }
                    }
                }

                if (z.attackCooldown > 0) {
                    z.attackCooldown -= delta;
                }
            }

            z.group.position.y = this.getGroundHeight(z.group.position.x, z.group.position.z);
        }
    }
}
