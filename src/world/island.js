import { VoxelWorld } from '../voxel/mesher.js';

/**
 * A ilha flutuante do capitulo 1.
 *
 * O contorno nao e' desenhado a mao: sai de uma elipse com ruido na borda,
 * o que da' o recorte irregular sem virar uma mesa redonda.
 */

const RAIO_X = 15;
const RAIO_Z = 12;

function ruidoBorda(ang) {
  return (
    Math.sin(ang * 3.1) * 0.09 +
    Math.sin(ang * 5.7 + 1.3) * 0.06 +
    Math.sin(ang * 11.3 + 2.1) * 0.035
  );
}

/** < 1 dentro da ilha, > 1 fora. */
function densidade(x, z) {
  const ang = Math.atan2(z, x);
  const nx = x / (RAIO_X * (1 + ruidoBorda(ang)));
  const nz = z / (RAIO_Z * (1 + ruidoBorda(ang + 2.5)));
  return Math.sqrt(nx * nx + nz * nz);
}

// Lago no canto frontal esquerdo, como na referencia.
const LAGO = { cx: -7.5, cz: 5.5, rx: 5.2, rz: 3.4 };

function dentroDoLago(x, z) {
  const dx = (x - LAGO.cx) / LAGO.rx;
  const dz = (z - LAGO.cz) / LAGO.rz;
  return dx * dx + dz * dz < 1;
}

// Degrau baixo no canto frontal direito: quebra a silhueta de tabuleiro.
function dentroDoDegrau(x, z) {
  return x > 2 && z > 6.5 && densidade(x, z) < 0.92;
}

export function buildIsland(world = new VoxelWorld()) {
  for (let x = -RAIO_X - 2; x <= RAIO_X + 2; x++) {
    for (let z = -RAIO_Z - 2; z <= RAIO_Z + 2; z++) {
      const d = densidade(x, z);
      if (d >= 1) continue;

      const degrau = dentroDoDegrau(x, z);
      const topo = degrau ? -1 : 0;

      // Quanto mais perto do centro, mais fundo desce a barriga de terra.
      const profundidade = Math.floor((1 - d) * 9) + 2;

      if (dentroDoLago(x, z) && !degrau) {
        // O lago e' uma bacia: agua na superficie, terra fazendo o fundo.
        world.set(x, topo, z, 'water');
        world.set(x, topo - 1, z, 'dirt');
        for (let y = topo - 2; y > topo - profundidade; y--) {
          world.set(x, y, z, y < topo - profundidade + 3 ? 'stone' : 'dirt');
        }
        continue;
      }

      world.set(x, topo, z, 'grass');
      for (let y = topo - 1; y > topo - profundidade; y--) {
        world.set(x, y, z, y < topo - profundidade + 3 ? 'stone' : 'dirt');
      }
    }
  }

  adicionarEstalactites(world);
  return world;
}

/**
 * Pontas de terra penduradas embaixo. E' o que vende "flutuante" — sem elas a
 * ilha parece cortada com faca.
 */
function adicionarEstalactites(world) {
  const pontas = [
    [-2, 0, 7], [4, -3, 5], [-8, 2, 6], [7, 4, 4],
    [0, -7, 8], [-5, -6, 5], [9, -1, 5], [-11, 1, 4],
  ];

  for (const [x, z, comprimento] of pontas) {
    let y = -2;
    while (world.has(x, y, z)) y--;

    for (let i = 0; i < comprimento; i++) {
      // Afina conforme desce: as duas ultimas ficam so' no eixo.
      const largura = i < comprimento - 3 ? 1 : 0;
      for (let dx = -largura; dx <= largura; dx++) {
        for (let dz = -largura; dz <= largura; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > largura) continue;
          world.set(x + dx, y - i, z + dz, i > comprimento - 4 ? 'stone' : 'dirt');
        }
      }
    }
  }
}

/** Blocos avulsos boiando no ceu, como na primeira tela da referencia. */
export function buildFloatingBlocks(world = new VoxelWorld()) {
  world.fill(-24, 9, -6, -21, 9, -6, 'grass');
  world.fill(-19, 13, 3, -18, 13, 4, 'dirt');
  world.fill(12, 15, -9, 13, 15, -9, 'grass');
  world.set(-14, 17, -2, 'stone');
  return world;
}
