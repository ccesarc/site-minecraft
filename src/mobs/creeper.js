import * as THREE from 'three';
import { pixelTexture, ruidoBase, skinnedBox } from './skin.js';

/**
 * Creeper parado na grama. Aparece pequeno na cena, entao o que importa
 * e' a silhueta: cabeca cubica, corpo estreito e quatro pes curtos.
 */

const VERDE = '#5fa653';

function texturaPele(seed) {
  return pixelTexture((ctx, res) => {
    ruidoBase(ctx, res, VERDE, 0.16, seed);
    // Manchas mais escuras, a assinatura do creeper.
    ctx.fillStyle = 'rgba(40,80,40,0.55)';
    for (let i = 0; i < 10; i++) {
      const x = Math.floor((Math.sin(i * 12.9 + seed) * 0.5 + 0.5) * res);
      const y = Math.floor((Math.sin(i * 78.2 + seed) * 0.5 + 0.5) * res);
      ctx.fillRect(x, y, 2 + (i % 2), 2 + (i % 3));
    }
  });
}

function texturaRosto() {
  return pixelTexture((ctx, res) => {
    ruidoBase(ctx, res, VERDE, 0.16, 5);
    ctx.fillStyle = '#0d1410';
    ctx.fillRect(3, 4, 3, 3);
    ctx.fillRect(10, 4, 3, 3);
    ctx.fillRect(6, 7, 4, 5);
    ctx.fillRect(5, 9, 2, 4);
    ctx.fillRect(9, 9, 2, 4);
  });
}

export function createCreeper() {
  const grupo = new THREE.Group();
  const pele = texturaPele(11);
  const rosto = texturaRosto();

  const cabeca = skinnedBox(0.8, 0.8, 0.8, { pz: rosto, default: pele });
  cabeca.position.y = 1.55;
  cabeca.castShadow = true;
  grupo.add(cabeca);

  const corpo = skinnedBox(0.8, 0.8, 0.4, { default: pele });
  corpo.position.y = 0.75;
  corpo.castShadow = true;
  grupo.add(corpo);

  for (const [dx, dz] of [[-0.2, 0.22], [0.2, 0.22], [-0.2, -0.22], [0.2, -0.22]]) {
    const pe = skinnedBox(0.38, 0.6, 0.38, { default: pele });
    pe.position.set(dx, 0.3, dz);
    pe.castShadow = true;
    grupo.add(pe);
  }

  grupo.userData.update = (tempo) => {
    // So' um giro lento da cabeca: creeper parado ja' e' inquietante.
    cabeca.rotation.y = Math.sin(tempo * 0.4) * 0.4;
  };

  return grupo;
}
