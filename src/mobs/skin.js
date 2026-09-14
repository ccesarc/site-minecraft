import * as THREE from 'three';

/**
 * Utilitarios de pele para os mobs.
 * Cada face do cubo recebe sua propria textura de 16x16 pintada em canvas,
 * que e' como o rosto do Ghast e do Creeper aparecem so' na frente.
 */

const RES = 16;

export function pixelTexture(desenhar) {
  const canvas = document.createElement('canvas');
  canvas.width = RES;
  canvas.height = RES;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  desenhar(ctx, RES);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function ruidoBase(ctx, res, cor, forca, seed) {
  const base = new THREE.Color(cor);
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
      const v = (n - Math.floor(n) - 0.5) * forca;
      const c = base.clone().offsetHSL(0, 0, v);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Monta um cubo com textura por face.
 * A ordem que o BoxGeometry espera e': +X, -X, +Y, -Y, +Z, -Z.
 */
export function skinnedBox(largura, altura, profundidade, faces, { emissive = null } = {}) {
  const geometria = new THREE.BoxGeometry(largura, altura, profundidade);
  const materiais = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((lado) => {
    const opcoes = { map: faces[lado] ?? faces.default };
    if (emissive) {
      opcoes.emissive = new THREE.Color(emissive.cor);
      opcoes.emissiveIntensity = emissive.intensidade;
      opcoes.emissiveMap = faces[lado] ?? faces.default;
    }
    return new THREE.MeshLambertMaterial(opcoes);
  });

  return new THREE.Mesh(geometria, materiais);
}
