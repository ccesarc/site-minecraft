/**
 * Cerejeira: tronco escuro e copa rosa larga e chapada.
 * A copa e' montada em camadas de raio decrescente com os cantos comidos,
 * senao vira um bloco quadrado de folha.
 */

export function buildCherryTree(world, { x = 9, z = -9, altura = 7 } = {}) {
  for (let y = 1; y <= altura; y++) {
    world.set(x, y, z, 'log');
    // Tronco de 2 blocos na base deixa a arvore com peso.
    if (y <= altura - 2) world.set(x + 1, y, z, 'log');
  }

  const camadas = [
    { dy: -1, raio: 4 },
    { dy: 0, raio: 5 },
    { dy: 1, raio: 4 },
    { dy: 2, raio: 2 },
  ];

  for (const { dy, raio } of camadas) {
    const y = altura + dy;
    for (let dx = -raio; dx <= raio + 1; dx++) {
      for (let dz = -raio; dz <= raio; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > raio + 0.4) continue;
        // Furos na borda: copa solida demais fica com cara de balao.
        if (dist > raio - 0.8 && (dx + dz + y) % 3 === 0) continue;
        world.set(x + dx, y, z + dz, 'leaves');
      }
    }
  }

  return world;
}
