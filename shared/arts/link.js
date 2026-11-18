/* Link UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / scApp / cwHardware: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on
   a complete still frame (reduced motion draws that frame). Names and figures come from the live page's own product images
   (bitgo.com/products/link/: the Link portfolio screen, the Bitcoin venue list, the Link Admin role editor). Styles: link.css.
     lkPortfolio  "Full Visibility Across Your Portfolio": BitGo and non-BitGo accounts sync in turn, each down to its sub-account,
                  and the total Link value builds to the live $5,596,099
     lkMove       "Move in One Click": 10.0000 BTC moves from Kraken OTC to OKX (marked Best liquidity) with one click; both
                  balances update and the transfer is tracked
     lkRoles      "Centralized Governance": one admin ticks a role's permissions (Link Admin, Link Account Admin, Link Transfer),
                  creates the role once, and it applies to every connected exchange at the same moment */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const HRD = (x, y, w) => B(x, y, w, 1, 'lk-hrd');
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Full visibility: the Link value on the left (the live portfolio screen's total and its asset rows); on the right the connected
     accounts sync one by one, BitGo first, then the exchange accounts, each named down to its sub-account. */
  UI.lkPortfolio = el => {
    const TOTAL = 5596099, A = [['BTC', 'Bitcoin', '38.4210 BTC', '$3,248,864'], ['ETH', 'Ethereum', '412.8500 ETH', '$1,175,467'], ['USDC', 'USD Coin', '486,200.00 USDC', '$486,200']];
    const ACC = [['BG', 'BitGo', 'Custody wallet', 'BitGo', .44], ['KR', 'Kraken OTC', 'Main Account', 'Non-BitGo', .2], ['OK', 'OKX', 'Main Account', 'Non-BitGo', .26], ['CB', 'Coinbase Prime', 'Main Account', 'Non-BitGo', .1]];
    const val = B(0, 0, 318, 316, 'u-p',
      T(24, 34, 'Link', 15, { w: 600, c: 'k' }) + PILL('pill', 'Syncing', 'Up to date', 24, 21) +
      T(24, 72, 'Total Link value', 12, { c: 'm' }) + T(24, 104, '$0', 32, { w: 600, c: 'k', k: 'tot' }) + hr(24, 132, 270) +
      A.map(([tk, n, q, usd], i) => { const y = 146 + i * 54;
        return B(24, y + 8, 44, 28, 'chip', tk, 'ch' + i) + T(80, y + 14, n, 13.5, { w: 600, c: 'k' }) + T(80, y + 31, q, 12, { c: 'm' }) +
          T(294, y + 14, usd, 13.5, { w: 600, c: 'k', al: 'r' }); }).join(''));
    const acc = B(298, 150, 274, 254, 'u-p dk',
      T(22, 28, 'Link accounts', 12, { w: 600, c: 'dm' }) + T(252, 28, '0 of 4 synced', 12, { w: 600, c: 'dm', al: 'r', k: 'cnt' }) + HRD(22, 46, 230) +
      ACC.map(([a, n, sub, kind], i) => { const y = 58 + i * 48;
        return B(22, y + 6, 30, 30, 'av', a, 'av' + i) + T(62, y + 14, n, 13.5, { w: 600, c: 'wt' }) + T(62, y + 31, i ? `${kind} · ${sub}` : sub, 12, { c: i ? 'dm' : 'lk-bg' }) +
          CK('c' + i, 232, y + 12, 18); }).join(''));
    mountUI(el, 572, 404, val + acc, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let share = 0, n = 0;
      ACC.forEach((r, i) => { const s = .8 + i * .75, p = f(s + .45, s + .75), wt = sm(s - .1, s + .1, tt) * (1 - sm(s + .4, s + .5, tt)) * (1 - off);
        setCk(R['c' + i], p, wt, t); R['av' + i].classList.toggle('on', p > .5 || wt > .5); share += r[4] * p; n += p; });
      setTx(R.tot, '$' + fmt(Math.round(TOTAL * share), 0)); setTx(R.cnt, `${Math.floor(n + .5)} of 4 synced`);
      A.forEach((_, i) => R['ch' + i].classList.toggle('on', share > .2 + i * .25));
      setPill(R.pill, f(4.0, 4.5), 'Syncing', 'Up to date');
    });
  };

  /* Move in one click: the live Bitcoin venue list (64.4633 BTC available; Kraken OTC, OKX with Best liquidity, Coinbase Prime).
     The transfer panel sends 10.0000 BTC from Kraken OTC to OKX with one press; the amount travels between the rows, both
     balances update, and the transfer is logged as tracked. */
  UI.lkMove = el => {
    const V = [['KR', 'Kraken OTC', 12.4805, 1458222, -10], ['OK', 'OKX', 48.9276, 5716301, 10], ['CB', 'Coinbase Prime', 3.2140, 375574, 0]], RY = i => 80 + i * 58;
    const list = B(0, 0, 372, 262, 'u-p',
      B(24, 18, 44, 28, 'chip on', 'BTC') + T(80, 26, 'Bitcoin', 15, { w: 600, c: 'k' }) + T(80, 44, '64.4633 BTC available', 12, { c: 'm' }) + hr(24, 68, 324) +
      V.map(([a, n, q, usd], i) => B(16, RY(i), 340, 52, 'kc',
        B(12, 11, 30, 30, 'av', a, 'av' + i) + T(52, 18, n, 13.5, { w: 600, c: 'k' }) + T(52, 35, 'Main Account', 12, { c: 'm' }) +
        (i === 1 ? '<span class="lk-best" style="left:88px;top:9px">Best liquidity</span>' : '') +
        T(324, 18, fmt(q, 4) + ' BTC', 13.5, { w: 600, c: 'k', al: 'r', k: 'q' + i }) + T(324, 35, '$' + fmt(usd, 0), 12, { c: 'm', al: 'r', k: 'u' + i }), 'r' + i)).join(''));
    const form = B(296, 252, 276, 150, 'u-p dk',
      T(22, 28, 'Transfer', 12, { w: 600, c: 'dm' }) + T(254, 28, 'One click', 12, { w: 600, c: 'dm', al: 'r' }) + HRD(22, 46, 232) +
      T(22, 68, 'Kraken OTC → OKX', 13.5, { w: 600, c: 'wt' }) + T(254, 68, '10.0000 BTC', 13.5, { w: 600, c: 'wt', al: 'r' }) +
      B(22, 92, 118, 38, 'cbtn', `<span data-k="b0">Transfer</span><span data-k="b1">${TICKW}Sent</span>`, 'cb') +
      T(226, 111, 'Tracked', 12, { w: 600, c: 'lk-bg', al: 'r', k: 'lt' }) + CK('lc', 236, 102, 18));
    const y0 = RY(0) + 26, y1 = RY(1) + 26, d = `M356 ${y0}C418 ${y0} 418 ${y1} 356 ${y1}`;
    const lines = `<svg class="kl" width="572" height="402" viewBox="0 0 572 402"><path class="bs lk-p" d="${d}"/><path class="pg" data-k="pg" pathLength="1" d="${d}"/></svg>`;
    const mv = '<div class="mv" data-k="mv"><span>10.0000 BTC</span></div>';
    mountUI(el, 572, 402, lines + list + form + mv, (R, t) => {
      if (reduce) t = 7.5;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const press = sm(1.6, 1.75, tt) * (1 - sm(1.75, 1.95, tt)); R.cb.style.transform = `scale(${(1 - press * .05).toFixed(3)})`;
      const sent = f(1.9, 2.2), go = f(2.2, 3.3), moved = f(2.6, 3.4), log = f(3.5, 3.9);
      swap(R.b0, R.b1, sent);
      R.pg.style.strokeDashoffset = (1 - go).toFixed(4);
      const P0 = R.mv.__p || (R.mv.__p = el.querySelector('.lk-p')), pt = P0.getPointAtLength(P0.getTotalLength() * sm(2.2, 3.3, tt));
      R.mv.style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
      R.mv.style.opacity = sm(2.1, 2.3, tt) * (1 - sm(3.2, 3.4, tt)) * (1 - off);
      V.forEach(([, , q, usd, dq], i) => { const nq = q + dq * moved; setTx(R['q' + i], fmt(nq, 4) + ' BTC'); setTx(R['u' + i], '$' + fmt(Math.round(usd * nq / q), 0)); });
      R.r0.classList.toggle('act', tt > .5 && tt < 2.6 && off < .5); R.r1.classList.toggle('act', tt > 2.9 && tt < 6.5 && off < .5);
      R.av0.classList.toggle('on', tt > .5 && off < .5); R.av1.classList.toggle('on', tt > 2.9 && off < .5);
      R.lt.style.opacity = .35 + .65 * log; setCk(R.lc, log, 0, t);
    });
  };

  /* Centralized governance: the live Link Admin role editor. Three permission sets are ticked, the role is created once, and the
     panel of connected exchanges applies it to every account at the same moment: no venue-by-venue setup. */
  UI.lkRoles = el => {
    const RO = [['Link Admin', 'Add accounts · Create policies · View', 1], ['Link Account Admin', 'Rename · Approve policies · View', 1], ['Link Transfer', 'Withdraw assets · View balances', 1], ['Link View', 'View balances · Receive addresses', 0]];
    const EX = [['KR', 'Kraken'], ['OK', 'OKX'], ['CB', 'Coinbase Prime'], ['CR', 'crypto.com']];
    const ed = B(0, 0, 360, 330, 'u-p',
      T(24, 34, 'Link Admin', 15, { w: 600, c: 'k' }) + T(336, 34, 'All connected exchanges', 12, { c: 'm', al: 'r' }) + hr(24, 56, 312) +
      RO.map(([n, sub], i) => { const y = 68 + i * 50;
        return B(24, y + 10, 18, 18, 'lk-cb', `<i data-k="cb${i}">${TICKW}</i>`) + T(54, y + 12, n, 13.5, { w: 600, c: 'k' }) + T(54, y + 30, sub, 12, { c: 'm' }); }).join('') +
      B(24, 272, 160, 40, 'cbtn', `<span data-k="b0">Create Role</span><span data-k="b1">${TICKW}Role created</span>`, 'cb'));
    const ex = B(306, 168, 264, 236, 'u-p dk',
      T(22, 28, 'Connected exchanges', 12, { w: 600, c: 'dm' }) + T(242, 28, '0 of 4', 12, { w: 600, c: 'dm', al: 'r', k: 'cnt' }) + HRD(22, 46, 220) +
      EX.map(([a, n], i) => { const y = 56 + i * 44;
        return B(22, y + 6, 30, 30, 'av', a, 'av' + i) + T(62, y + 14, n, 13.5, { w: 600, c: 'wt' }) + T(62, y + 31, 'Waiting', 12, { c: 'dm', k: 'sa' + i }) + T(62, y + 31, 'Role applied', 12, { c: 'lk-bg', k: 'sb' + i }) + CK('c' + i, 220, y + 12, 18); }).join(''));
    mountUI(el, 570, 404, ed + ex, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      RO.forEach((r, i) => { const p = r[2] ? f(.6 + i * .5, .85 + i * .5) : 0, c = R['cb' + i]; c.style.opacity = p; c.style.transform = `scale(${(.6 + .4 * p).toFixed(3)})`; });
      const press = sm(2.5, 2.65, tt) * (1 - sm(2.65, 2.85, tt)); R.cb.style.transform = `scale(${(1 - press * .05).toFixed(3)})`;
      swap(R.b0, R.b1, f(2.8, 3.1));
      let n = 0;
      EX.forEach((_, i) => { const s = 3.2 + i * .12, p = f(s, s + .35); setCk(R['c' + i], p, sm(s - .3, s - .1, tt) * (1 - sm(s + .25, s + .35, tt)) * (1 - off), t); swap(R['sa' + i], R['sb' + i], p); R['av' + i].classList.toggle('on', p > .5); n += p; });
      setTx(R.cnt, `${Math.floor(n + .5)} of 4`);
    });
  };
})();
