/**
 * TextureManager.js
 * Procedural 16x16 pixel textures, 3D block materials,
 * and 2D UI item icon generators for Inventory/Hotbar.
 */

import * as THREE from 'three';

export class TextureManager {
    constructor() {
        this.textures = {};
        this.materials = {};
        this.itemIcons = {};
        this.initTextures();
        this.initMaterials();
        this.initItemIcons();
    }

    createPixelCanvas(drawFn) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx);
        return canvas;
    }

    createPixelTexture(drawFn) {
        const canvas = this.createPixelCanvas(drawFn);
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    initTextures() {
        this.textures.dirt = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#866043';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#68482f' : '#9b7454';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        this.textures.grass_top = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#5b8c32';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#4c7828' : '#6ba53b';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        this.textures.grass_side = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#866043';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 35; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#68482f' : '#9b7454';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#5b8c32';
            ctx.fillRect(0, 0, 16, 4);
            for (let x = 0; x < 16; x++) ctx.fillRect(x, 4, 1, Math.floor(Math.random() * 3));
        });

        this.textures.stone = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#787878';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 50; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#5e5e5e' : '#8c8c8c';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
        });

        this.textures.cobble = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#6c6c6c';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#3a3a3a';
            for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
            for (let i = 0; i < 35; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#4f4f4f' : '#8a8a8a';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 2, 1);
            }
        });

        this.textures.plank = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#9c7849';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(0, 3, 16, 1);
            ctx.fillRect(0, 7, 16, 1);
            ctx.fillRect(0, 11, 16, 1);
        });

        this.textures.log_side = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#6d5332';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#48361f';
            for (let x = 0; x < 16; x += 4) ctx.fillRect(x, 0, 2, 16);
        });

        this.textures.log_top = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#8f6f47';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#6d5332';
            ctx.fillRect(3, 3, 10, 10);
            ctx.fillStyle = '#48361f';
            ctx.fillRect(6, 6, 4, 4);
        });

        this.textures.torch = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(6, 4, 4, 12);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(6, 1, 4, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(7, 2, 2, 2);
        });

        this.textures.glass = this.createPixelTexture(ctx => {
            ctx.clearRect(0, 0, 16, 16);
            ctx.strokeStyle = '#c4e3f3';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, 16, 16);
            ctx.fillStyle = '#e8f7ff';
            ctx.fillRect(3, 3, 2, 2);
            ctx.fillRect(10, 10, 3, 1);
        });

        this.textures.water = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#2e5ec4';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#3b6ddb' : '#23499e';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 2, 1);
            }
        });

        this.textures.diamond = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#787878';
            ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#5e5e5e' : '#8c8c8c';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#4cedd9';
            for (let i = 0; i < 16; i++) {
                ctx.fillRect(Math.floor(Math.random() * 14) + 1, Math.floor(Math.random() * 14) + 1, 2, 2);
            }
        });

        this.textures.crafting_table = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#9c7849';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#5c4028';
            ctx.strokeRect(1, 1, 14, 14);
            ctx.fillStyle = '#3a2412';
            ctx.fillRect(4, 4, 3, 8);
            ctx.fillRect(9, 4, 3, 8);
        });
    }

    initMaterials() {
        this.materials.grass = [
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_top }),
            new THREE.MeshLambertMaterial({ map: this.textures.dirt }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.grass_side })
        ];

        this.materials.dirt = new THREE.MeshLambertMaterial({ map: this.textures.dirt });
        this.materials.stone = new THREE.MeshLambertMaterial({ map: this.textures.stone });
        this.materials.cobble = new THREE.MeshLambertMaterial({ map: this.textures.cobble });
        this.materials.plank = new THREE.MeshLambertMaterial({ map: this.textures.plank });
        this.materials.log = [
            new THREE.MeshLambertMaterial({ map: this.textures.log_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.log_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.log_top }),
            new THREE.MeshLambertMaterial({ map: this.textures.log_top }),
            new THREE.MeshLambertMaterial({ map: this.textures.log_side }),
            new THREE.MeshLambertMaterial({ map: this.textures.log_side })
        ];
        this.materials.torch = new THREE.MeshBasicMaterial({ map: this.textures.torch, transparent: true });
        this.materials.glass = new THREE.MeshLambertMaterial({ map: this.textures.glass, transparent: true, opacity: 0.45 });
        this.materials.water = new THREE.MeshLambertMaterial({ map: this.textures.water, transparent: true, opacity: 0.65 });
        this.materials.diamond = new THREE.MeshLambertMaterial({ map: this.textures.diamond });
        this.materials.crafting_table = new THREE.MeshLambertMaterial({ map: this.textures.crafting_table });
    }

    initItemIcons() {
        // Generates crisp 2D Data-URLs for inventory slots
        const makeIcon = (drawFn) => this.createPixelCanvas(drawFn).toDataURL();

        this.itemIcons[0] = makeIcon(ctx => { // Grass
            ctx.fillStyle = '#866043'; ctx.fillRect(1, 6, 14, 9);
            ctx.fillStyle = '#5b8c32'; ctx.fillRect(1, 1, 14, 5);
        });
        this.itemIcons[1] = makeIcon(ctx => { // Dirt
            ctx.fillStyle = '#866043'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#68482f'; ctx.fillRect(3, 4, 3, 3); ctx.fillRect(9, 8, 3, 3);
        });
        this.itemIcons[2] = makeIcon(ctx => { // Stone
            ctx.fillStyle = '#787878'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#5e5e5e'; ctx.fillRect(4, 3, 4, 4); ctx.fillRect(8, 9, 4, 4);
        });
        this.itemIcons[3] = makeIcon(ctx => { // Cobble
            ctx.fillStyle = '#6c6c6c'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#3a3a3a'; ctx.strokeRect(2, 2, 12, 12);
        });
        this.itemIcons[4] = makeIcon(ctx => { // Planks
            ctx.fillStyle = '#9c7849'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#6b4f2c'; ctx.fillRect(1, 5, 14, 1); ctx.fillRect(1, 10, 14, 1);
        });
        this.itemIcons[5] = makeIcon(ctx => { // Torch
            ctx.fillStyle = '#ffaa00'; ctx.fillRect(6, 2, 4, 4);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 3, 2, 2);
            ctx.fillStyle = '#6b4f2c'; ctx.fillRect(7, 6, 2, 8);
        });
        this.itemIcons[6] = makeIcon(ctx => { // Glass
            ctx.strokeStyle = '#c4e3f3'; ctx.lineWidth = 1; ctx.strokeRect(2, 2, 12, 12);
            ctx.fillStyle = '#e8f7ff'; ctx.fillRect(4, 4, 3, 3);
        });
        this.itemIcons[7] = makeIcon(ctx => { // Water
            ctx.fillStyle = '#2e5ec4'; ctx.fillRect(2, 3, 12, 10);
            ctx.fillStyle = '#5684e8'; ctx.fillRect(4, 5, 4, 2);
        });
        this.itemIcons[8] = makeIcon(ctx => { // Diamond Ore
            ctx.fillStyle = '#787878'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#4cedd9'; ctx.fillRect(4, 4, 3, 3); ctx.fillRect(9, 8, 4, 4);
        });
        this.itemIcons[9] = makeIcon(ctx => { // Oak Log
            ctx.fillStyle = '#6d5332'; ctx.fillRect(2, 1, 12, 14);
            ctx.fillStyle = '#8f6f47'; ctx.fillRect(4, 1, 8, 3);
        });
        this.itemIcons[10] = makeIcon(ctx => { // Crafting Table
            ctx.fillStyle = '#9c7849'; ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#5c4028'; ctx.strokeRect(2, 2, 12, 12);
            ctx.fillStyle = '#26150a'; ctx.fillRect(4, 4, 3, 3);
        });
        this.itemIcons[11] = makeIcon(ctx => { // Stick
            ctx.fillStyle = '#6b4f2c';
            for (let i = 0; i < 10; i++) ctx.fillRect(12 - i, 3 + i, 2, 2);
        });
        this.itemIcons[12] = makeIcon(ctx => { // Wooden Pickaxe
            ctx.fillStyle = '#9c7849'; ctx.fillRect(4, 2, 8, 3); ctx.fillRect(3, 4, 2, 3);
            ctx.fillStyle = '#6b4f2c';
            for (let i = 0; i < 8; i++) ctx.fillRect(10 - i, 6 + i, 2, 2);
        });
        this.itemIcons[13] = makeIcon(ctx => { // Wooden Sword
            ctx.fillStyle = '#9c7849';
            for (let i = 0; i < 7; i++) ctx.fillRect(11 - i, 3 + i, 3, 3);
            ctx.fillStyle = '#4a3319'; ctx.fillRect(5, 9, 3, 3);
            ctx.fillStyle = '#6b4f2c'; ctx.fillRect(3, 11, 2, 2);
        });
        this.itemIcons[14] = makeIcon(ctx => { // Diamond Sword
            ctx.fillStyle = '#4cedd9';
            for (let i = 0; i < 7; i++) ctx.fillRect(11 - i, 3 + i, 3, 3);
            ctx.fillStyle = '#267b70'; ctx.fillRect(5, 9, 3, 3);
            ctx.fillStyle = '#6b4f2c'; ctx.fillRect(3, 11, 2, 2);
        });
    }

    getItemIcon(blockId) {
        return this.itemIcons[blockId] || null;
    }

    getBlockMaterial(blockId) {
        switch (blockId) {
            case 0: return this.materials.grass;
            case 1: return this.materials.dirt;
            case 2: return this.materials.stone;
            case 3: return this.materials.cobble;
            case 4: return this.materials.plank;
            case 5: return this.materials.torch;
            case 6: return this.materials.glass;
            case 7: return this.materials.water;
            case 8: return this.materials.diamond;
            case 9: return this.materials.log;
            case 10: return this.materials.crafting_table;
            default: return this.materials.stone;
        }
    }
}
