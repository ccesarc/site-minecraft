/**
 * Registro de tipos de bloco. Cada tipo diz qual tile do atlas usar em cada
 * face — por isso a grama tem topo verde e lado com terra, sem gambiarra.
 */

function faces(all) {
  return { top: all, bottom: all, side: all };
}

export const BLOCKS = {
  grass: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' },
  dirt: faces('dirt'),
  stone: faces('stone'),
  cobble: faces('cobble'),
  planks: faces('oak_planks'),
  dark_planks: faces('dark_planks'),
  log: { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log_side' },
  leaves: { ...faces('leaves_pink'), tint: 1.0 },
  window: faces('window'),
  obsidian: faces('obsidian'),
  glowstone: { ...faces('glowstone'), emissive: 0.9 },
  netherrack: faces('netherrack'),
  magma: { ...faces('magma'), emissive: 0.45 },
  soul_sand: faces('soul_sand'),
  sand: faces('sand'),

  // Liquidos: translucidos e sem face interna entre si.
  water: { ...faces('water'), liquid: true, opacity: 0.72 },
  lava: { ...faces('lava'), liquid: true, opacity: 1, emissive: 1.0 },

  // O portal e' o unico bloco que brilha e anima a UV.
  portal: { ...faces('portal'), liquid: true, opacity: 0.92, emissive: 1.0, animated: true },
};

export function tileFor(type, face) {
  const def = BLOCKS[type];
  if (!def) throw new Error(`bloco desconhecido: ${type}`);
  if (face === 'top') return def.top;
  if (face === 'bottom') return def.bottom;
  return def.side;
}

export const isLiquid = (type) => Boolean(BLOCKS[type]?.liquid);
export const isEmissive = (type) => Boolean(BLOCKS[type]?.emissive);
