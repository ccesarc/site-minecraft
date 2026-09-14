/**
 * Portal do Nether: moldura de obsidiana com o plano roxo no miolo.
 * Fica de pe' no eixo X (a camera atravessa ele no sentido -Z).
 */

export const PORTAL = {
  x: -3,
  z: 0,
  largura: 4,
  altura: 5,
  base: 1,
};

export function buildPortal(world) {
  const { x, z, largura, altura, base } = PORTAL;

  for (let dx = -1; dx <= largura; dx++) {
    for (let dy = -1; dy <= altura; dy++) {
      const naMoldura = dx === -1 || dx === largura || dy === -1 || dy === altura;
      const y = base + dy;
      if (naMoldura) {
        world.set(x + dx, y, z, 'obsidian');
      } else {
        world.set(x + dx, y, z, 'portal');
      }
    }
  }

  return world;
}

/** Centro do vao, usado pela camera como alvo da travessia. */
export function portalCenter() {
  const { x, z, largura, altura, base } = PORTAL;
  return {
    x: x + (largura - 1) / 2,
    y: base + (altura - 1) / 2,
    z,
  };
}
