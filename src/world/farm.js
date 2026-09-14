/**
 * Plantacao de trigo: terra arada no lugar da grama e uma planta por bloco.
 * A area fica registrada para a grama selvagem nao nascer por cima.
 */

export const FARM = { x0: 0, x1: 8, z0: 3, z1: 9 };

export function buildFarm(world) {
  const posicoes = [];

  for (let x = FARM.x0; x <= FARM.x1; x++) {
    for (let z = FARM.z0; z <= FARM.z1; z++) {
      if (!world.has(x, 0, z)) continue;
      if (world.get(x, 0, z).type !== 'grass') continue;

      // Canal de agua no meio, como toda fazenda do jogo.
      if (x === FARM.x0 + 4) {
        world.set(x, 0, z, 'water');
        world.set(x, -1, z, 'dirt');
        continue;
      }

      world.set(x, 0, z, 'dirt');
      posicoes.push({ x, y: 1, z });
    }
  }

  return posicoes;
}
