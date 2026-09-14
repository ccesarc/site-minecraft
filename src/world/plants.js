import * as THREE from 'three';
import { TILE } from '../textures/atlas.js';

/**
 * Grama alta, trigo e flores.
 *
 * Nao sao blocos: sao sprites em cruz (dois planos cruzados), igual ao jogo.
 * Tudo num InstancedMesh — milhares de tufos custam uma chamada de desenho.
 */

function noise(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function pixelCanvas(desenhar) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  desenhar(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PLANTAS = {
  // Tufo de grama: laminas subindo do centro, mais densas embaixo.
  grass_tuft: (ctx) => {
    const lamimas = [
      { x: 3, base: 15, topo: 7, cor: '#4f8c31' },
      { x: 5, base: 15, topo: 4, cor: '#5d9c3c' },
      { x: 7, base: 15, topo: 2, cor: '#6cb045' },
      { x: 9, base: 15, topo: 5, cor: '#5d9c3c' },
      { x: 11, base: 15, topo: 8, cor: '#4f8c31' },
    ];
    for (const { x, base, topo, cor } of lamimas) {
      ctx.fillStyle = cor;
      for (let y = topo; y <= base; y++) {
        const curva = Math.floor((base - y) / 5) * (x > 7 ? 1 : -1);
        ctx.fillRect(x + curva, y, 1, 1);
        if (y > base - 4) ctx.fillRect(x + curva + (x > 7 ? -1 : 1), y, 1, 1);
      }
    }
  },

  // Trigo maduro: hastes com graos destacados no topo.
  wheat: (ctx) => {
    for (const x of [3, 7, 11]) {
      ctx.fillStyle = '#8a7a2e';
      ctx.fillRect(x, 5, 1, 11);
      ctx.fillStyle = '#c9b24a';
      for (let y = 1; y <= 7; y++) {
        ctx.fillRect(x, y, 1, 1);
        if (y % 2 === 0) {
          ctx.fillRect(x - 1, y, 1, 1);
          ctx.fillRect(x + 1, y, 1, 1);
        }
      }
      ctx.fillStyle = '#e4d27a';
      ctx.fillRect(x, 1, 1, 2);
    }
  },

  // Papoula: haste verde e cabeca vermelha.
  rose: (ctx) => {
    ctx.fillStyle = '#4f8c31';
    ctx.fillRect(7, 8, 1, 8);
    ctx.fillRect(5, 11, 2, 1);
    ctx.fillRect(9, 13, 2, 1);
    ctx.fillStyle = '#b02626';
    ctx.fillRect(5, 3, 5, 5);
    ctx.fillStyle = '#d63b3b';
    ctx.fillRect(6, 4, 3, 3);
    ctx.fillStyle = '#2b1010';
    ctx.fillRect(7, 5, 1, 1);
  },
};

/** Dois planos cruzados em X, o formato classico de planta em voxel. */
function crossGeometry() {
  const a = new THREE.PlaneGeometry(1, 1);
  const b = new THREE.PlaneGeometry(1, 1);
  b.rotateY(Math.PI / 2);

  const merged = mergePlanes([a, b]);
  merged.translate(0, 0.5, 0);
  return merged;
}

function mergePlanes(geoms) {
  const posicoes = [];
  const normais = [];
  const uvs = [];
  const indices = [];
  let offset = 0;

  for (const g of geoms) {
    posicoes.push(...g.attributes.position.array);
    normais.push(...g.attributes.normal.array);
    uvs.push(...g.attributes.uv.array);
    for (const i of g.index.array) indices.push(i + offset);
    offset += g.attributes.position.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  out.setIndex(indices);
  return out;
}

/**
 * Cria um campo de plantas de um tipo.
 * `alphaTest` em vez de `transparent` evita o problema de ordenacao que faz
 * sprite sumir atras de sprite.
 */
export function createPlantField(tipo, posicoes, { escala = 1 } = {}) {
  if (posicoes.length === 0) return null;

  const material = new THREE.MeshLambertMaterial({
    map: pixelCanvas(PLANTAS[tipo]),
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.InstancedMesh(crossGeometry(), material, posicoes.length);
  const dummy = new THREE.Object3D();

  posicoes.forEach((p, i) => {
    dummy.position.set(p.x + 0.5, p.y, p.z + 0.5);
    dummy.rotation.y = noise(p.x, p.z, 60) * Math.PI;
    const s = escala * (0.85 + noise(p.x, p.z, 61) * 0.35);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.plantField = true;
  return mesh;
}

/** Sorteia posicoes livres em cima de grama, fora das areas ocupadas. */
export function scatterOnGrass(world, { densidade = 0.18, evitar = [] } = {}) {
  const pontos = [];

  for (const bloco of world.blocks.values()) {
    if (bloco.type !== 'grass') continue;
    if (world.has(bloco.x, bloco.y + 1, bloco.z)) continue;

    const bloqueado = evitar.some(
      (r) => bloco.x >= r.x0 && bloco.x <= r.x1 && bloco.z >= r.z0 && bloco.z <= r.z1,
    );
    if (bloqueado) continue;

    if (noise(bloco.x, bloco.z, 62) < densidade) {
      pontos.push({ x: bloco.x, y: bloco.y + 1, z: bloco.z });
    }
  }

  return pontos;
}
