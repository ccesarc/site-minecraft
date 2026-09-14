import * as THREE from 'three';

/**
 * Base das particulas. Sprite quadrado e nao redondo: uma particula com
 * borda suave destoa na hora de uma cena inteira feita de pixel duro.
 */
function spriteQuadrado(cor) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, 4, 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

/**
 * Campo de particulas com posicao propria por instancia.
 * `passo` recebe cada particula e devolve a nova posicao; quem sai do volume
 * e' reciclado pelo topo em vez de ser recriado.
 */
export function createParticleField({
  quantidade,
  cor,
  tamanho,
  volume,
  passo,
  opacidade = 1,
  aditivo = false,
}) {
  const posicoes = new Float32Array(quantidade * 3);
  const estados = [];

  for (let i = 0; i < quantidade; i++) {
    const p = nascer(volume);
    estados.push(p);
    posicoes[i * 3] = p.x;
    posicoes[i * 3 + 1] = p.y;
    posicoes[i * 3 + 2] = p.z;
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));

  const material = new THREE.PointsMaterial({
    map: spriteQuadrado(cor),
    size: tamanho,
    sizeAttenuation: true,
    transparent: true,
    opacity: opacidade,
    depthWrite: false,
    blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const pontos = new THREE.Points(geometria, material);
  pontos.frustumCulled = false;

  pontos.userData.update = (tempo, delta) => {
    const attr = geometria.attributes.position;
    for (let i = 0; i < quantidade; i++) {
      const p = estados[i];
      passo(p, tempo, delta);

      if (fora(p, volume)) Object.assign(p, nascer(volume, true));

      attr.array[i * 3] = p.x;
      attr.array[i * 3 + 1] = p.y;
      attr.array[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
  };

  return pontos;
}

function nascer(volume, noTopo = false) {
  const r = Math.random;
  return {
    x: volume.x0 + r() * (volume.x1 - volume.x0),
    y: noTopo ? volume.y1 : volume.y0 + r() * (volume.y1 - volume.y0),
    z: volume.z0 + r() * (volume.z1 - volume.z0),
    fase: r() * Math.PI * 2,
    velocidade: 0.5 + r() * 0.8,
  };
}

function fora(p, v) {
  return p.y < v.y0 || p.y > v.y1 + 1 || p.x < v.x0 - 2 || p.x > v.x1 + 2;
}
