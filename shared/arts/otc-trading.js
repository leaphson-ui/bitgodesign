/* OTC Trading UI arts (status: review). Registered into the shared UI registry (Modules.uiKit); same language as scSecurity /
   goNetwork and the electronic-trading arts: white product panels, one dark panel, Inter Tight, BitGo blue, one eased loop that
   ends on a complete still frame (reduced motion draws that frame). Styles: otc-trading.css.
     otcResearch  research: a market analysis opens, its chart draws, an insight is pinned on it, and the insights list fills
                  with the desk's own offerings (spot, derivatives, prediction markets). No figures, no claims.             */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, sm, cl, pop, reduce } = K;

  UI.otcResearch = el => {
    const N = 28, CW = 292, CH = 118, pts = [];
    for (let i = 0; i < N; i++) { const x = i / (N - 1) * CW, v = .5 + .22 * Math.sin(i * .42 + .6) + .1 * Math.sin(i * 1.3) + .012 * i; pts.push([x, CH - cl(v) * CH * .9 - 6]); }
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), area = d + `L${CW} ${CH}L0 ${CH}Z`, pin = pts[19];
    const chart = `<svg class="oc-ch" style="left:24px;top:82px" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
      <defs><linearGradient id="ocg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1647DB" stop-opacity=".18"/><stop offset="1" stop-color="#1647DB" stop-opacity="0"/></linearGradient>
      <clipPath id="occ"><rect data-k="clip" x="0" y="0" width="0" height="${CH}"/></clipPath></defs>
      ${[.25, .5, .75].map(g => `<line class="gl" x1="0" x2="${CW}" y1="${(CH * g).toFixed(1)}" y2="${(CH * g).toFixed(1)}"/>`).join('')}
      <g clip-path="url(#occ)"><path class="ar" d="${area}"/><path class="ln" d="${d}"/></g>
      <circle class="pt" data-k="pt" cx="${pin[0].toFixed(1)}" cy="${pin[1].toFixed(1)}" r="5"/></svg>`;
    const rep = B(0, 0, 340, 300, 'u-p',
      T(24, 28, 'Research', 12, { w: 600, c: 'a' }) + T(24, 54, 'Market analysis', 18, { w: 600, c: 'k' }) + '<span class="oc-chip" style="right:20px;top:20px">BTC-USD</span>' + hr(24, 72, 292) + chart +
      `<span class="oc-tag" data-k="tag" style="left:${(24 + pin[0] - 30).toFixed(0)}px;top:${(82 + pin[1] - 38).toFixed(0)}px">Insight</span>` +
      [292, 256, 188].map((w, i) => `<i class="oc-sk" style="left:24px;top:${216 + i * 16}px;width:${w}px"></i>`).join(''));
    const TOP = ['Spot', 'Derivatives', 'Prediction Markets'];
    const ins = B(200, 262, 320, 146, 'u-p dk', T(20, 28, 'Insights', 12.5, { w: 600, c: 'dm' }) +
      TOP.map((n, i) => `<div class="oc-row" data-k="r${i}" style="left:20px;top:${46 + i * 30}px;width:280px;height:24px"><span class="oc-lb">${n}</span><i class="oc-sk dk" style="left:${n.length * 7 + 34}px;top:9px;width:${150 - i * 22}px"></i></div>`).join(''));
    K.mountUI(el, 520, 408, rep + ins, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      R.clip.setAttribute('width', (CW * f(.4, 2.2)).toFixed(1));
      const p = f(2.3, 2.7); R.pt.style.opacity = p; R.pt.setAttribute('r', (5 * (.4 + .6 * pop(p))).toFixed(2));
      const g = f(2.6, 3.0); R.tag.style.opacity = g; R.tag.style.transform = `translateY(${((1 - g) * 6).toFixed(2)}px)`;
      TOP.forEach((_, i) => { const a = f(3.3 + i * .4, 3.7 + i * .4); R['r' + i].style.opacity = a; R['r' + i].style.transform = `translateX(${((1 - a) * -10).toFixed(2)}px)`; });
    });
  };
})();
