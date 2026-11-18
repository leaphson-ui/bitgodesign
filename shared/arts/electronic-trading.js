/* Electronic Trading UI arts (status: review). Registered into the shared UI registry (Modules.uiKit), so any page can use them
   by name in a 50/50 (visual: { ui }) or a 3x multicard card (art). Same language as scSecurity / scApi / goNetwork: white
   product panels, one dark panel, Inter Tight, BitGo blue, one eased loop that ends on a complete still frame (reduced motion
   draws that frame and never loops). Figures are the ones the live page's own product images show. Styles: electronic-trading.css.
     etLiquidity  one order through one connection, filled across liquidity providers, OTC desks, market makers and exchanges
     etFunding    a 12.5 BTC buy executes against collateral in custody: no pre-funding, holdings sold: none
   The page's other arts are reused from shared/system: gmElectronic, gmTools, gmVoice, gmFinancing (ui-arts.js), goNetwork.   */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, reduce } = K;
  const pill = (k, a, b, x, y, w) => `<div class="pill" data-k="${k}" style="right:${x}px;top:${y}px;height:26px;width:${w}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, w0, w1) => { pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };   // old label fully out before the new one comes in
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const btn = (k, x, y, w, a, b) => B(x, y, w, 40, 'et-btn', `<span data-k="${k}0">${a}</span><span data-k="${k}1">${TICKW}${b}</span>`, k);
  const press = (n, tt, at) => { const p = sm(at - .15, at, tt) * (1 - sm(at, at + .2, tt)); n.style.transform = `scale(${(1 - p * .05).toFixed(3)})`; };
  /* Liquidity Without Complexity: one connection out of Global Markets fans out to the four kinds of liquidity the live diagram
     names; each fills its part and the single order completes. */
  UI.etLiquidity = el => {
    const V = [['LP', 'Liquidity Providers', 4.0], ['OD', 'OTC Desks', 2.5], ['MM', 'Market Makers', 3.5], ['EX', 'Exchanges', 2.5]];
    const ry = i => 56 + i * 76;
    const hub = B(0, 106, 236, 160, 'u-p dk',
      T(22, 30, 'Global Markets', 13.5, { w: 600, c: 'wt' }) + T(22, 50, 'Single connection', 12, { c: 'dm' }) +
      T(22, 94, 'Buy 12.5 BTC', 22, { w: 600, c: 'wt' }) + B(22, 116, 192, 6, 'bar et-dbar', '<i data-k="fb"></i>') +
      T(22, 138, 'Filled', 12, { c: 'dm' }) + T(214, 138, '0.0 BTC', 12, { w: 600, c: 'wt', al: 'r', k: 'fc' }));
    const rows = V.map(([a, n], i) => B(16, ry(i), 228, 64, 'et-r',
      B(12, 16, 32, 32, 'av', a, 'va' + i) + T(54, 24, n, 13.5, { w: 600, c: 'k' }) + T(54, 42, 'Ready', 12, { c: 'm', k: 'vs' + i }) + T(54, 42, '', 12, { c: 'a', k: 'vf' + i }) +
      CK('vc' + i, 194, 22, 20), 'vr' + i)).join('');
    const src = B(330, 0, 260, 372, 'u-p', T(22, 30, 'Liquidity', 12.5, { w: 600, c: 'm' }) + T(238, 30, '4 sources', 12.5, { w: 600, c: 'a', al: 'r' }) + rows);
    const path = i => { const y = ry(i) + 32; return `M236 186C290 186 290 ${y} 346 ${y}`; };
    const lines = `<svg class="et-ln" width="590" height="372" viewBox="0 0 590 372">${V.map((_, i) => `<path class="bs" d="${path(i)}"/><path class="pg" data-k="pg${i}" pathLength="1" d="${path(i)}"/>`).join('')}</svg>`;
    mountUI(el, 590, 372, lines + hub + src, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let filled = 0;
      V.forEach(([, , amt], i) => {
        const go = f(.7 + i * .22, 1.5 + i * .22), ok = f(1.9 + i * .4, 2.3 + i * .4);
        R['pg' + i].style.strokeDashoffset = (1 - go).toFixed(4);
        R['vr' + i].classList.toggle('act', go > .6 && ok < .9 && off < .5);
        R['va' + i].classList.toggle('on', go > .6 && off < .5);
        setCk(R['vc' + i], ok, sm(1.4 + i * .22, 1.6 + i * .22, tt) * (1 - sm(1.8 + i * .4, 1.9 + i * .4, tt)) * (1 - off), t);
        setTx(R['vf' + i], amt.toFixed(1) + ' BTC filled'); swap(R['vs' + i], R['vf' + i], ok);
        filled += amt * ok;
      });
      R.fb.style.width = (filled / 12.5 * 100).toFixed(2) + '%'; setTx(R.fc, filled.toFixed(1) + ' BTC');
    });
  };

  /* Flexible Funding: the live product image's trade. A 12.5 BTC buy against collateral held in custody: no pre-funding, no
     holdings sold; the buy executes and the fill confirms. */
  UI.etFunding = el => {
    const rows = [['Collateral in custody', '22.4 BTC'], ['Collateral value', '1,825,877.76 USD'], ['Holdings sold', 'None']];
    const card = B(0, 0, 360, 330, 'u-p',
      B(24, 18, 30, 30, 'av on', 'B') + T(64, 34, 'Buy 12.5 BTC', 13.5, { w: 600, c: 'k' }) + pill('pill', 'Pending', 'Executed', 24, 20, 84) +
      T(24, 86, '1,018,900.00', 32, { w: 600, c: 'k' }) + T(234, 92, 'USD', 13, { w: 600, c: 'm' }) + T(24, 114, 'without pre-funding', 12.5, { c: 'a', w: 600 }) + hr(24, 134, 312) +
      rows.map(([n, v], i) => { const y = 162 + i * 40; return T(24, y, n, 13, { c: 'm' }) + T(306, y, v, 13, { w: 600, c: 'k', al: 'r' }) + CK('c' + i, 316, y - 9, 18); }).join('') +
      btn('bb', 24, 272, 312, 'Buy', 'Executed'));
    const toast = B(250, 320, 300, 66, 'u-p dk', B(16, 17, 32, 32, 'et-ok', TICKW) + T(60, 25, 'Order filled', 13.5, { w: 600, c: 'wt' }) + T(60, 44, 'Bought 12.5 BTC at 81,512.00 USD', 12, { c: 'dm' }), 'toast');
    mountUI(el, 560, 386, card + toast, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      rows.forEach((_, i) => setCk(R['c' + i], f(.7 + i * .45, 1.1 + i * .45), 0, t));
      press(R.bb, tt, 2.6); const ex = f(2.8, 3.1);
      swap(R.bb0, R.bb1, ex); setPill(R.pill, ex, 76, 96);
      const ts = f(3.3, 3.8); R.toast.style.opacity = ts; R.toast.style.transform = `translateY(${((1 - pop(ts)) * 16).toFixed(2)}px)`;
    });
  };

})();
