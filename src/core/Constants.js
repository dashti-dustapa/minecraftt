/**
 * Global Constants & Configurations for Minecraft Voxel Engine
 */

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_SIZE_Y = 256;
export const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

export const DEFAULT_RENDER_DISTANCE = 4;
export const MAX_RENDER_DISTANCE = 16;
export const TICK_RATE = 20;
export const FIXED_TIME_STEP = 1 / TICK_RATE;

export const GRAVITY = -28.0;
export const TERMINAL_VELOCITY = -78.4;
export const PLAYER_WALK_SPEED = 4.317;
export const PLAYER_SPRINT_SPEED = 5.612;
export const PLAYER_SNEAK_SPEED = 1.295;
export const PLAYER_JUMP_FORCE = 8.5;
export const PLAYER_REACH = 5.0;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_EYE_HEIGHT = 1.62;

export const BLOCK = {
    AIR: 0,
    STONE: 1,
    DIRT: 2,
    GRASS: 3,
    COBBLESTONE: 4,
    WOOD_PLANK: 5,
    BEDROCK: 6,
    WATER: 7,
    LAVA: 8,
    SAND: 9,
    GRAVEL: 10,
    OAK_LOG: 11,
    OAK_LEAVES: 12,
    GLASS: 13,
    IRON_ORE: 14,
    COAL_ORE: 15,
    GOLD_ORE: 16,
    DIAMOND_ORE: 17
};

export const BLOCK_DATA = {
    [BLOCK.AIR]: {
        name: 'Air',
        solid: false,
        transparent: true,
        liquid: false,
        hardness: 0,
        lightEmission: 0
    },
    [BLOCK.STONE]: {
        name: 'Stone',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 1.5,
        lightEmission: 0,
        textureCoords: { all: [1, 0] }
    },
    [BLOCK.DIRT]: {
        name: 'Dirt',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 0.5,
        lightEmission: 0,
        textureCoords: { all: [2, 0] }
    },
    [BLOCK.GRASS]: {
        name: 'Grass Block',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 0.6,
        lightEmission: 0,
        textureCoords: {
            top: [0, 0],
            bottom: [2, 0],
            sides: [3, 0]
        }
    },
    [BLOCK.COBBLESTONE]: {
        name: 'Cobblestone',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 2.0,
        lightEmission: 0,
        textureCoords: { all: [0, 1] }
    },
    [BLOCK.WOOD_PLANK]: {
        name: 'Oak Planks',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 2.0,
        lightEmission: 0,
        textureCoords: { all: [4, 0] }
    },
    [BLOCK.BEDROCK]: {
        name: 'Bedrock',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: -1,
        lightEmission: 0,
        textureCoords: { all: [1, 1] }
    },
    [BLOCK.WATER]: {
        name: 'Water',
        solid: false,
        transparent: true,
        liquid: true,
        hardness: 100,
        lightEmission: 0,
        textureCoords: { all: [13, 12] }
    },
    [BLOCK.SAND]: {
        name: 'Sand',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 0.5,
        gravityAffected: true,
        lightEmission: 0,
        textureCoords: { all: [2, 1] }
    },
    [BLOCK.OAK_LOG]: {
        name: 'Oak Log',
        solid: true,
        transparent: false,
        liquid: false,
        hardness: 2.0,
        lightEmission: 0,
        textureCoords: {
            top: [5, 1],
            bottom: [5, 1],
            sides: [4, 1]
        }
    },
    [BLOCK.OAK_LEAVES]: {
        name: 'Oak Leaves',
        solid: true,
        transparent: true,
        liquid: false,
        hardness: 0.2,
        lightEmission: 0,
        textureCoords: { all: [4, 3] }
    },
    [BLOCK.GLASS]: {
        name: 'Glass',
        solid: true,
        transparent: true,
        liquid: false,
        hardness: 0.3,
        lightEmission: 0,
        textureCoords: { all: [1, 3] }
    }
};

export const FACES = [
    { dir: [ 0,  1,  0], name: 'top',    corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]], normal: [0, 1, 0] },
    { dir: [ 0, -1,  0], name: 'bottom', corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]], normal: [0, -1, 0] },
    { dir: [ 0,  0,  1], name: 'north',  corners: [[1,0,1], [1,1,1], [0,1,1], [0,0,1]], normal: [0, 0, 1] },
    { dir: [ 0,  0, -1], name: 'south',  corners: [[0,0,0], [0,1,0], [1,1,0], [1,0,0]], normal: [0, 0, -1] },
    { dir: [ 1,  0,  0], name: 'east',   corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]], normal: [1, 0, 0] },
    { dir: [-1,  0,  0], name: 'west',   corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]], normal: [-1, 0, 0] }
];
