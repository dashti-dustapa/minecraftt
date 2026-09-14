/**
 * Constants.js
 * Global block definitions, physical constants, and tools registry.
 */

export const WORLD_SIZE = 30;
export const SEA_LEVEL = 4;
export const GRAVITY = -26.0;
export const JUMP_VELOCITY = 8.5;

// Player dimensions and physics constants
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE_HEIGHT = 1.62;
export const PLAYER_RADIUS = 0.3;
export const WALK_SPEED = 4.6;
export const SPRINT_SPEED = 7.2;

export const BLOCK = {
    GRASS: 0,
    DIRT: 1,
    STONE: 2,
    COBBLE: 3,
    PLANK: 4,
    TORCH: 5,
    GLASS: 6,
    WATER: 7,
    DIAMOND: 8,
    LOG: 9,
    CRAFTING_TABLE: 10,
    STICK: 11,
    WOOD_PICKAXE: 12,
    WOOD_SWORD: 13,
    DIAMOND_SWORD: 14
};

export const BLOCK_DEFS = [
    { id: 0, name: 'Grass Block', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 1, name: 'Dirt', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 2, name: 'Stone', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 3, name: 'Cobblestone', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 4, name: 'Oak Planks', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 5, name: 'Torch', solid: false, isTorch: true, isWater: false, isItem: false, attackDamage: 4 },
    { id: 6, name: 'Glass', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 7, name: 'Water', solid: false, isTorch: false, isWater: true, isItem: false, attackDamage: 4 },
    { id: 8, name: 'Diamond Ore', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 9, name: 'Oak Log', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 10, name: 'Crafting Table', solid: true, isTorch: false, isWater: false, isItem: false, attackDamage: 4 },
    { id: 11, name: 'Stick', solid: false, isTorch: false, isWater: false, isItem: true, attackDamage: 5 },
    { id: 12, name: 'Wooden Pickaxe', solid: false, isTorch: false, isWater: false, isItem: true, attackDamage: 6 },
    { id: 13, name: 'Wooden Sword', solid: false, isTorch: false, isWater: false, isItem: true, attackDamage: 9 },
    { id: 14, name: 'Diamond Sword', solid: false, isTorch: false, isWater: false, isItem: true, attackDamage: 16 }
];
