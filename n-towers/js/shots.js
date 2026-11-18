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
  dusk:  { top: '#1647DB', hor: '#86a3ea', warm: '#ffb680', warmAmt: .55, stars: 0, fog: '#5b78cb', fogD: .0040, sun: 3.6, sunCol: '#ffd6aa', hemi: .75, hemiS: '#6f93ff', hemiG: '#1c2240', exp: 1.0, env: 1.0, lit: .75, camI: 0, camCol: '#ffd7a8', aheadI: 900, aheadCol: '#ffb870', aheadD: 10 },
  gold:  { top: '#1647DB', hor: '#9db2ea', warm: '#ffbf8a', warmAmt: .75, stars: 0, fog: '#6a82cd', fogD: .0034, sun: 4.4, sunCol: '#ffd2a0', hemi: .8, hemiS: '#7a9aff', hemiG: '#242a48', exp: 1.0, env: 1.0, lit: .6, camI: 0, camCol: '#ffd7a8', aheadI: 0, aheadCol: '#ffb870', aheadD: 10 },
  hall:  { top: '#1647DB', hor: '#9db2ea', warm: '#ffbf8a', warmAmt: .75, stars: 0, fog: '#2a2622', fogD: .0085, sun: 6.0, sunCol: '#ffd2a0', hemi: .28, hemiS: '#a9b8ff', hemiG: '#3a3026', exp: 1.25, env: .3, lit: .5, camI: 420, camCol: '#ffe0b8', aheadI: 0, aheadCol: '#ffb870', aheadD: 10 },
  vault: { top: '#050a26', hor: '#0b1650', warm: '#000000', warmAmt: 0, stars: 0, fog: '#050b2a', fogD: .016, sun: 0, hemi: .16, hemiS: '#6a8cff', hemiG: '#10142a', exp: 1.35, env: .08, lit: .5, camI: 260, camCol: '#bcd0ff', aheadI: 2600, aheadCol: '#2a5bff', aheadD: 14 },
  night: { top: '#040a28', hor: '#18287a', warm: '#4a68e8', warmAmt: .25, stars: 1, fog: '#0a1238', fogD: .0030, sun: 0, hemi: .9, hemiS: '#5a7cff', hemiG: '#0c1030', exp: 1.15, env: .16, lit: 1.5, camI: 0, camCol: '#ffd7a8', aheadI: 0, aheadCol: '#ffb870', aheadD: 10 },
  floor: { top: '#040a28', hor: '#18287a', warm: '#4a68e8', warmAmt: .25, stars: 1, fog: '#0b0b18', fogD: .0075, sun: 0, hemi: .4, hemiS: '#8fa8ff', hemiG: '#201a24', exp: 1.25, env: .1, lit: 1.3, camI: 380, camCol: '#ffe6c4', aheadI: 3000, aheadCol: '#9fb8ff', aheadD: 16 },
  dawn:  { top: '#1647DB', hor: '#ffb98a', warm: '#ffd7a0', warmAmt: 1, stars: 0, fog: '#7e8fd6', fogD: .0028, sun: 0, hemi: .95, hemiS: '#8fb0ff', hemiG: '#2a3052', exp: 1.0, env: .8, lit: .95, camI: 0, camCol: '#ffd7a8', aheadI: 0, aheadCol: '#ffb870', aheadD: 10 },
};
