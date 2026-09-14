import { VoxelWorld } from '../voxel/mesher.js';

/**
 * O Nether do capitulo 4: paredao de netherrack a esquerda descendo para um
 * mar de lava, com blocos de magma soltos.
 *
 * O terreno vem de ruido em camadas — nenhum bloco e' posicionado a mao.
 */

function ruido(x, z, seed) {
  return (
    Math.sin(x * 0.21 + seed) * Math.cos(z * 0.17 - seed) * 0.5 +
    Math.sin(x * 0.07 - z * 0.09 + seed * 2) * 0.35 +
    Math.sin((x + z) * 0.41 + seed * 3) * 0.15
  );
}

const LIMITE_X = 34;
const LIMITE_Z = 30;
export const NIVEL_LAVA = -2;

export function buildNether(world = new VoxelWorld()) {
  for (let x = -LIMITE_X; x <= LIMITE_X; x++) {
    for (let z = -LIMITE_Z; z <= 8; z++) {
      // Rampa: sobe forte para -X, afunda para +X. Da' o paredao da referencia.
      const rampa = (-x / LIMITE_X) * 9;
      const altura = Math.round(rampa + ruido(x, z, 1.7) * 5 - 1);

      if (altura >= NIVEL_LAVA) {
        for (let y = altura; y > altura - 4; y--) {
          world.set(x, y, z, 'netherrack');
        }
        // Veios de magma aparecendo na superficie.
        if (ruido(x, z, 4.1) > 0.42) world.set(x, altura, z, 'magma');
      } else {
        // Abaixo do nivel, o vazio vira mar de lava.
        for (let y = NIVEL_LAVA; y > NIVEL_LAVA - 2; y--) {
          world.set(x, y, z, 'lava');
        }
      }
    }
  }

  adicionarPlataformas(world);
  return world;
}

/** Ilhotas de netherrack boiando na lava, com a borda acesa. */
function adicionarPlataformas(world) {
  const ilhotas = [
    [6, -4, 3], [14, 2, 2], [-2, -12, 4], [20, -8, 3],
    [10, -18, 2], [-8, -22, 3], [24, 4, 2], [2, -26, 3],
  ];

  for (const [x, z, raio] of ilhotas) {
    for (let dx = -raio; dx <= raio; dx++) {
      for (let dz = -raio; dz <= raio; dz++) {
        if (Math.sqrt(dx * dx + dz * dz) > raio) continue;
        const borda = Math.sqrt(dx * dx + dz * dz) > raio - 1;
        world.set(x + dx, NIVEL_LAVA + 1, z + dz, borda ? 'magma' : 'netherrack');
      }
    }
  }
}
