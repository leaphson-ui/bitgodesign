/* Prediction Markets UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same
   language as scSecurity / scCompliance / goNetwork: white product panels, one dark panel, Inter Tight, BitGo blue, a short
   eased loop that ends on a complete still frame. Figures come from the live page's own images. Styles: prediction-markets.css.
     pmView        "Have a View? Trade It": pick a market category, take the Yes side, the position fills through the OTC desk
     pmCollateral  "Use What You Hold": holdings switched on as collateral, each allocation bar fills, Idle turns to Posted
     pmPlatform    "One Platform for Everything": one BitGo relationship lights custody, spot, derivatives, financing, staking
                   and prediction markets in turn */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const pill = (k, a, b, style) => `<div class="pill" data-k="${k}" style="${style};height:26px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const flip = (pl, w0, dw, ok) => { pl.style.width = (w0 + dw * ok).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - ok; pl.children[2].style.opacity = 1 - ok; pl.children[1].style.opacity = ok; pl.children[3].style.opacity = ok; };

  /* Have a view? Trade it: the market list moves to Crypto, the market card takes the Yes side, collateral and execution
     check off, and the status turns to Filled. The market is the one on the live hero card. */
  UI.pmView = el => {
    const cats = ['Elections', 'Sports', 'Crypto', 'Macro'];
    const list = B(0, 30, 214, 228, 'u-p dk',
      T(22, 30, 'Markets', 12, { w: 600, c: 'dm' }) + B(10, 52, 194, 40, 'pv-hl', '', 'hl') +
      cats.map((c, i) => T(24, 72 + i * 44, c, 14, { w: 600, c: 'pv-c', k: 'cat' + i })).join(''));
    const card = B(168, 84, 392, 300, 'u-p',
      T(24, 34, 'Crypto', 12.5, { w: 600, c: 'm', k: 'q0' }) + pill('pill', 'Open', 'Filled', 'right:24px;top:21px') +
      T(24, 74, 'Will BTC hit $200k', 25, { w: 600, c: 'k', k: 'q1' }) + T(24, 104, 'before 2027?', 25, { w: 600, c: 'k', k: 'q2' }) +
      B(24, 130, 166, 42, 'pv-yes', '<i data-k="yf"></i><span class="y0">Yes</span><span class="y1" data-k="yl">Yes</span>') +
      B(202, 130, 166, 42, 'pv-no', '<span>No</span>') + hr(24, 192, 344) +
      [['Collateral in custody', '6 BTC'], ['Execution', 'BitGo OTC desk']].map(([n, v], i) => { const y = 222 + i * 44; return T(24, y, n, 13, { c: 'm' }) + T(330, y, v, 13.5, { w: 600, c: 'k', al: 'r' }) + CK('c' + i, 346, y - 11, 22); }).join(''));
    mountUI(el, 560, 400, list + card, (R, t) => {
      if (reduce) t = 6.5;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .9, a - .7, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const pos = (sm(.3, .7, tt) + sm(.95, 1.35, tt)) * (1 - off);
      R.hl.style.transform = `translateY(${(pos * 44).toFixed(2)}px)`;
      cats.forEach((_, i) => { const a = cl(1 - Math.abs(pos - i)); R['cat' + i].style.color = `rgba(${Math.round(190 + 65 * a)},${Math.round(205 + 50 * a)},255,${(.6 + .4 * a).toFixed(3)})`; });
      const q = sm(1.3, 1.7, tt) * (1 - off); ['q0', 'q1', 'q2'].forEach(k => { R[k].style.opacity = Math.max(.15, cl(q)); });
      const yes = f(2.1, 2.5); R.yf.style.opacity = yes; R.yl.style.opacity = yes;
      setCk(R.c0, f(3.1, 3.6), wait(3.1, 3.6), t); setCk(R.c1, f(4.1, 4.6), wait(4.1, 4.6), t);
      flip(R.pill, 62, 22, f(5.1, 5.6));
    });
  };

  /* Use what you hold: each holding is switched on as collateral and its allocation fills to the live figures
     (Bitcoin 70%, Ethereum 40%, USD Coin 90%). When all three are posted the status turns from Idle to Posted. */
  UI.pmCollateral = el => {
    const rows = [['BTC', 'Bitcoin', '2.4 BTC', 70], ['ETH', 'Ethereum', '12.8 ETH', 40], ['USDC', 'USD Coin', '310,000 USDC', 90]];
    const card = B(0, 0, 460, 318, 'u-p',
      T(24, 34, 'Collateral allocation', 14, { w: 600, c: 'k' }) + pill('pill', 'Idle', 'Posted', 'right:24px;top:21px') + hr(24, 56, 412) +
      rows.map(([tk, n, amt], i) => { const y = 66 + i * 66;
        return B(24, y + 18, 44, 28, 'chip', tk, 'ch' + i) + T(80, y + 24, n, 14, { w: 600, c: 'k' }) + T(80, y + 42, amt, 12, { c: 'm' }) +
          B(206, y + 30, 130, 6, 'bar', `<i data-k="bf${i}"></i>`) + T(380, y + 33, '0%', 12.5, { w: 600, c: 'a', al: 'r', k: 'pc' + i }) +
          B(398, y + 23, 38, 20, 'sw', `<i data-k="sw${i}"></i><b data-k="kn${i}"></b>`); }).join('') +
      hr(24, 270, 412) + T(24, 292, 'Collateral in custody', 12.5, { c: 'm' }) + CK('ck', 416, 282, 20));
    mountUI(el, 460, 318, card, (R, t) => {
      if (reduce) t = 7;
      const P = 9.5, tt = t % P, off = sm(8.6, 9.3, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      rows.forEach((r, i) => {
        const s0 = .5 + i * 1.5, on = f(s0, s0 + .35), fill = f(s0 + .35, s0 + 1.25);
        R['sw' + i].style.opacity = on; R['kn' + i].style.transform = `translateX(${(18 * on).toFixed(2)}px)`;
        R['ch' + i].classList.toggle('on', on > .5);
        R['bf' + i].style.width = (fill * r[3]).toFixed(2) + '%'; setTx(R['pc' + i], Math.round(fill * r[3]) + '%');
      });
      const ok = f(5.2, 5.7); flip(R.pill, 56, 30, ok); setCk(R.ck, ok, 0, t);
    });
  };

  /* One platform for everything: one BitGo relationship on the left; a signal runs down each branch in turn and lights
     custody, spot, derivatives, financing, staking and prediction markets (the live copy's list), ending on prediction markets. */
  const SHIELD = 'M156.282 104.257C156.282 146.692 78.3938 183.634 78.3938 183.634C78.3938 183.634 0.50478 146.692 0.50478 104.257C0.50478 93.2381 0.509268 83.5104 0.513558 74.2098C0.522088 55.7192 0.52984 38.9167 0.5 17.0094C49.9579 -5.62206 106.836 -5.59857 156.282 17.0588V104.257ZM72.3134 30.3623H62.2633V40.3298H52.2132V123.406H62.2633V133.376H72.3134V123.406H82.3636V133.376H92.4137V122.448C105.183 119.755 112.514 111.51 112.514 99.2681C112.514 90.7144 106.987 82.981 97.5309 80.5203C105.882 78.0597 110.672 70.9121 110.672 62.9443C110.672 51.6072 103.818 43.6576 92.4137 41.1626V30.3623H82.3636V40.3298H72.3134V30.3623ZM81.1969 53.3361C89.6709 53.3361 94.5834 57.2028 94.5834 63.7645C94.5834 70.3262 89.9165 74.193 82.0565 74.193H67.9332V53.3361H81.1969ZM82.1794 86.8477C91.6359 86.8477 96.4256 90.7144 96.4256 98.4479C96.4256 105.478 90.6534 109.814 81.3197 109.814H67.9332V86.8477H82.1794Z';
  UI.pmPlatform = el => {
    const items = ['Custody', 'Spot', 'Derivatives', 'Financing', 'Staking', 'Prediction markets'], GAP = 64, Y0 = 8, CY = Y0 + 24, MID = Y0 + 24 + GAP * 2.5;
    const node = B(0, MID - 44, 196, 88, 'u-p dk',
      `<svg class="pp-sh" viewBox="0 0 157 184" style="left:22px;top:24px;width:34px;height:40px"><path d="${SHIELD}" fill-rule="evenodd"/></svg>` +
      T(70, 36, 'BitGo', 19, { w: 600, c: 'wt' }) + T(70, 58, 'One relationship', 12, { c: 'dm' }));
    const paths = items.map((_, i) => { const y = CY + i * GAP; return `M196 ${MID}H262V${y}H330`; });
    const lines = `<svg class="pp-l" width="560" height="400" viewBox="0 0 560 400">${paths.map(d => `<path class="bs" d="${d}"/>`).join('')}${paths.map((d, i) => `<path class="pg" data-k="pg${i}" pathLength="1" d="${d}"/>`).join('')}</svg>`;
    const chips = items.map((n, i) => B(330, Y0 + i * GAP, 230, 48, 'pp-c', T(20, 24, n, 14, { w: 600, c: 'k' }) + CK('c' + i, 196, 13, 22), 'it' + i)).join('');
    mountUI(el, 560, 400, lines + node + chips, (R, t) => {
      if (reduce) t = 7.8;
      const P = 10, tt = t % P, off = sm(9, 9.7, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      items.forEach((_, i) => {
        const s0 = .4 + i * .95, run = f(s0, s0 + .6), ck = f(s0 + .55, s0 + .85);
        R['pg' + i].style.strokeDashoffset = (1 - run).toFixed(4);
        setCk(R['c' + i], ck, 0, t);
        const last = i === items.length - 1;
        R['it' + i].classList.toggle('act', (tt > s0 && tt < s0 + 1.1 && off < .5) || (last && ck > .5));
      });
    });
  };
})();
