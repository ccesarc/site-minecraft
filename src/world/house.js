/**
 * A casa de madeira do lado direito da ilha.
 * Postes de tronco nos cantos e telhado em degraus com beiral: e' o beiral
 * que faz a casa ler como casa e nao como caixa.
 */

const X0 = 5;
const X1 = 13;
const Z0 = -5;
const Z1 = 2;
const ALTURA = 4;

export function buildHouse(world) {
  // Alicerce de pedra, um bloco acima da grama.
  world.fill(X0, 0, Z0, X1, 0, Z1, 'cobble');

  // Paredes ocas.
  for (let y = 1; y <= ALTURA; y++) {
    for (let x = X0; x <= X1; x++) {
      for (let z = Z0; z <= Z1; z++) {
        const naBorda = x === X0 || x === X1 || z === Z0 || z === Z1;
        if (naBorda) world.set(x, y, z, 'planks');
      }
    }
  }

  // Postes de tronco nos quatro cantos.
  for (let y = 1; y <= ALTURA; y++) {
    world.set(X0, y, Z0, 'log');
    world.set(X1, y, Z0, 'log');
    world.set(X0, y, Z1, 'log');
    world.set(X1, y, Z1, 'log');
  }

  // Janelas na face voltada para a camera (z maior) e na lateral esquerda.
  for (const x of [X0 + 2, X0 + 3, X0 + 6, X0 + 7]) {
    world.set(x, 2, Z1, 'window');
    world.set(x, 3, Z1, 'window');
  }
  for (const z of [Z0 + 2, Z0 + 3, Z0 + 5]) {
    world.set(X0, 2, z, 'window');
    world.set(X0, 3, z, 'window');
  }

  // Glowstone escondido atras da janela: e' a luz quente que vaza na referencia.
  world.set(X0 + 2, 2, Z1 - 1, 'glowstone');
  world.set(X0 + 6, 3, Z1 - 1, 'glowstone');
  world.set(X0 + 1, 2, Z0 + 3, 'glowstone');

  construirTelhado(world);
  return world;
}

function construirTelhado(world) {
  // Cada camada encolhe 1 em cada eixo; a primeira avanca 1 alem da parede.
  const camadas = [
    { y: ALTURA + 1, margem: 1 },
    { y: ALTURA + 2, margem: 0 },
    { y: ALTURA + 3, margem: -1 },
    { y: ALTURA + 4, margem: -2 },
  ];

  for (const { y, margem } of camadas) {
    const material = y === ALTURA + 1 ? 'dark_planks' : 'planks';
    for (let x = X0 - margem; x <= X1 + margem; x++) {
      for (let z = Z0 - margem; z <= Z1 + margem; z++) {
        world.set(x, y, z, material);
      }
    }
  }
}
