// A dense-dot still for each video frame: bank, growth, linked rings. Drawn once on a 2D canvas.
(function () {
  const frames = [...document.querySelectorAll('.frame canvas')];
  const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const col = (x, cx, hw, ph) => .28 + .72 * (.5 + .5 * Math.cos((x - cx) / hw * 1.25 - ph));
  const shapes = [
    (x, y) => { // bank
      for (let i = -2; i <= 2; i++) { const cx = i * .4; if (Math.abs(x - cx) < .1 && y > -.3 && y < .45) return col(x, cx, .1, .55); }
      if (y > -.42 && y < -.3 && Math.abs(x) < 1.0) return .62;
      if (y < -.42 && y > -.78 + Math.abs(x) / 1.05 * .36 && Math.abs(x) < 1.05) return .8 - .25 * Math.abs(x);
      for (let k = 0; k < 3; k++) if (y > .45 + k * .08 && y < .53 + k * .08 && Math.abs(x) < 1.0 + k * .12) return .5 - k * .05;
      return -1;
    },
    (x, y) => { // growth
      for (let i = 0; i < 6; i++) { const cx = -.9 + i * .36, top = .55 - (i + 1) * .2; if (Math.abs(x - cx) < .13 && y > top && y < .6) return col(x, cx, .13, .6) * (.8 + .2 * (1 - (y - top) / 1.2)); }
      return -1;
    },
    (x, y) => { // a suspension bridge
      for (const s of [-1, 1]) if (Math.abs(x - s * .55) < .07 && y > -.55 && y < .62) return col(x, s * .55, .07, .6);
      if (Math.abs(y + .3) < .035 && Math.abs(x) < 1.15) return .55;
      if (Math.abs(y + .78 - 0) < .03 && Math.abs(x) < 1.2) return .35;
      const cab = Math.abs(x) <= .55 ? -.12 + (.62 - -.12) * (x / .55) ** 2 : .62 - (Math.abs(x) - .55) / .6 * .88;
      if (Math.abs(y - cab) < .028 && Math.abs(x) < 1.15) return .7;
      if (Math.abs(x) < .55 && y < cab && y > -.3 && Math.abs(((x + 1) * 9) % 1 - .5) < .07) return .6;
      return -1;
    }
  ];
  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    frames.forEach((c, k) => {
      const w = c.clientWidth, h = c.clientHeight; if (!w) return;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      const x = c.getContext('2d'), R = rng(k * 977 + 5), u = h / 2, f = shapes[k % shapes.length], d = 1.25 * dpr;
      for (let i = 0; i < 90000; i++) {
        const px = (R() * 2 - 1) * (w / h), py = R() * 2 - 1, v = f(px, py);
        if (v < 0) continue;
        x.fillStyle = v > .5 ? `rgba(226,234,255,${(.35 + v * .6).toFixed(2)})` : `rgba(5,14,70,${(.95 - v).toFixed(2)})`;
        x.fillRect((px * u + w / 2) * dpr, (py * u + h / 2) * dpr, d, d);
      }
    });
  }
  draw(); let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 200); });
})();
