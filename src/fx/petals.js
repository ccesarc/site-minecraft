import { createParticleField } from './particles.js';

/**
 * Petalas da cerejeira: caem devagar e vao de lado, como folha de verdade.
 * Reciclam pelo topo, entao a chuva nunca acaba.
 */
export function createPetals({ centro = { x: 9, z: -9 }, quantidade = 160 } = {}) {
  const volume = {
    x0: centro.x - 9,
    x1: centro.x + 9,
    y0: -2,
    y1: 12,
    z0: centro.z - 8,
    z1: centro.z + 12,
  };

  return createParticleField({
    quantidade,
    cor: '#f2a8cd',
    tamanho: 0.22,
    volume,
    opacidade: 0.95,
    passo: (p, tempo, delta) => {
      p.y -= delta * 0.85 * p.velocidade;
      // A deriva lateral e' o que separa petala de chuva.
      p.x += Math.sin(tempo * 0.8 + p.fase) * delta * 0.9;
      p.z += Math.cos(tempo * 0.55 + p.fase) * delta * 0.55;
    },
  });
}
