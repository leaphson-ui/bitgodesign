/* Stablecoin-as-a-Service UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language
   as scSecurity / stSecure / sc2Attest: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends
   on a complete still frame (reduced motion draws that frame). Facts come from the live page and its FAQ (reserves allocated to
   permitted investments, automated rebalancing, daily reconciliation, proof of reserve, attestations by accounting firms; bespoke
   smart contracts, third-party auditors, cross-chain issuance; reserves in short-term US treasuries, US dollar deposits and cash
   equivalents). No reserve totals, rates or yields: the allocation is shown against its target, without figures. No chain is named
   (the page names none): Chain A, B and C stand for the popular blockchains. Styles: stablecoin-as-a-service.css.
     saasReserve  "BitGo Securely Manages the Assets Backing Your Stablecoin": the reserve allocation drifts off target and automated
                  rebalancing brings each permitted investment back to its target; the daily reconciliation then ticks reserve
                  balances, token supply and proof of reserve
     saasDeploy   "Deploy Bespoke Smart Contracts on the Most Popular Blockchains": the contract's functions pass a third-party audit,
                  then cross-chain issuance deploys it to three chains in turn (Chain A, B, C) */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'saas-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };

  /* Reserve management: three permitted investments, each bar with its target notch. The bars sit off target, automated
     rebalancing moves each to its notch in turn and the allocation reads Balanced; the dark panel's daily reconciliation follows. */
  UI.saasReserve = el => {
    const A = [['Short-term US treasuries', .58, .7], ['US dollar deposits', .34, .22], ['Cash equivalents', .08, .08]], BW = 270;
    const card = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Reserve allocation', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Rebalancing', 'Balanced', 24, 21) +
      T(24, 78, 'Permitted investments', 22, { w: 600, c: 'k' }) + T(24, 104, 'Rebalanced automatically to target', 12.5, { c: 'm' }) + hr(24, 124, 292) +
      A.map(([n, , tg], i) => { const y = 150 + i * 52;
        return T(24, y, n, 13.5, { w: 600, c: 'k' }) + T(294, y, 'Off target', 12, { c: 'm', al: 'r', k: 'oa' + i }) + T(294, y, 'On target', 12, { w: 600, c: 'a', al: 'r', k: 'ob' + i }) +
          B(24, y + 16, BW, 6, 'bar', `<i data-k="b${i}"></i>`) + `<i class="saas-tg" style="left:${(24 + BW * tg - 1).toFixed(1)}px;top:${y + 12}px"></i>`; }).join(''));
    const rec = B(316, 196, 254, 200, 'u-p dk',
      T(22, 28, 'Daily reconciliation', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Today', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      [['Reserve balances', 'Matched'], ['Token supply', 'Matched'], ['Proof of reserve', 'Available']].map(([n, v], i) => { const y = 72 + i * 30;
        return T(22, y, n, 12.5, { w: 600, c: 'wt' }) + T(196, y, v, 12, { c: 'saas-ok', al: 'r', k: 'v' + i }) + CK('r' + i, 214, y - 8, 16); }).join('') +
      RESP('rs', 22, 160, 112, 'Reconciled'));
    mountUI(el, 570, 410, card + rec, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      A.forEach(([, a, tg], i) => { const s0 = .8 + i * .5, p = i === 2 ? 1 : f(s0, s0 + .8); R['b' + i].style.width = ((a + (tg - a) * p) * 100).toFixed(2) + '%'; swap(R['oa' + i], R['ob' + i], i === 2 ? f(1.8, 2.1) : f(s0 + .6, s0 + .9)); });
      setPill(R.pill, f(2.4, 2.9), 'Rebalancing', 'Balanced');
      [0, 1, 2].forEach(i => { const p = f(3.2 + i * .45, 3.55 + i * .45); setCk(R['r' + i], p, 0, t); R['v' + i].style.opacity = p; });
      setResp(R, 'rs', f(4.7, 5.1), t);
    });
  };

  /* Smart contracts: the stablecoin's contract functions are reviewed one by one in a third-party audit (Audited), then
     cross-chain issuance deploys the contract to three chains in turn. */
  UI.saasDeploy = el => {
    const F = [['mint()', 'Issue against verified funds'], ['burn()', 'Remove on redemption'], ['setRoles()', 'Role-based permissions']], C = [['A', 'Chain A'], ['B', 'Chain B'], ['C', 'Chain C']];
    const card = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Smart contract', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'In audit', 'Audited', 24, 21) +
      T(24, 78, 'Your stablecoin', 22, { w: 600, c: 'k' }) + T(24, 104, 'Bespoke contract · Third-party audit', 12.5, { c: 'm' }) + hr(24, 124, 292) +
      F.map(([n, sub], i) => { const y = 134 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k mono' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20) + (i < 2 ? hr(24, y + 25, 292) : ''); }).join(''));
    const dep = B(316, 168, 254, 224, 'u-p dk',
      T(22, 28, 'Cross-chain issuance', 12, { w: 600, c: 'dm' }) + T(232, 28, '0 of 3', 12, { w: 600, c: 'dm', al: 'r', k: 'cnt' }) + HRD(22, 46, 210) +
      C.map(([a, n], i) => { const y = 56 + i * 44;
        return B(22, y + 6, 30, 30, 'av', a, 'av' + i) + T(62, y + 14, n, 13.5, { w: 600, c: 'wt' }) + T(62, y + 31, 'Waiting', 12, { c: 'dm', k: 'sa' + i }) + T(62, y + 31, 'Deployed', 12, { c: 'saas-ok', k: 'sb' + i }) + CK('d' + i, 214, y + 12, 18); }).join('') +
      RESP('rs', 22, 190, 130, 'Issued cross-chain'));
    mountUI(el, 570, 410, card + dep, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .5, a - .3, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      F.forEach((_, i) => { const s0 = .7 + i * .6; setCk(R['c' + i], f(s0, s0 + .4), wait(s0, s0 + .4), t); });
      setPill(R.pill, f(2.5, 3.0), 'In audit', 'Audited');
      let n = 0;
      C.forEach((_, i) => { const s0 = 3.3 + i * .55, p = f(s0, s0 + .4); setCk(R['d' + i], p, wait(s0, s0 + .4), t); swap(R['sa' + i], R['sb' + i], p); R['av' + i].classList.toggle('on', p > .5); n += p; });
      setTx(R.cnt, `${Math.floor(n + .5)} of 3`); setResp(R, 'rs', f(5.2, 5.6), t);
    });
  };
})();
