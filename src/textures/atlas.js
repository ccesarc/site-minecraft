import * as THREE from 'three';

/**
 * Atlas de texturas desenhado em canvas, 16x16 por tile.
 * Nada de arte externa: cada tile e' pintado por uma funcao pura,
 * entao o visual pixelado nasce do codigo e nao de um asset da Mojang.
 */

export const TILE = 16;
const COLS = 8;
const ROWS = 4;

// Ruido deterministico por pixel: mesmo tile sempre sai igual entre reloads.
function noise(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

/** Base ruidosa: a assinatura visual do Minecraft e' cor chapada + granulado. */
function grain(ctx, ox, oy, base, spread, seed) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = noise(x, y, seed);
      ctx.fillStyle = shade(base, (n - 0.5) * spread);
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function blotches(ctx, ox, oy, color, count, seed, size = 2) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(noise(i, 1, seed) * TILE);
    const y = Math.floor(noise(i, 2, seed) * TILE);
    const s = 1 + Math.floor(noise(i, 3, seed) * size);
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, s, s);
  }
}

const PAINTERS = {
  grass_top: (c, x, y) => {
    grain(c, x, y, '#5d9c3c', 0.16, 1);
    blotches(c, x, y, '#6cb045', 10, 2);
    blotches(c, x, y, '#4d8531', 8, 3);
  },

  grass_side: (c, x, y) => {
    grain(c, x, y, '#8b6547', 0.14, 4);
    blotches(c, x, y, '#75523a', 10, 5);
    // Beirada de grama caindo por cima da terra, com altura irregular.
    for (let i = 0; i < TILE; i++) {
      const h = 3 + Math.floor(noise(i, 7, 6) * 3);
      for (let j = 0; j < h; j++) {
        c.fillStyle = shade('#5d9c3c', (noise(i, j, 8) - 0.5) * 0.16);
        c.fillRect(x + i, y + j, 1, 1);
      }
    }
  },

  dirt: (c, x, y) => {
    grain(c, x, y, '#8b6547', 0.16, 9);
    blotches(c, x, y, '#75523a', 12, 10);
  },

  stone: (c, x, y) => {
    grain(c, x, y, '#8a8a8a', 0.12, 11);
    blotches(c, x, y, '#787878', 8, 12);
  },

  cobble: (c, x, y) => {
    grain(c, x, y, '#8a8a8a', 0.1, 13);
    // Pedregulhos chapados com contorno escuro dao a leitura de cobblestone.
    const rocks = [[1, 1, 5, 4], [8, 1, 6, 5], [1, 7, 6, 4], [9, 8, 5, 6], [2, 12, 5, 3]];
    for (const [rx, ry, rw, rh] of rocks) {
      c.fillStyle = '#6f6f6f';
      c.fillRect(x + rx - 1, y + ry - 1, rw + 2, rh + 2);
      c.fillStyle = '#9a9a9a';
      c.fillRect(x + rx, y + ry, rw, rh);
    }
  },

  oak_planks: (c, x, y) => {
    grain(c, x, y, '#b0854e', 0.12, 14);
    for (let i = 0; i < TILE; i += 4) {
      c.fillStyle = '#6f5330';
      c.fillRect(x, y + i, TILE, 1);
    }
    // Emenda vertical alternada entre as fileiras: sem isso vira piso listrado.
    c.fillStyle = '#6f5330';
    c.fillRect(x + 5, y, 1, 4);
    c.fillRect(x + 11, y + 4, 1, 4);
    c.fillRect(x + 3, y + 8, 1, 4);
    c.fillRect(x + 9, y + 12, 1, 4);
  },

  oak_log_side: (c, x, y) => {
    grain(c, x, y, '#6b4f2a', 0.14, 15);
    for (let i = 0; i < TILE; i++) {
      if (noise(i, 0, 16) > 0.62) {
        c.fillStyle = '#55401f';
        c.fillRect(x + i, y, 1, TILE);
      }
    }
  },

  oak_log_top: (c, x, y) => {
    grain(c, x, y, '#9a7440', 0.1, 17);
    for (let r = 7; r > 0; r -= 2) {
      c.strokeStyle = r % 4 === 3 ? '#6b4f2a' : '#825f33';
      c.strokeRect(x + 8 - r, y + 8 - r, r * 2, r * 2);
    }
  },

  leaves_pink: (c, x, y) => {
    grain(c, x, y, '#e2a0c4', 0.2, 18);
    blotches(c, x, y, '#f2bcd8', 14, 19);
    blotches(c, x, y, '#b9708f', 12, 20);
    blotches(c, x, y, '#4a3140', 6, 21);
  },

  water: (c, x, y) => {
    grain(c, x, y, '#3b62c4', 0.1, 22);
    blotches(c, x, y, '#5078d6', 10, 23, 3);
  },

  obsidian: (c, x, y) => {
    grain(c, x, y, '#17121f', 0.22, 24);
    blotches(c, x, y, '#5b3f86', 10, 25);
    blotches(c, x, y, '#241a33', 12, 26);
  },

  portal: (c, x, y) => {
    grain(c, x, y, '#7a34c8', 0.3, 27);
    blotches(c, x, y, '#b57ef0', 16, 28, 3);
    blotches(c, x, y, '#3d1668', 14, 29, 3);
    blotches(c, x, y, '#e8d4ff', 5, 30, 1);
  },

  netherrack: (c, x, y) => {
    grain(c, x, y, '#7a2222', 0.22, 31);
    blotches(c, x, y, '#5c1717', 14, 32);
    blotches(c, x, y, '#93312b', 10, 33);
  },

  lava: (c, x, y) => {
    grain(c, x, y, '#d9541a', 0.16, 34);
    blotches(c, x, y, '#f5a623', 12, 35, 3);
    blotches(c, x, y, '#ffd45e', 6, 36);
    blotches(c, x, y, '#9c2f0c', 8, 37, 2);
  },

  glowstone: (c, x, y) => {
    grain(c, x, y, '#c9a34a', 0.16, 38);
    blotches(c, x, y, '#ffe9a8', 12, 39, 2);
  },

  dark_planks: (c, x, y) => {
    grain(c, x, y, '#4a3623', 0.12, 40);
    for (let i = 0; i < TILE; i += 4) {
      c.fillStyle = '#33240f';
      c.fillRect(x, y + i, TILE, 1);
    }
  },

  window: (c, x, y) => {
    // Vidro escuro com caixilho: e' o que faz a casa "ter" janela de longe.
    grain(c, x, y, '#2b3a42', 0.14, 41);
    blotches(c, x, y, '#48626e', 8, 42, 2);
    c.fillStyle = '#6b4f2a';
    c.fillRect(x, y, TILE, 2);
    c.fillRect(x, y + TILE - 2, TILE, 2);
    c.fillRect(x, y, 2, TILE);
    c.fillRect(x + TILE - 2, y, 2, TILE);
    c.fillRect(x + 7, y, 2, TILE);
  },

  soul_sand: (c, x, y) => {
    grain(c, x, y, '#4e3a2e', 0.16, 43);
    blotches(c, x, y, '#33241c', 10, 44, 3);
  },

  magma: (c, x, y) => {
    grain(c, x, y, '#5a2410', 0.2, 45);
    blotches(c, x, y, '#e8701e', 10, 46, 3);
    blotches(c, x, y, '#ffb347', 5, 47);
  },

  sand: (c, x, y) => {
    grain(c, x, y, '#d9cf9a', 0.1, 48);
    blotches(c, x, y, '#c4b884', 8, 49);
  },
};

export const TILE_NAMES = Object.keys(PAINTERS);

let cached = null;

/** Uma textura so' para o mundo inteiro: 1 draw call por material. */
export function buildAtlas() {
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const index = new Map();
  TILE_NAMES.forEach((name, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    PAINTERS[name](ctx, col * TILE, row * TILE);
    index.set(name, { col, row });
  });

  const texture = new THREE.CanvasTexture(canvas);
  // NearestFilter e' o detalhe que decide tudo: sem ele o navegador borra
  // os pixels e o visual deixa de ser voxel.
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  cached = { texture, canvas, ctx, index, cols: COLS, rows: ROWS };
  return cached;
}

/**
 * Retorna o retangulo UV do tile. A meia-texel de margem evita que o
 * filtro puxe a cor do tile vizinho na borda do bloco.
 */
export function tileUV(name) {
  const atlas = buildAtlas();
  const cell = atlas.index.get(name);
  if (!cell) throw new Error(`tile desconhecido: ${name}`);

  const pad = 0.5 / TILE;
  const u0 = (cell.col + pad) / COLS;
  const u1 = (cell.col + 1 - pad) / COLS;
  const v1 = 1 - (cell.row + pad) / ROWS;
  const v0 = 1 - (cell.row + 1 - pad) / ROWS;
  return { u0, v0, u1, v1 };
}

/**
 * Repinta os tiles animados direto no atlas.
 *
 * O jogo anima texturas a ~12 quadros por segundo, e e' justamente esse passo
 * grosso que faz a lava e o portal parecerem do Minecraft; a 60fps o movimento
 * fica liso demais e perde o carater.
 */
const ANIMADOS = ['portal', 'lava'];
const PASSO = 1 / 12;
let ultimoQuadro = -1;

export function animateAtlas(tempo) {
  const quadro = Math.floor(tempo / PASSO);
  if (quadro === ultimoQuadro) return;
  ultimoQuadro = quadro;

  const atlas = buildAtlas();
  const { ctx } = atlas;

  for (const nome of ANIMADOS) {
    const cell = atlas.index.get(nome);
    const ox = cell.col * TILE;
    const oy = cell.row * TILE;

    // Redesenha o tile deslocando verticalmente: o padrao sobe em loop.
    const deslocamento = quadro % TILE;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, TILE, TILE);
    ctx.clip();
    PAINTERS[nome](ctx, ox, oy - deslocamento);
    PAINTERS[nome](ctx, ox, oy - deslocamento + TILE);
    ctx.restore();
  }

  atlas.texture.needsUpdate = true;
}
