import { createParticleField } from './particles.js';

/** Brasas do Nether: sobem da lava, tremendo, com blending aditivo. */
export function createEmbers({ quantidade = 260 } = {}) {
  const volume = { x0: -34, x1: 34, y0: -4, y1: 22, z0: -30, z1: 10 };

  return createParticleField({
    quantidade,
    cor: '#ff9c3c',
    tamanho: 0.3,
    volume,
    opacidade: 0.85,
    aditivo: true,
    passo: (p, tempo, delta) => {
      p.y += delta * 1.4 * p.velocidade;
      p.x += Math.sin(tempo * 1.3 + p.fase) * delta * 0.5;
    },
  });
}

/** Faiscas roxas em volta do portal. */
export function createPortalSparks(centro, { quantidade = 90 } = {}) {
  const volume = {
    x0: centro.x - 3,
    x1: centro.x + 3,
    y0: centro.y - 3.5,
    y1: centro.y + 3.5,
    z0: centro.z - 1.2,
    z1: centro.z + 1.2,
  };

  return createParticleField({
    quantidade,
    cor: '#c79bff',
    tamanho: 0.16,
    volume,
    opacidade: 0.9,
    aditivo: true,
    passo: (p, tempo, delta) => {
      p.y += delta * 0.5 * p.velocidade * Math.sin(tempo * 0.6 + p.fase);
      p.x += Math.sin(tempo * 1.7 + p.fase) * delta * 0.35;
      p.z += Math.cos(tempo * 1.4 + p.fase) * delta * 0.2;
    },
  });
}
