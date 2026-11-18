/* Collateral Management UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language
   as scSecurity / scHot / gmCollateral: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends
   on a complete still frame (reduced motion draws that frame). Facts come from the live page and its FAQ. Styles: collateral-management.css.
     cmTriParty     "Tri-Party Collateral Management": both parties sign the account control agreement, the pledgor's 25.00 BTC moves
                    into a tri-party account in BitGo qualified custody (a neutral third party), and the secured party gets control,
                    not the asset.
     cmMonitor      "Collateral Monitoring": each position is valued at market with its haircut, the adjusted value builds and is
                    checked against the agreed requirement. 855,000 + 357,000 + 250,000 = 1,462,000 against 1,200,000 = 121.8%.
     cmLiquidate    "Liquidation Management": an automatic trigger at 85% loan-to-value. The BTC price falls, the trigger is reached,
                    3.50 BTC is sold and the proceeds go to the secured party. 1,000,000 / (14 × 84,000) = 85.0%;
                    3.50 × 84,000 = 294,000; 706,000 / (10.50 × 84,000) = 80.0%.
   Margin Management reuses gmCollateral (ui-arts.js): a margin call and a top-up from custody. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'cm-hrd');
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Tri-party: two party panels over the custody account, joined by a glowing deposit line (the asset) and a dashed control
     line (the secured party's rights, never the asset). */
  UI.cmTriParty = el => {
    const party = (x, k, name, role, l0, v0, v1) => B(x, 0, 250, 158, 'u-p',
      T(22, 30, name, 13.5, { w: 600, c: 'k' }) + T(228, 30, role, 12, { c: 'm', al: 'r' }) + hr(22, 48, 206) +
      T(22, 74, l0, 12.5, { c: 'm' }) + T(228, 74, v0, 13.5, { w: 600, c: 'k', al: 'r', k: 'va' + k }) + T(228, 74, v1, 13.5, { w: 600, c: 'a', al: 'r', k: 'vb' + k }) + hr(22, 92, 206) +
      T(22, 116, 'Account control agreement', 13, { w: 600, c: 'k' }) + T(22, 134, 'Awaiting signature', 12, { c: 'm', k: 'sa' + k }) + T(22, 134, 'Signed', 12, { c: 'a', k: 'sb' + k }) +
      CK('c' + k, 208, 115, 20), 'pp' + k);
    const pl = party(0, 0, 'Pledgor', 'Borrower', 'Collateral', '25.00 BTC', 'Pledged');
    const sp = party(340, 1, 'Secured party', 'Lender', 'Collateral held by', '–', 'BitGo');
    const cus = B(140, 230, 310, 160, 'u-p dk',
      T(22, 28, 'BitGo qualified custody', 12, { w: 600, c: 'dm' }) + `<span class="cm-bd" style="right:16px;top:16px">${LOCK}Neutral third party</span>` + HRD(22, 48, 266) +
      T(22, 84, '0.00 BTC', 28, { w: 600, c: 'wt', k: 'bal' }) + T(22, 110, 'Tri-party account', 12, { c: 'dm' }) +
      RESP('rs', 22, 124, 154, 'Pledged under ACA'));
    const lines = `<svg class="cm-ln" width="590" height="390" viewBox="0 0 590 390">
      <path class="bs" id="cmp1" d="M125 158V194H230V230"/><path class="pg" data-k="pg1" pathLength="1" d="M125 158V194H230V230"/>
      <path class="bs ds" d="M465 158V194H360V230"/><path class="pg" data-k="pg2" pathLength="1" d="M465 158V194H360V230"/></svg>`;
    const labels = T(178, 180, 'Deposit', 12.5, { w: 600, c: 'cm-lb', al: 'c', k: 'dep' }) + T(412, 180, 'Control', 12.5, { w: 600, c: 'cm-lb', al: 'c', k: 'ctl' });
    const mv = '<div class="cm-mv" data-k="mv"><span>25.00 BTC</span></div>';
    mountUI(el, 590, 390, lines + pl + sp + cus + labels + mv, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .5, a - .3, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const s0 = f(.6, 1.1), s1 = f(1.3, 1.8);
      setCk(R.c0, s0, wait(.6, 1.1), t); setCk(R.c1, s1, wait(1.3, 1.8), t); swap(R.sa0, R.sb0, s0); swap(R.sa1, R.sb1, s1);
      R.pp0.classList.toggle('act', tt > .2 && tt < 3.4 && off < .5);
      const mvp = sm(2.0, 3.3, tt), dep = f(2.0, 3.3);
      R.pg1.style.strokeDashoffset = (1 - dep).toFixed(4);
      const P = R.mv.__p || (R.mv.__p = el.querySelector('#cmp1')), pt = P.getPointAtLength(P.getTotalLength() * mvp);
      R.mv.style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
      R.mv.style.opacity = sm(1.9, 2.1, tt) * (1 - sm(3.2, 3.4, tt)) * (1 - off); R.dep.style.opacity = 1 - sm(1.9, 2.1, tt) * (1 - sm(3.0, 3.3, tt)) * (1 - off);   // the label steps aside while the amount passes
      setTx(R.bal, fmt(25 * f(2.9, 3.4)) + ' BTC'); swap(R.va0, R.vb0, f(2.9, 3.4));
      setResp(R, 'rs', f(3.5, 3.9), t);
      const ctl = f(4.0, 4.8); R.pg2.style.strokeDashoffset = (1 - ctl).toFixed(4); R.ctl.style.opacity = .45 + .55 * ctl;
      swap(R.va1, R.vb1, f(4.6, 5.0)); R.pp1.classList.toggle('act', tt > 4.0 && tt < 5.6 && off < .5);
    });
  };

  /* Monitoring: a positions table valued row by row (market value, haircut, collateral value), and the adjusted value checked
     against the agreed requirement on the dark panel. */
  UI.cmMonitor = el => {
    const rows = [['BTC', 'Bitcoin', '10.00 BTC', 950000, 10], ['ETH', 'Ether', '120.00 ETH', 420000, 15], ['USDC', 'USD Coin', '250,000 USDC', 250000, 0]];
    const REQ = 1200000, Y0 = 86, RH = 52, adj = r => r[3] * (1 - r[4] / 100), TOT = rows.reduce((s, r) => s + adj(r), 0);
    const tbl = B(0, 0, 420, 262, 'u-p',
      T(24, 34, 'Collateral positions', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Valuing', 'Sufficient', 24, 21) +
      T(24, 66, 'Asset', 12, { c: 'm' }) + T(236, 66, 'Market value', 12, { c: 'm', al: 'r' }) + T(300, 66, 'Haircut', 12, { c: 'm', al: 'r' }) + T(396, 66, 'Collateral', 12, { c: 'm', al: 'r' }) + hr(24, 80, 372) +
      B(12, Y0 + 4, 396, RH - 6, 'hl', '', 'hl') +
      rows.map(([tk, n, q, mv, h], i) => { const y = Y0 + i * RH;
        return B(24, y + 14, 44, 26, 'chip', tk, 'ch' + i) + T(80, y + 20, n, 13.5, { w: 600, c: 'k' }) + T(80, y + 37, q, 12, { c: 'm' }) +
          T(236, y + 28, fmt(mv, 0), 13, { w: 600, c: 'k', al: 'r' }) + T(300, y + 28, h + '%', 13, { c: 'm', al: 'r' }) +
          T(396, y + 28, '–', 13.5, { w: 600, c: 'k', al: 'r', k: 'v' + i }) + (i < 2 ? hr(24, y + RH, 372) : ''); }).join(''));
    const MAX = 150, mk = 22 + 296 * 100 / MAX;
    const suf = B(250, 236, 340, 168, 'u-p dk',
      T(22, 28, 'Sufficiency', 12, { w: 600, c: 'dm' }) + T(318, 28, 'Agreed requirement', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 296) +
      T(22, 70, 'Adjusted value', 12.5, { c: 'dm' }) + T(318, 70, '0 USD', 13.5, { w: 600, c: 'wt', al: 'r', k: 'av' }) +
      T(22, 96, 'Required', 12.5, { c: 'dm' }) + T(318, 96, fmt(REQ, 0) + ' USD', 13.5, { w: 600, c: 'wt', al: 'r' }) +
      B(22, 118, 296, 8, 'bar cm-dbar', '<i data-k="barf"></i>') + B(mk - 1, 113, 2, 18, 'cm-mk') +
      T(22, 148, 'Coverage', 13.5, { w: 600, c: 'wt' }) + T(318, 148, '0.0%', 13.5, { w: 600, c: 'cm-ok', al: 'r', k: 'cov' }));
    mountUI(el, 590, 404, tbl + suf, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let pos = 0, v = 0;
      rows.forEach((r, i) => {
        const s0 = .7 + i * 1.0, e = f(s0 + .35, s0 + .7);
        if (i) pos += sm(s0 - .3, s0, tt);
        R['ch' + i].classList.toggle('on', e > .5); R['v' + i].style.opacity = e > .02 ? .35 + .65 * e : 1; setTx(R['v' + i], e > .02 ? fmt(adj(r) * e, 0) : '–'); v += adj(r) * e;
      });
      R.hl.style.transform = `translateY(${(pos * RH).toFixed(2)}px)`; R.hl.style.opacity = sm(.3, .6, tt) * (1 - sm(3.5, 3.9, tt)) * (1 - off);
      setTx(R.av, fmt(v, 0) + ' USD');
      const c = v / REQ * 100; setTx(R.cov, c.toFixed(1) + '%'); R.barf.style.width = (cl(c / MAX) * 100).toFixed(2) + '%';
      setPill(R.pill, f(3.9, 4.4), 'Valuing', 'Sufficient');
    });
  };

  /* Liquidation: an automatic trigger is armed at 85% loan-to-value. The price falls, the ratio reaches the trigger, the sale
     executes in custody and the proceeds go to the secured party; the ratio settles at 80.0%. */
  UI.cmLiquidate = el => {
    const LOAN = 1e6, Q0 = 14, P0 = 95000, P1 = 84000, SELL = 3.5, TRG = 85;
    const rule = B(0, 8, 340, 294, 'u-p',
      T(24, 34, 'Liquidation rule', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Armed', 'Executed', 24, 21) +
      `<div class="cm-seg" style="left:24px;top:56px"><span class="sel">Automatic trigger</span><span>Lender discretion</span></div>` +
      T(24, 120, 'Loan-to-value', 13.5, { w: 600, c: 'k' }) + T(304, 120, '75.2%', 13.5, { w: 600, c: 'k', al: 'r', k: 'ltv' }) +
      B(24, 140, 280, 8, 'bar', '<i data-k="barf"></i>') + B(24 + 280 * TRG / 100 - 1, 135, 2, 18, 'cm-mk lt') + T(24 + 280 * TRG / 100, 166, 'Trigger 85%', 12, { c: 'm', al: 'c' }) + hr(24, 184, 292) +
      [['Collateral', 'cq'], ['BTC price', 'px'], ['Loan', 'ln']].map(([n, k], i) => { const y = 208 + i * 32; return T(24, y, n, 12.5, { c: 'm' }) + T(304, y, '', 13.5, { w: 600, c: 'k', al: 'r', k }) + (i < 2 ? hr(24, y + 16, 292) : ''); }).join(''));
    const ex = B(316, 196, 264, 208, 'u-p dk',
      T(22, 28, 'Execution', 12, { w: 600, c: 'dm' }) + T(242, 28, 'Waiting for trigger', 12, { c: 'dm', al: 'r', k: 'ea' }) + T(242, 28, 'Triggered', 12, { w: 600, c: 'cm-ok', al: 'r', k: 'eb' }) + HRD(22, 46, 220) +
      T(22, 70, 'Sell', 12.5, { c: 'dm' }) + T(242, 70, fmt(SELL) + ' BTC', 13.5, { w: 600, c: 'wt', al: 'r' }) +
      T(22, 96, 'Executed', 12.5, { c: 'dm' }) + T(242, 96, '0.00 of 3.50 BTC', 12.5, { w: 600, c: 'wt', al: 'r', k: 'eq' }) + B(22, 112, 220, 6, 'bar cm-dbar', '<i data-k="exf"></i>') +
      T(22, 140, 'Proceeds', 12.5, { c: 'dm' }) + T(242, 140, '0 USDC', 13.5, { w: 600, c: 'wt', al: 'r', k: 'pr' }) +
      RESP('rs', 22, 166, 170, 'Paid to secured party'));
    mountUI(el, 580, 404, rule + ex, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), lerp = (a, b) => a + (b - a) * off;   // the reset eases back, it never replays the drop
      const px = lerp(P0 + (P1 - P0) * sm(.4, 2.6, Math.min(tt, 5)), P0), sold = f(3.0, 4.4), q = Q0 - SELL * sold, loan = LOAN - SELL * P1 * sold;   // each fill's proceeds reduce the loan
      const ltv = loan / (q * px) * 100;
      setTx(R.ltv, ltv.toFixed(1) + '%'); R.barf.style.width = (cl(ltv / 100) * 100).toFixed(2) + '%';
      setTx(R.px, fmt(px) + ' USD'); setTx(R.cq, fmt(q) + ' BTC'); setTx(R.ln, fmt(loan, 0) + ' USDC');
      swap(R.ea, R.eb, f(2.55, 2.85));
      setTx(R.eq, `${fmt(SELL * sold)} of 3.50 BTC`); R.exf.style.width = (sold * 100).toFixed(2) + '%'; setTx(R.pr, fmt(SELL * P1 * sold, 0) + ' USDC');
      setResp(R, 'rs', f(4.4, 4.8), t); setPill(R.pill, f(4.8, 5.3), 'Armed', 'Executed');
    });
  };
})();
