import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * A jornada inteira e' UMA curva de camera, nao quatro cenas.
 *
 * O scroll dirige um unico valor `t` (0 -> 1). Posicao, alvo, neblina, ceu e
 * qual mundo esta' visivel saem todos desse mesmo `t`, entao nada dessincroniza.
 */

// Pontos de controle. A curva Catmull-Rom passa exatamente por cada um deles,
// o que garante que a camera realmente atravesse o vao do portal.
const CAMERA = [
  new THREE.Vector3(22, 13.5, 26),  // 01 — plano aberto da ilha
  new THREE.Vector3(8, 7, 16),     // 02 — desce e aproxima do portal
  new THREE.Vector3(-1.5, 3.4, 7), // 03 — portal enquadrado, enchendo a tela
  new THREE.Vector3(-1.5, 3.4, -1),// 04 — dentro do vao
  new THREE.Vector3(6, 9, 22),     // 05 — do outro lado, no Nether
];

const ALVO = [
  new THREE.Vector3(-5, 1.5, 4),
  new THREE.Vector3(1.9, 3.2, -2),
  new THREE.Vector3(-1.5, 3.4, 0),
  new THREE.Vector3(-1.5, 3.4, -8),
  new THREE.Vector3(-2, 8, 0),
];

// `t` em que a camera cruza o plano do portal: e' aqui que o mundo troca.
const TRAVESSIA = 0.75;
const MEIA_JANELA = 0.05;

const CEU_OVERWORLD = new THREE.Color('#87b9e8');
const CEU_NETHER = new THREE.Color('#2a0d0d');
const NEVOA_OVERWORLD = new THREE.Color('#a8ccec');
const NEVOA_NETHER = new THREE.Color('#400f0f');

export function createJourney({ camera, scene, overworld, nether, flashEl, dicaEl }) {
  const curvaCamera = new THREE.CatmullRomCurve3(CAMERA, false, 'catmullrom', 0.3);
  const curvaAlvo = new THREE.CatmullRomCurve3(ALVO, false, 'catmullrom', 0.3);

  const estado = { t: 0 };
  const alvoAtual = new THREE.Vector3();
  const mouse = { x: 0, y: 0, suaveX: 0, suaveY: 0 };

  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Respeita quem pediu menos movimento: o scroll ainda avanca, mas sem
  // suavizacao nem parallax de mouse.
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top top',
    end: 'bottom bottom',
    scrub: reduzido ? true : 1.1,
    onUpdate: (self) => {
      estado.t = self.progress;
    },
  });

  // Cada capitulo acende quando entra na sua faixa de scroll.
  gsap.utils.toArray('.chapter').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      // Faixa estreita: com 75/25 dois cards ficavam acesos ao mesmo tempo
      // na virada de capitulo.
      start: 'top 45%',
      end: 'bottom 55%',
      onToggle: (self) => el.classList.toggle('is-active', self.isActive),
    });
  });

  function update() {
    const t = THREE.MathUtils.clamp(estado.t, 0, 1);

    curvaCamera.getPoint(t, camera.position);
    curvaAlvo.getPoint(t, alvoAtual);

    if (!reduzido) {
      // Parallax leve de mouse: da' vida sem competir com o scroll.
      mouse.suaveX += (mouse.x - mouse.suaveX) * 0.05;
      mouse.suaveY += (mouse.y - mouse.suaveY) * 0.05;
      camera.position.x += mouse.suaveX * 1.2;
      camera.position.y += -mouse.suaveY * 0.8;
    }

    camera.lookAt(alvoAtual);

    // 0 antes do portal, 1 depois. A troca acontece no meio da janela.
    const mistura = THREE.MathUtils.smoothstep(t, TRAVESSIA - MEIA_JANELA, TRAVESSIA + MEIA_JANELA);

    // A troca e' seca, no pico exato do clarao. Uma faixa de sobreposicao
    // deixava a grama verde aparecer por tras do roxo.
    const noNether = mistura >= 0.5;
    overworld.visible = !noNether;
    nether.visible = noNether;

    scene.background.copy(CEU_OVERWORLD).lerp(CEU_NETHER, mistura);
    scene.fog.color.copy(NEVOA_OVERWORLD).lerp(NEVOA_NETHER, mistura);
    scene.fog.near = THREE.MathUtils.lerp(40, 8, mistura);
    scene.fog.far = THREE.MathUtils.lerp(130, 52, mistura);

    // Clarao roxo cobrindo a costura entre os dois mundos.
    if (flashEl) {
      // Sobe rapido e desce rapido: o clarao so' precisa durar o suficiente
      // para esconder a troca de mundo.
      const dist = Math.abs(t - TRAVESSIA) / (MEIA_JANELA * 2.2);
      const pico = Math.max(0, 1 - dist * dist);
      flashEl.style.opacity = String(Math.min(1, pico * 1.35));
    }

    // A dica de rolagem so' faz sentido antes da jornada comecar.
    if (dicaEl) dicaEl.classList.toggle('is-hidden', t > 0.04);

    return { t, mistura };
  }

  return { update, estado };
}
