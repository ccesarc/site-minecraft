import * as THREE from 'three';
import { pixelTexture, ruidoBase, skinnedBox } from './skin.js';

/**
 * Ghast: cubo palido com nove tentaculos e a cara triste.
 * Flutua com bob lento e os tentaculos balancam defasados, senao o bicho
 * parece um objeto rigido pendurado.
 */

const CORPO = '#d8ccba';

function texturaCorpo() {
  return pixelTexture((ctx, res) => {
    ruidoBase(ctx, res, CORPO, 0.07, 3);
  });
}

function texturaRosto() {
  return pixelTexture((ctx, res) => {
    ruidoBase(ctx, res, CORPO, 0.07, 3);
    ctx.fillStyle = '#100d0c';
    // Olhos fechados: duas barras horizontais.
    ctx.fillRect(3, 6, 4, 2);
    ctx.fillRect(9, 6, 4, 2);
    // Boca em barra larga.
    ctx.fillRect(5, 11, 6, 2);
  });
}

function texturaTentaculo() {
  return pixelTexture((ctx, res) => {
    ruidoBase(ctx, res, '#c3b6a2', 0.09, 7);
  });
}

export function createGhast() {
  const grupo = new THREE.Group();

  const corpo = texturaCorpo();
  const rosto = texturaRosto();

  const cabeca = skinnedBox(4, 4, 4, { pz: rosto, default: corpo });
  cabeca.castShadow = true;
  grupo.add(cabeca);

  const tentaculos = [];
  const texTentaculo = texturaTentaculo();

  // Grade 3x3 embaixo do corpo, com comprimentos irregulares.
  let i = 0;
  for (let gx = -1; gx <= 1; gx++) {
    for (let gz = -1; gz <= 1; gz++) {
      const comprimento = 1.6 + ((i * 7) % 5) * 0.42;
      const t = skinnedBox(0.62, comprimento, 0.62, { default: texTentaculo });
      t.position.set(gx * 1.15, -2 - comprimento / 2, gz * 1.15);
      // Pivo no topo: a rotacao tem que sair do corpo, nao do meio do tentaculo.
      t.geometry.translate(0, -comprimento / 2, 0);
      t.position.y = -2;
      t.userData.fase = i * 0.7;
      grupo.add(t);
      tentaculos.push(t);
      i++;
    }
  }

  grupo.userData.tentaculos = tentaculos;
  grupo.userData.update = (tempo) => {
    grupo.position.y = grupo.userData.alturaBase + Math.sin(tempo * 0.5) * 0.8;
    grupo.rotation.y = Math.sin(tempo * 0.22) * 0.25;

    for (const t of tentaculos) {
      t.rotation.x = Math.sin(tempo * 0.9 + t.userData.fase) * 0.16;
      t.rotation.z = Math.cos(tempo * 0.75 + t.userData.fase) * 0.16;
    }
  };

  grupo.userData.alturaBase = 0;
  return grupo;
}
