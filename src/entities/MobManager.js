/**
 * MobManager.js
 * Voxel Animals (Sheep) & Monsters (Zombies) with 3D leg-swing animations,
 * pathfinding AI, knockback, and survival damage.
 */

const THREE = window.THREE;

export class MobManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.mobs = [];
        this.spawnTimer = 0;
        this.attackCooldown = 0;

        // Base Shared Materials
        this.matWool = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        this.matSkin = new THREE.MeshLambertMaterial({ color: 0xd9b38c });
        this.matZombieSkin = new THREE.MeshLambertMaterial({ color: 0x477038 });
        this.matShirt = new THREE.MeshLambertMaterial({ color: 0x2e86ab });
        this.matPants = new THREE.MeshLambertMaterial({ color: 0x263859 });
        this.matHurt = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Initial spawn of peaceful sheep
        for (let i = 0; i < 4; i++) {
            this.spawnSheep((Math.random() - 0.5) * 20, 10, (Math.random() - 0.5) * 20);
        }
    }

    createSheepMesh() {
        const group = new THREE.Group();

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.3), this.matWool);
        body.position.y = 0.7;
        group.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.matSkin);
        head.position.set(0, 1.1, 0.75);
        group.add(head);

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.22, 0.6, 0.22);
        const legs = [];
        const offsets = [
            [-0.3, 0.3, 0.45],
            [0.3, 0.3, 0.45],
            [-0.3, 0.3, -0.45],
            [0.3, 0.3, -0.45]
        ];

        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeom, this.matSkin);
            leg.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
            group.add(leg);
            legs.push(leg);
        }

        group.userData = { type: 'sheep', legs: legs, bodyParts: [body, head, ...legs] };
        return group;
    }

    createZombieMesh() {
        const group = new THREE.Group();

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.matZombieSkin);
        head.position.y = 1.65;
        group.add(head);

        // Torso
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.3), this.matShirt);
        body.position.y = 1.05;
        group.add(body);

        // Arms (Outstretched forward)
        const armGeom = new THREE.BoxGeometry(0.2, 0.2, 0.65);
        const leftArm = new THREE.Mesh(armGeom, this.matZombieSkin);
        leftArm.position.set(-0.42, 1.15, 0.35);
        const rightArm = new THREE.Mesh(armGeom, this.matZombieSkin);
        rightArm.position.set(0.42, 1.15, 0.35);
        group.add(leftArm);
        group.add(rightArm);

        // Legs
        const legGeom = new THREE.BoxGeometry(0.24, 0.7, 0.24);
        const leftLeg = new THREE.Mesh(legGeom, this.matPants);
        leftLeg.position.set(-0.16, 0.35, 0);
        const rightLeg = new THREE.Mesh(legGeom, this.matPants);
        rightLeg.position.set(0.16, 0.35, 0);
        group.add(leftLeg);
        group.add(rightLeg);

        const allParts = [head, body, leftArm, rightArm, leftLeg, rightLeg];
        group.userData = { type: 'zombie', legs: [leftLeg, rightLeg], bodyParts: allParts };
        return group;
    }

    spawnSheep(x, y, z) {
        const mesh = this.createSheepMesh();
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.mobs.push({
            mesh: mesh,
            type: 'sheep',
            health: 8,
            vel: new THREE.Vector3(),
            targetPos: new THREE.Vector3(x, y, z),
            changeTimer: 0,
            hurtTime: 0,
            animTime: 0
        });
    }

    spawnZombie(x, y, z) {
        const mesh = this.createZombieMesh();
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.mobs.push({
            mesh: mesh,
            type: 'zombie',
            health: 12,
            vel: new THREE.Vector3(),
            hurtTime: 0,
            animTime: 0
        });
    }

    hitMob(mesh, fromPosition) {
        const mob = this.mobs.find(m => m.mesh === mesh || m.mesh.children.includes(mesh));
        if (!mob) return;

        mob.health -= 4;
        mob.hurtTime = 0.25;

        // Knockback physics
        const knockDir = new THREE.Vector3().subVectors(mob.mesh.position, fromPosition).normalize();
        mob.vel.x = knockDir.x * 6;
        mob.vel.y = 4.5;
        mob.vel.z = knockDir.z * 6;

        // Flash Red
        mob.mesh.userData.bodyParts.forEach(p => p.material = this.matHurt);

        if (mob.health <= 0) {
            this.scene.remove(mob.mesh);
            this.mobs = this.mobs.filter(m => m !== mob);
        }
    }

    getHitMeshes() {
        const list = [];
        this.mobs.forEach(m => {
            m.mesh.traverse(child => {
                if (child.isMesh) list.push(child);
            });
        });
        return list;
    }

    update(delta, dayTime) {
        const isNight = (dayTime > 0.45 && dayTime < 0.95);
        this.spawnTimer += delta;
        this.attackCooldown = Math.max(0, this.attackCooldown - delta);

        // Night Zombie Spawner (Cap at 3 zombies)
        if (isNight && this.spawnTimer > 10.0) {
            this.spawnTimer = 0;
            const zombieCount = this.mobs.filter(m => m.type === 'zombie').length;
            if (zombieCount < 3) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 14 + Math.random() * 8;
                const sx = this.player.pos.x + Math.sin(angle) * dist;
                const sz = this.player.pos.z + Math.cos(angle) * dist;
                this.spawnZombie(sx, 12, sz);
            }
        }

        // Loop through all active mobs
        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];

            // Hurt visual recovery
            if (mob.hurtTime > 0) {
                mob.hurtTime -= delta;
                if (mob.hurtTime <= 0) {
                    // Reset materials
                    if (mob.type === 'sheep') {
                        mob.mesh.userData.bodyParts[0].material = this.matWool;
                        for (let p = 1; p < mob.mesh.userData.bodyParts.length; p++) {
                            mob.mesh.userData.bodyParts[p].material = this.matSkin;
                        }
                    } else {
                        mob.mesh.userData.bodyParts[0].material = this.matZombieSkin;
                        mob.mesh.userData.bodyParts[1].material = this.matShirt;
                        mob.mesh.userData.bodyParts[2].material = this.matZombieSkin;
                        mob.mesh.userData.bodyParts[3].material = this.matZombieSkin;
                        mob.mesh.userData.bodyParts[4].material = this.matPants;
                        mob.mesh.userData.bodyParts[5].material = this.matPants;
                    }
                }
            }

            // Sunlight burns zombies away
            if (mob.type === 'zombie' && !isNight) {
                this.scene.remove(mob.mesh);
                this.mobs.splice(i, 1);
                continue;
            }

            const distToPlayer = mob.mesh.position.distanceTo(this.player.pos);

            // AI Decision
            let moveDir = new THREE.Vector3();

            if (mob.type === 'zombie') {
                // Chase player if close
                if (distToPlayer < 18) {
                    moveDir.subVectors(this.player.pos, mob.mesh.position);
                    moveDir.y = 0;
                    moveDir.normalize();
                    mob.mesh.lookAt(this.player.pos.x, mob.mesh.position.y, this.player.pos.z);

                    // Attack player
                    if (distToPlayer < 1.3 && this.attackCooldown === 0) {
                        this.player.takeDamage(3); // 1.5 hearts
                        this.attackCooldown = 1.2;
                    }
                }
            } else {
                // Sheep wanders calmly
                mob.changeTimer -= delta;
                if (mob.changeTimer <= 0) {
                    mob.changeTimer = 3 + Math.random() * 4;
                    mob.targetPos.set(
                        mob.mesh.position.x + (Math.random() - 0.5) * 10,
                        mob.mesh.position.y,
                        mob.mesh.position.z + (Math.random() - 0.5) * 10
                    );
                }
                moveDir.subVectors(mob.targetPos, mob.mesh.position);
                moveDir.y = 0;
                if (moveDir.length() > 0.5) {
                    moveDir.normalize();
                    mob.mesh.lookAt(mob.targetPos.x, mob.mesh.position.y, mob.targetPos.z);
                } else {
                    moveDir.set(0, 0, 0);
                }
            }

            // Movement physics
            const speed = (mob.type === 'zombie') ? 2.4 : 1.2;
            mob.vel.x = moveDir.x * speed;
            mob.vel.z = moveDir.z * speed;
            mob.vel.y -= 20.0 * delta;

            const nextX = mob.mesh.position.x + mob.vel.x * delta;
            const nextZ = mob.mesh.position.z + mob.vel.z * delta;
            const checkY = Math.floor(mob.mesh.position.y);

            // Jump over 1-block obstacles
            if (this.world.isSolid(Math.floor(nextX), checkY, Math.floor(nextZ))) {
                if (!this.world.isSolid(Math.floor(nextX), checkY + 1, Math.floor(nextZ))) {
                    mob.vel.y = 6.0;
                }
            }

            // Ground Floor Collision
            const nextY = mob.mesh.position.y + mob.vel.y * delta;
            const groundBlock = this.world.isSolid(Math.floor(nextX), Math.floor(nextY), Math.floor(nextZ));

            if (!groundBlock) {
                mob.mesh.position.y = nextY;
            } else {
                mob.vel.y = 0;
                mob.mesh.position.y = Math.floor(nextY) + 1.0;
            }

            mob.mesh.position.x = nextX;
            mob.mesh.position.z = nextZ;

            // Leg Swing Animation
            const isMoving = (moveDir.lengthSq() > 0);
            if (isMoving) {
                mob.animTime += delta * 8;
                const angle = Math.sin(mob.animTime) * 0.6;
                mob.mesh.userData.legs.forEach((leg, idx) => {
                    leg.rotation.x = (idx % 2 === 0) ? angle : -angle;
                });
            } else {
                mob.mesh.userData.legs.forEach(leg => leg.rotation.x = 0);
            }
        }
    }
}
