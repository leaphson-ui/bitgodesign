// Camera shots. `at` is a section id (or a sub-element id), `p` is the position inside that element (0 top, 1 bottom).
// Between two shots the camera follows a smooth curve; palette, door and other channels blend linearly.
export const TX = [-92, -46, 0, 46, 92], TZ = -226, TH = [210, 150, 240, 120, 260];
const CX = [-54, -28, 0, 28, 54];

const core = TX.map((tx, i) => ({
  at: '#core-' + i, p: 0.5, pos: [CX[i], 7 + i * 1.5, -156], look: [tx * 0.92, TH[i] * 0.42, TZ], pal: 'gold', core: i,
}));

export const SHOTS = [
  { at: 'hero', p: 0.0, pos: [0, 1.6, 66], look: [0, 25, 22], pal: 'dusk' },
  { at: 'hero', p: 0.92, pos: [0, 1.8, 36], look: [0, 15, -2], pal: 'dusk' },
  { at: 'trust', p: 0.15, pos: [0, 2.1, 22], look: [0, 6.2, -16], pal: 'dusk' },
  { at: 'trust', p: 0.85, pos: [1, 2.4, -6], look: [0, 6.2, -44], pal: 'gold' },
  { at: 'badges', p: 0.1, pos: [0, 2.3, -50], look: [3, 10, -100], pal: 'gold' },
  { at: 'badges', p: 0.9, pos: [-3, 3.0, -122], look: [2, 13, -170], pal: 'gold' },
  ...core,
  { at: 'established', p: 0.08, pos: [0, 3.2, -216], look: [0, 7, -268], pal: 'hall' },
  { at: 'established', p: 0.9, pos: [-2, 3.3, -292], look: [0, 6.5, -326], pal: 'hall' },
  { at: '#build-0', p: 0.5, pos: [3, 3.4, -310], look: [0, 6, -326], pal: 'hall', door: 0.04 },
  { at: '#build-1', p: 0.5, pos: [0, 3.9, -321], look: [0, 6.6, -346], pal: 'vault', door: 1 },
  { at: '#build-2', p: 0.5, pos: [0, 4.3, -346], look: [0, 7, -360], pal: 'vault', door: 1 },
  { at: 'support', p: 0.04, pos: [0, 4, -366], look: [0, 48, -373], pal: 'night', door: 1 },
  { at: 'support', p: 0.96, pos: [0, 98, -366], look: [0, 126, -375], pal: 'night' },
  { at: 'own', p: 0.08, pos: [0, 116.2, -376], look: [0, 121, -414], pal: 'floor' },
  { at: 'own', p: 0.92, pos: [-3, 116.0, -424], look: [0, 122, -462], pal: 'floor' },
  { at: 'spotlight', p: 0.15, pos: [0, 116.2, -436], look: [0, 123, -462], pal: 'floor' },
  { at: 'spotlight', p: 0.85, pos: [4, 118, -447], look: [0, 124, -462], pal: 'floor' },
  { at: 'latest', p: 0.04, pos: [16, 117, -446], look: [60, 118, -472], pal: 'night' },
  { at: 'latest', p: 0.3, pos: [64, 110, -470], look: [10, 82, -540], pal: 'night' },
  { at: 'latest', p: 0.58, pos: [30, 58, -496], look: [0, 28, -570], pal: 'night' },
  { at: 'latest', p: 0.82, pos: [0, 14, -520], look: [0, 16, -600], pal: 'night' },
  { at: 'latest', p: 1.0, pos: [0, 3.6, -548], look: [0, 17, -630], pal: 'night' },
  { at: 'cta', p: 0.1, pos: [0, 3.8, -640], look: [0, 44, -700], pal: 'night' },
  { at: 'cta', p: 0.55, pos: [0, 70, -674], look: [0, 170, -700], pal: 'dawn' },
  { at: 'cta', p: 0.95, pos: [0, 232, -684], look: [0, 304, -724], pal: 'dawn' },
  { at: 'footer', p: 0.0, pos: [0, 298, -690], look: [0, 190, -360], pal: 'dawn' },
  { at: 'footer', p: 0.45, pos: [0, 300, -692], look: [0, 150, -240], pal: 'dawn' },
];

// colours are sRGB hex. Light values are tuned by eye.
export const PALS = {
  dusk:  { top: '#283247', hor: '#9aa2b0', warm: '#c9b8a4', warmAmt: .18, stars: 0, fog: '#7c8494', fogD: .0046, sun: 3.0, sunCol: '#f2ece4', hemi: .7, hemiS: '#8c96ab', hemiG: '#1c1f26', exp: 1.0, env: .8, lit: .35, camI: 0, camCol: '#f0e8dc', aheadI: 600, aheadCol: '#e8dccb', aheadD: 10 },
  gold:  { top: '#2b3448', hor: '#a3aab6', warm: '#cfc0ad', warmAmt: .2, stars: 0, fog: '#858c99', fogD: .0040, sun: 3.6, sunCol: '#f4eee6', hemi: .72, hemiS: '#919bb0', hemiG: '#22252c', exp: 1.0, env: .8, lit: .3, camI: 0, camCol: '#f0e8dc', aheadI: 0, aheadCol: '#e8dccb', aheadD: 10 },
  hall:  { top: '#2b3448', hor: '#a3aab6', warm: '#cfc0ad', warmAmt: .2, stars: 0, fog: '#26272a', fogD: .0085, sun: 5.2, sunCol: '#f6f0e8', hemi: .26, hemiS: '#a8b0c2', hemiG: '#2c2a28', exp: 1.2, env: .25, lit: .3, camI: 300, camCol: '#efe8de', aheadI: 0, aheadCol: '#e8dccb', aheadD: 10 },
  vault: { top: '#0b0e16', hor: '#1a1f2b', warm: '#000000', warmAmt: 0, stars: 0, fog: '#0c0f16', fogD: .014, sun: 0, hemi: .16, hemiS: '#8a96b2', hemiG: '#121318', exp: 1.3, env: .08, lit: .3, camI: 220, camCol: '#d6dcea', aheadI: 1800, aheadCol: '#9aa8c8', aheadD: 14 },
  night: { top: '#0b0f18', hor: '#2a3142', warm: '#5a6274', warmAmt: .12, stars: 0, fog: '#141821', fogD: .0034, sun: 0, hemi: .75, hemiS: '#7c879e', hemiG: '#101216', exp: 1.1, env: .14, lit: .9, camI: 0, camCol: '#f0e8dc', aheadI: 0, aheadCol: '#e8dccb', aheadD: 10 },
  floor: { top: '#0b0f18', hor: '#2a3142', warm: '#5a6274', warmAmt: .12, stars: 0, fog: '#121317', fogD: .0075, sun: 0, hemi: .38, hemiS: '#9aa4bb', hemiG: '#1c1b1e', exp: 1.2, env: .1, lit: .8, camI: 300, camCol: '#ece6dc', aheadI: 2000, aheadCol: '#b4bed6', aheadD: 16 },
  dawn:  { top: '#26324d', hor: '#c2c4c8', warm: '#e0d4c2', warmAmt: .35, stars: 0, fog: '#8f96a4', fogD: .0030, sun: 0, hemi: .9, hemiS: '#9ea8c0', hemiG: '#262a34', exp: 1.0, env: .7, lit: .5, camI: 0, camCol: '#f0e8dc', aheadI: 0, aheadCol: '#e8dccb', aheadD: 10 },
};
