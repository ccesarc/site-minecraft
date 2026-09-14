import * as THREE from 'three';
import { animateAtlas, buildAtlas } from './textures/atlas.js';
import { VoxelWorld } from './voxel/mesher.js';
import { buildIsland, buildFloatingBlocks } from './world/island.js';
import { buildHouse } from './world/house.js';
import { buildCherryTree } from './world/tree.js';
import { buildPortal, portalCenter } from './world/portal.js';
import { buildFarm, FARM } from './world/farm.js';
import { createPlantField, scatterOnGrass } from './world/plants.js';
import { buildNether } from './world/nether.js';
import { createGhast } from './mobs/ghast.js';
import { createCreeper } from './mobs/creeper.js';
import { createPetals } from './fx/petals.js';
import { createEmbers, createPortalSparks } from './fx/embers.js';
import { createJourney } from './scroll/timeline.js';
import './style.css';

// ------------------------------------------------------------------ loader

const loader = document.querySelector('#loader');
const barraLoader = loader.querySelector('.loader__preenche');
const textoLoader = loader.querySelector('.loader__etapa');

// Cede um quadro ao navegador entre etapas: sem isso a montagem roda num
// bloco so' e a barra pula de 0 direto para 100.
function etapa(fracao, texto) {
  barraLoader.style.transform = `scaleX(${fracao})`;
  textoLoader.textContent = texto;
  return new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
}

const canvas = document.querySelector('#scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87b9e8');
scene.fog = new THREE.Fog('#a8ccec', 40, 130);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);

// ---------------------------------------------------------------- overworld

const overworld = new THREE.Group();
scene.add(overworld);

await etapa(0.05, 'Pintando texturas');
buildAtlas();

await etapa(0.15, 'Gerando terreno');
const ilha = new VoxelWorld();
buildIsland(ilha);
buildPortal(ilha);
buildHouse(ilha);
buildCherryTree(ilha, { x: 9, z: -9, altura: 8 });
const trigo = buildFarm(ilha);

overworld.add(ilha.build());
overworld.add(buildFloatingBlocks().build({ castShadow: false }));

await etapa(0.4, 'Plantando');

// A grama alta nasce so' onde nao ha' construcao em cima.
const ocupado = [
  FARM,
  { x0: 4, x1: 14, z0: -6, z1: 3 },   // casa
  { x0: -5, x1: 2, z0: -2, z1: 2 },   // portal
];

overworld.add(createPlantField('grass_tuft', scatterOnGrass(ilha, { densidade: 0.3, evitar: ocupado })));
overworld.add(createPlantField('rose', scatterOnGrass(ilha, { densidade: 0.02, evitar: ocupado })));
overworld.add(createPlantField('wheat', trigo, { escala: 1.05 }));

await etapa(0.5, 'Chamando os mobs');
const creeper = createCreeper();
creeper.position.set(3.5, 1, -3.5);
creeper.rotation.y = -0.6;
overworld.add(creeper);

const petalas = createPetals({ centro: { x: 9, z: -9 } });
overworld.add(petalas);

const centroPortal = portalCenter();
const faiscas = createPortalSparks(centroPortal);
overworld.add(faiscas);

// Luz quente escapando pelo portal e pelas janelas da casa.
const luzPortal = new THREE.PointLight('#a75cff', 3.2, 16, 2);
luzPortal.position.set(centroPortal.x, centroPortal.y, centroPortal.z + 1);
overworld.add(luzPortal);

const luzJanela = new THREE.PointLight('#ffb45e', 2.4, 12, 2);
luzJanela.position.set(8, 3, 1.5);
overworld.add(luzJanela);

// ------------------------------------------------------------------- nether

const netherGroup = new THREE.Group();
netherGroup.visible = false;
scene.add(netherGroup);

await etapa(0.6, 'Abrindo o Nether');
netherGroup.add(buildNether().build({ castShadow: false, receiveShadow: false }));

const ghast = createGhast();
ghast.position.set(-4, 12, -6);
ghast.userData.alturaBase = 12;
netherGroup.add(ghast);

netherGroup.add(createEmbers());

const brilhoLava = new THREE.PointLight('#ff6a1e', 4, 70, 1.6);
brilhoLava.position.set(0, 2, -6);
netherGroup.add(brilhoLava);

// Luz propria do Nether: sem ela o Ghast fica cinza em vez de palido.
netherGroup.add(new THREE.HemisphereLight('#d8c4b0', '#6b1f14', 1.1));

// --------------------------------------------------------------------- luz

const sol = new THREE.DirectionalLight('#fff4dd', 2.1);
sol.position.set(30, 44, 22);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.camera.left = -40;
sol.shadow.camera.right = 40;
sol.shadow.camera.top = 40;
sol.shadow.camera.bottom = -40;
sol.shadow.camera.far = 140;
sol.shadow.bias = -0.0012;
scene.add(sol);

scene.add(new THREE.HemisphereLight('#bcd9f5', '#4a4033', 1.35));

// ----------------------------------------------------------------- jornada

const jornada = createJourney({
  camera,
  scene,
  overworld,
  nether: netherGroup,
  flashEl: document.querySelector('#flash'),
  dicaEl: document.querySelector('.scroll-hint'),
});

// Compila os shaders dos dois mundos atras do loader. Sem isso o Nether
// compilaria no primeiro quadro em que aparece, no meio da travessia.
// Duas passadas porque o programa depende de quais luzes estao visiveis.
await etapa(0.75, 'Compilando shaders');
await renderer.compileAsync(scene, camera);
overworld.visible = false;
netherGroup.visible = true;
await renderer.compileAsync(scene, camera);
netherGroup.visible = false;
overworld.visible = true;

// ------------------------------------------------------------------ render

const relogio = new THREE.Clock();

function render() {
  const delta = Math.min(relogio.getDelta(), 0.1);
  const tempo = relogio.getElapsedTime();

  animateAtlas(tempo);
  const { mistura } = jornada.update();

  // So' atualiza o que esta' na tela: o mundo escondido nao gasta CPU.
  if (overworld.visible) {
    petalas.userData.update(tempo, delta);
    faiscas.userData.update(tempo, delta);
    creeper.userData.update(tempo);
    luzPortal.intensity = 3.2 + Math.sin(tempo * 3.1) * 0.7;
    luzJanela.intensity = 2.4 + Math.sin(tempo * 7.3) * 0.5;
  }

  if (netherGroup.visible) {
    ghast.userData.update(tempo);
    netherGroup.children.forEach((c) => c.userData.update?.(tempo, delta));
    brilhoLava.intensity = 4 + Math.sin(tempo * 2.2) * 0.8;
  }

  sol.intensity = 2.1 * (1 - mistura);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.body.classList.add('is-ready');

// Espera a fonte pixelada: revelar antes mostraria o texto trocando de fonte.
// O teto de 3s impede que um CDN lento prenda o loader.
await etapa(1, 'Pronto');
await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]);
loader.classList.add('is-saindo');
// Filtra pelo alvo: o transitionend da barra tambem sobe ate' aqui.
loader.addEventListener('transitionend', (e) => {
  if (e.target === loader) loader.remove();
});
