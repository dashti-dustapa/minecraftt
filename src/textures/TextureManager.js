/**
 * TextureManager.js
 * Procedural 16x16 pixel-art texture generator for Minecraft blocks.
 */

const THREE = window.THREE;

export class TextureManager {
    constructor() {
        this.textures = {};
        this.materials = {};
        this.generateTextures();
    }

    createPixelCanvas(drawFn) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    generateTextures() {
        // 1. Dirt Texture
        this.textures.dirt = this.createPixelCanvas((ctx) => {
            ctx.fillStyle = '#866043';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 45; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#68482f' : '#9b7454';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        // 2. Grass Top Texture
        this.textures.grass_top = this.createPixelCanvas((ctx) => {
            ctx.fillStyle = '#5b8c32';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#4c7828' : '#6ba53b';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        // 3. Grass Side Texture
        this.textures.grass_side = this.createPixelCanvas((ctx) => {
            // Dirt base
            ctx.fillStyle = '#866043';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 35; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#68482f' : '#9b7454';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            // Grass overlay on top
            ctx.fillStyle = '#5b8c32';
            ctx.fillRect(0, 0, 16, 4);
            for (let x = 0; x < 16; x++) {
                const drip = Math.floor(Math.random() * 3);
                ctx.fillRect(x, 4, 1, drip);
            }
        });

        // 4. Stone Texture
        this.textures.stone = this.createPixelCanvas((ctx) => {
            ctx.fillStyle = '#787878';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 50; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#5e5e5e' : '#8c8c8c';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        // 5. Wood Plank Texture
        this.textures.plank = this.createPixelCanvas((ctx) => {
            ctx.fillStyle = '#9c7849';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(0, 3, 16, 1);
            ctx.fillRect(0, 7, 16, 1);
            ctx.fillRect(0, 11, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
        });

        // 6. Cobblestone Texture
        this.textures.cobblestone = this.createPixelCanvas((ctx) => {
            ctx.fillStyle = '#6c6c6c';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#3a3a3a';
            for (let y = 0; y < 16; y += 4) {
                ctx.fillRect(0, y, 16, 1);
            }
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#4f4f4f' : '#8a8a8a';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 2, 1);
            }
        });

        // Setup materials
        this.materials.dirt = new THREE.MeshLambertMaterial({ map: this.textures.dirt });
        this.materials.stone = new THREE.MeshLambertMaterial({ map: this.textures.stone });
        this.materials.plank = new THREE.MeshLambertMaterial({ map: this.textures.plank });
        this.materials.cobblestone = new THREE.MeshLambertMaterial({ map: this.textures.cobblestone });

        // Grass block requires multi-face materials: [East, West, Top, Bottom, North, South]
        this.materials.grass = [
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_top }),
            new THREE.MeshLambertMaterial({ map: this.textures.dirt }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side })
        ];
    }
}
