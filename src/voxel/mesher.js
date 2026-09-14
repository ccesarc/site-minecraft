import * as THREE from 'three';
import { buildAtlas, tileUV } from '../textures/atlas.js';
import { BLOCKS, tileFor, isLiquid } from './blocks.js';

/**
 * Converte um conjunto esparso de blocos numa geometria unica.
 *
 * Duas decisoes carregam o visual:
 *  - so' as faces expostas viram triangulos (um bloco enterrado custa zero);
 *  - cada vertice recebe sombra de face + oclusao de canto (AO), que e' o que
 *    da' volume a uma cena feita so' de cubos iguais.
 */

// Ordem dos cantos = anti-horario visto de fora, para a normal apontar certo.
const FACES = [
  { name: 'top', dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 },
  { name: 'bottom', dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5 },
  { name: 'east', dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.68 },
  { name: 'west', dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.68 },
  { name: 'south', dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.82 },
  { name: 'north', dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.82 },
];

const AO_LEVELS = [0.52, 0.7, 0.86, 1.0];

// Blocos que brilham sao desenhados sem luz: lava e portal nao podem escurecer.
function bucketFor(type) {
  const def = BLOCKS[type];
  if (def.emissive) return 'glow';
  if (def.liquid) return 'liquid';
  return 'opaque';
}

const key = (x, y, z) => `${x},${y},${z}`;

export class VoxelWorld {
  constructor() {
    this.blocks = new Map();
  }

  set(x, y, z, type) {
    this.blocks.set(key(x, y, z), { x, y, z, type });
    return this;
  }

  get(x, y, z) {
    return this.blocks.get(key(x, y, z));
  }

  has(x, y, z) {
    return this.blocks.has(key(x, y, z));
  }

  /** Caixa solida, o tijolo de quase tudo que a cena monta. */
  fill(x0, y0, z0, x1, y1, z1, type) {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) this.set(x, y, z, type);
      }
    }
    return this;
  }

  /** Casca oca: paredes sem preencher o miolo, para interiores. */
  shell(x0, y0, z0, x1, y1, z1, type) {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          const borda = x === x0 || x === x1 || y === y0 || y === y1 || z === z0 || z === z1;
          if (borda) this.set(x, y, z, type);
        }
      }
    }
    return this;
  }

  remove(x, y, z) {
    this.blocks.delete(key(x, y, z));
    return this;
  }

  /**
   * Uma face e' visivel quando o vizinho esta' vazio — ou quando o vizinho e'
   * liquido e este bloco nao e', senao a agua apaga a parede atras dela.
   */
  #faceVisivel(type, nx, ny, nz) {
    const vizinho = this.get(nx, ny, nz);
    if (!vizinho) return true;
    if (isLiquid(vizinho.type) && !isLiquid(type)) return true;
    if (isLiquid(vizinho.type) && isLiquid(type)) return vizinho.type !== type;
    return false;
  }

  #solido(x, y, z) {
    const b = this.get(x, y, z);
    return Boolean(b) && !isLiquid(b.type);
  }

  /**
   * Oclusao de canto: conta quantos blocos cercam o vertice. Dois lados cheios
   * fecham o canto por completo, independente da diagonal.
   */
  #ao(bx, by, bz, face, corner) {
    const [dx, dy, dz] = face.dir;
    const eixoNormal = dx !== 0 ? 0 : dy !== 0 ? 1 : 2;
    const [ta, tb] = [0, 1, 2].filter((i) => i !== eixoNormal);

    const s1 = corner[ta] === 1 ? 1 : -1;
    const s2 = corner[tb] === 1 ? 1 : -1;

    const base = [bx + dx, by + dy, bz + dz];
    const desloca = (a, sa, b, sb) => {
      const p = [...base];
      if (a !== null) p[a] += sa;
      if (b !== null) p[b] += sb;
      return this.#solido(p[0], p[1], p[2]);
    };

    const lado1 = desloca(ta, s1, null, 0);
    const lado2 = desloca(tb, s2, null, 0);
    const diagonal = desloca(ta, s1, tb, s2);

    if (lado1 && lado2) return AO_LEVELS[0];
    return AO_LEVELS[3 - (Number(lado1) + Number(lado2) + Number(diagonal))];
  }

  /** Gera um THREE.Group com um mesh por bucket (opaco / liquido / brilhante). */
  build({ receiveShadow = true, castShadow = true } = {}) {
    const buckets = {
      opaque: emptyBucket(),
      liquid: emptyBucket(),
      glow: emptyBucket(),
    };

    for (const { x, y, z, type } of this.blocks.values()) {
      const bucket = buckets[bucketFor(type)];

      for (const face of FACES) {
        const [dx, dy, dz] = face.dir;
        if (!this.#faceVisivel(type, x + dx, y + dy, z + dz)) continue;

        const uv = tileUV(tileFor(type, face.name === 'top' ? 'top' : face.name === 'bottom' ? 'bottom' : 'side'));
        const base = bucket.positions.length / 3;
        const ao = [];

        for (let i = 0; i < 4; i++) {
          const c = face.corners[i];
          bucket.positions.push(x + c[0], y + c[1], z + c[2]);
          bucket.normals.push(dx, dy, dz);

          const oclusao = bucketFor(type) === 'glow' ? 1 : this.#ao(x, y, z, face, c);
          ao.push(oclusao);

          const luz = face.shade * oclusao;
          bucket.colors.push(luz, luz, luz);
        }

        bucket.uvs.push(uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1);

        // Vira a diagonal quando o AO e' assimetrico, senao o quad ganha um
        // vinco visivel atravessando o canto escuro.
        if (ao[0] + ao[2] > ao[1] + ao[3]) {
          bucket.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        } else {
          bucket.indices.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
        }
      }
    }

    const atlas = buildAtlas();
    const grupo = new THREE.Group();

    const opaco = toMesh(buckets.opaque, new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
    }));
    if (opaco) {
      opaco.castShadow = castShadow;
      opaco.receiveShadow = receiveShadow;
      grupo.add(opaco);
    }

    const brilho = toMesh(buckets.glow, new THREE.MeshBasicMaterial({
      map: atlas.texture,
      vertexColors: true,
    }));
    if (brilho) grupo.add(brilho);

    const liquido = toMesh(buckets.liquid, new THREE.MeshLambertMaterial({
      map: atlas.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    }));
    if (liquido) {
      liquido.renderOrder = 1;
      grupo.add(liquido);
    }

    return grupo;
  }
}

function emptyBucket() {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

function toMesh(bucket, material) {
  if (bucket.indices.length === 0) return null;

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(bucket.positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(bucket.colors, 3));
  g.setIndex(bucket.indices);
  g.computeBoundingSphere();

  return new THREE.Mesh(g, material);
}
