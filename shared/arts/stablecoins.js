/* Stablecoins UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / stDvp / lkMove: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on a
   complete still frame (reduced motion draws that frame). Facts come from the live page and its FAQ (USD1 and SoFiUSD; reserves
   in short-term US treasuries, US dollar deposits and cash equivalents, 1:1, at or above the supply in circulation, monthly
   third-party attestations; SoFiUSD issued by SoFi Bank, N.A., 24/7 settlement; banking rails closed on weekends; hold, swap or
   move from qualified custody; user management, policy engine, whitelists, keys offline in cold storage). Amounts are
   illustrations; no reserve totals, rates or yields. Styles: stablecoins.css.
     sc2Attest   USD1 "See Reports": the reserve assets tick one by one, coverage fills to 100%, the monthly attestation shows the
                 reserves at or above the tokens in circulation, and the report reads Attested
     sc2Settle   SoFiUSD: a 250,000.00 SoFiUSD transfer on a Saturday. The bank rails' week is closed for the weekend; SoFiUSD's
                 week is open every day, and the transfer settles
     sc2Pay      "Moving dollars at the speed of the blockchain": 25,000.00 USD1 travels from the sender's wallet to the recipient
                 onchain, and both balances update as it is delivered
     sc2Hold     "Hold, swap, or move stablecoins with ease from BitGo's qualified custody": one custody wallet steps through Hold,
                 Swap (100,000 USD1 to SoFiUSD, one for one) and Move (50,000 SoFiUSD out); the balances and the activity follow
     sc2Secure   "The safest dollars onchain": a 2,000,000.00 USD1 transfer is initiated by a Treasury Operator, collects two
                 Wallet Admin approvals (user management), and the policy engine's rules pass before it reads Approved */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'sc2-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* USD1 reserves: the three reserve asset types tick in turn and coverage fills to 100%; the dark panel is the monthly
     third-party attestation: the reserves bar reaches past the tokens in circulation, and the report reads Attested. */
  UI.sc2Attest = el => {
    const A = ['Short-term US treasuries', 'US dollar deposits', 'Cash equivalents'];
    const card = B(0, 14, 340, 318, 'u-p',
      T(24, 34, 'USD1 reserves', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Reviewing', 'Attested', 24, 21) +
      T(24, 80, 'Backed 1:1', 32, { w: 600, c: 'k' }) + T(24, 108, 'USD-denominated reserve assets', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      A.map((n, i) => { const y = 158 + i * 44; return T(24, y, n, 13.5, { w: 600, c: 'k' }) + CK('c' + i, 290, y - 10, 20) + (i < 2 ? hr(24, y + 22, 292) : ''); }).join('') +
      T(24, 292, 'Coverage', 12, { c: 'm' }) + B(96, 289, 140, 6, 'bar', '<i data-k="barf"></i>') + T(290, 292, '0%', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const att = B(316, 196, 254, 196, 'u-p dk',
      T(22, 28, 'Monthly attestation', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Third party', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      T(22, 70, 'Tokens in circulation', 12.5, { c: 'dm' }) + B(22, 84, 210, 8, 'sc2-tr', '<i data-k="sup"></i>') +
      T(22, 112, 'Reserves', 12.5, { c: 'dm' }) + B(22, 126, 210, 8, 'sc2-tr', '<i class="b" data-k="res"></i>') +
      RESP('rs', 22, 152, 150, 'Reserves ≥ supply'));
    mountUI(el, 570, 410, card + att, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      let n = 0;
      A.forEach((_, i) => { const s0 = .8 + i * .8, p = f(s0, s0 + .4); setCk(R['c' + i], p, wait(s0, s0 + .4), t); n += p; });
      R.barf.style.width = (n / 3 * 100).toFixed(2) + '%'; setTx(R.cnt, Math.round(n / 3 * 100) + '%');
      R.sup.style.width = (92 * f(3.3, 4.1)).toFixed(2) + '%'; R.res.style.width = (100 * f(3.5, 4.4)).toFixed(2) + '%';
      setResp(R, 'rs', f(4.5, 4.9), t); setPill(R.pill, f(5.0, 5.5), 'Reviewing', 'Attested');
    });
  };

  /* SoFiUSD, 24/7: a transfer made on a Saturday. The bank rails' week shows Monday to Friday open and the weekend closed; the
     SoFiUSD week lights all seven days, and the transfer settles on the Saturday. */
  UI.sc2Settle = el => {
    const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], TODAY = 5;
    const days = (y, k, bank) => D.map((d, i) => `<span class="sc2-day${bank && i < 5 ? ' on' : ''}${i === TODAY ? ' td' : ''}" ${k ? `data-k="${k}${i}" ` : ''}style="left:${22 + i * 32}px;top:${y}px">${d}</span>`).join('');
    const card = B(0, 14, 340, 286, 'u-p',
      T(24, 34, 'SoFiUSD transfer', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Sending', 'Settled', 24, 21) +
      T(24, 80, '250,000.00', 32, { w: 600, c: 'k' }) + T(24, 108, 'SoFiUSD · Saturday, 02:14', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      [['From', 'Treasury wallet'], ['To', 'Counterparty wallet'], ['Issuer', 'SoFi Bank, N.A.']].map(([n, v], i) => { const y = 160 + i * 40;
        return T(24, y, n, 12.5, { c: 'm' }) + T(96, y, v, 13, { w: 600, c: 'k' }) + (i < 2 ? hr(24, y + 20, 292) : ''); }).join(''));
    const win = B(296, 196, 274, 200, 'u-p dk',
      T(22, 28, 'Settlement window', 12, { w: 600, c: 'dm' }) + T(252, 28, 'This week', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 230) +
      T(22, 68, 'Bank rails', 12.5, { w: 600, c: 'wt' }) + T(252, 68, 'Closed today', 12, { c: 'dm', al: 'r' }) + days(80, '', true) +
      T(22, 120, 'SoFiUSD', 12.5, { w: 600, c: 'wt' }) + T(252, 120, '24/7/365', 12, { w: 600, c: 'sc2-ok', al: 'r' }) + days(132, 'd', false) +
      RESP('rs', 22, 164, 148, 'Settled on Saturday'));
    mountUI(el, 570, 400, card + win, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      D.forEach((_, i) => R['d' + i].classList.toggle('on', f(.6 + i * .16, .8 + i * .16) > .5));
      setPill(R.pill, f(2.6, 3.1), 'Sending', 'Settled'); setResp(R, 'rs', f(3.0, 3.4), t);
    });
  };

  /* Payments at the speed of the blockchain: the amount leaves the sender's wallet, travels onchain and lands with the recipient;
     both balances update and the payment reads Delivered. */
  UI.sc2Pay = el => {
    const AMT = 25000, S0 = 480000;
    const party = (x, k, role, name, label, val) => B(x, 20, 240, 150, 'u-p',
      T(22, 30, role, 12.5, { w: 600, c: 'm' }) + T(22, 62, name, 15, { w: 600, c: 'k' }) + T(22, 84, 'USD1', 12, { c: 'm' }) + hr(22, 104, 196) +
      T(22, 128, label, 12.5, { c: 'm' }) + T(218, 128, val, 13.5, { w: 600, c: 'k', al: 'r', k: 'b' + k }), 'pp' + k);
    const pay = B(95, 232, 380, 146, 'u-p dk',
      T(22, 28, 'Payment', 12, { w: 600, c: 'dm' }) + T(358, 28, 'Onchain', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 336) +
      T(22, 72, 'Amount', 12.5, { c: 'dm' }) + T(358, 72, '25,000.00 USD1', 13, { w: 600, c: 'wt', al: 'r' }) + HRD(22, 90, 336) +
      T(22, 114, 'Status', 12.5, { c: 'dm' }) + T(330, 114, 'Sending', 12, { c: 'dm', al: 'r', k: 'sa' }) + T(330, 114, 'Delivered', 12, { w: 600, c: 'sc2-ok', al: 'r', k: 'sb' }) + CK('ok', 340, 106, 17));
    const d = 'M120 170V204H450V170';
    const lines = `<svg class="sc2-ln" width="570" height="384" viewBox="0 0 570 384"><path class="bs" d="${d}"/><path class="pg" data-k="pg" pathLength="1" d="${d}"/></svg>`;
    mountUI(el, 570, 384, lines + party(0, 0, 'Sender', 'Payments wallet', 'Balance', fmt(S0)) + party(330, 1, 'Recipient', 'Supplier wallet', 'Received', '0.00') + pay + '<div class="sc2-mv" data-k="mv"><span>25,000.00 USD1</span></div>', (R, t) => {
      if (reduce) t = 5;
      const P = 8, tt = t % P, off = sm(7.2, 7.8, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const go = sm(1.0, 2.3, tt), out = f(.9, 1.2), land = f(2.2, 2.6);
      R.pg.style.strokeDashoffset = (1 - f(1.0, 2.3)).toFixed(4);
      const Pp = R.mv.__p || (R.mv.__p = el.querySelector('.sc2-ln .bs')), pt = Pp.getPointAtLength(Pp.getTotalLength() * go);
      R.mv.style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
      R.mv.style.opacity = sm(.9, 1.1, tt) * (1 - sm(2.2, 2.4, tt)) * (1 - off);
      setTx(R.b0, fmt(S0 - AMT * out)); setTx(R.b1, fmt(AMT * land)); R.b1.style.opacity = .4 + .6 * land;
      R.pp0.classList.toggle('act', tt > .6 && tt < 1.6 && off < .5); R.pp1.classList.toggle('act', tt > 2.0 && tt < 5.5 && off < .5);
      swap(R.sa, R.sb, land); setCk(R.ok, land, sm(1.0, 1.2, tt) * (1 - sm(2.1, 2.2, tt)) * (1 - off), t);
    });
  };

  /* Hold, swap or move from qualified custody: one custody wallet. The mode moves from Hold to Swap (100,000 USD1 to SoFiUSD, one
     for one) and on to Move (50,000 SoFiUSD out to a whitelisted address); balances, total and the activity follow. */
  UI.sc2Hold = el => {
    const A = [['USD1', 'USD1', 'In qualified custody', 400000, -100000, 0], ['SoFiUSD', 'SoFiUSD', 'In qualified custody', 200000, 100000, -50000]];
    const wal = B(0, 10, 360, 300, 'u-p',
      T(24, 34, 'Qualified custody', 12.5, { w: 600, c: 'm' }) + T(336, 34, 'Stablecoin wallet', 12, { c: 'm', al: 'r' }) +
      `<div class="sc2-tabs" style="left:24px;top:52px"><i data-k="tb"></i>${['Hold', 'Swap', 'Move'].map((s, i) => `<span data-k="t${i}">${s}</span>`).join('')}</div>` + hr(24, 100, 312) +
      A.map(([tk, n, sub, q], i) => { const y = 108 + i * 60;
        return B(24, y + 14, 66, 28, 'chip', tk, 'ch' + i) + T(102, y + 21, n, 13.5, { w: 600, c: 'k' }) + T(102, y + 38, sub, 12, { c: 'm' }) + T(336, y + 29, fmt(q), 13.5, { w: 600, c: 'k', al: 'r', k: 'q' + i }); }).join('') +
      hr(24, 236, 312) + T(24, 266, 'Total', 12.5, { c: 'm' }) + T(96, 266, '600,000.00 USD', 15, { w: 600, c: 'k', k: 'tot' }));
    const act = B(300, 232, 260, 156, 'u-p dk',
      T(22, 28, 'Activity', 12, { w: 600, c: 'dm' }) + T(238, 28, 'Today', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 216) +
      [['Swapped', '100,000.00 USD1 to SoFiUSD'], ['Moved', '50,000.00 SoFiUSD out']].map(([n, s], i) => { const y = 72 + i * 44;
        return T(22, y, n, 13, { w: 600, c: 'wt', k: 'an' + i }) + T(22, y + 17, s, 12, { c: 'dm', k: 'as' + i }) + CK('a' + i, 216, y - 1, 18); }).join(''));
    mountUI(el, 560, 392, wal + act, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const toSwap = f(1.0, 1.4), toMove = f(3.4, 3.8), mode = toSwap + toMove;
      R.tb.style.transform = `translateX(${(mode * 100).toFixed(2)}%)`;
      [0, 1, 2].forEach(i => R['t' + i].classList.toggle('sel', Math.round(mode) === i));
      const sw = f(1.6, 2.4), mv = f(4.0, 4.8);
      let tot = 0;
      A.forEach(([, , , q, ds, dm], i) => { const v = q + ds * sw + dm * mv; tot += v; setTx(R['q' + i], fmt(v)); R['ch' + i].classList.toggle('on', (i === 0 && tt > 1.4 && tt < 2.6) || (i === 1 && tt > 1.4 && tt < 5.2 && off < .5)); });
      setTx(R.tot, fmt(tot) + ' USD');
      [[sw, 2.2], [mv, 4.6]].forEach(([p, s], i) => { const a = f(s, s + .4); R['an' + i].style.opacity = R['as' + i].style.opacity = .3 + .7 * a; setCk(R['a' + i], a, 0, t); });
    });
  };

  /* The safest dollars onchain: a large USD1 transfer. User management (a Treasury Operator initiates, two Wallet Admins approve)
     and the policy engine's rules (whitelist, approval threshold, keys offline) all pass, and the transfer reads Approved. */
  UI.sc2Secure = el => {
    const U = [['TO', 'Treasury Operator', 'Initiated the transfer'], ['WA', 'Wallet Admin', 'Approval 1 of 2'], ['WA', 'Wallet Admin', 'Approval 2 of 2']];
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Transfer', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Approved', 24, 21) +
      T(24, 80, '2,000,000.00', 32, { w: 600, c: 'k' }) + T(24, 108, 'USD1 · To a whitelisted address', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      U.map(([a, n, sub], i) => { const y = 140 + i * 52 + 26; return B(25, y - 15, 30, 30, 'av', a, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      T(24, 308, 'Approvals', 12, { c: 'm' }) + B(100, 305, 150, 6, 'bar', '<i data-k="barf"></i>') + T(304, 308, '0 of 2', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const pol = B(316, 180, 254, 212, 'u-p dk',
      T(22, 30, 'Policy engine', 12, { w: 600, c: 'dm' }) + T(232, 30, 'Active', 12, { w: 600, c: 'sc2-ok', al: 'r' }) + HRD(22, 50, 210) +
      [['Whitelist only', 'Address approved'], ['Above 1,000,000 USD1', '2 approvals required'], ['Cold storage', 'Keys held offline']].map(([n, sub], i) => { const y = 60 + i * 48 + 24;
        return T(22, y - 8, n, 13, { w: 600, c: 'wt' }) + T(22, y + 9, sub, 12, { c: 'dm' }) + CK('p' + i, 214, y - 9.5, 19); }).join(''));
    mountUI(el, 570, 410, card + pol, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .9, a - .7, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const s = [f(.6, 1.0), f(3.4, 3.9), f(4.6, 5.1)], pc = [f(1.4, 1.8), f(2.0, 2.4), f(2.6, 3.0)];
      s.forEach((p, i) => { setCk(R['c' + i], p, i ? wait(i === 1 ? 3.4 : 4.6, i === 1 ? 3.9 : 5.1) : 0, t); R['av' + i].classList.toggle('on', p > .5); });
      pc.forEach((p, i) => setCk(R['p' + i], p, 0, t));
      const n = s[1] + s[2]; R.barf.style.width = (n / 2 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(n + .5)} of 2`);
      setPill(R.pill, f(5.5, 6.0), 'Pending', 'Approved');
    });
  };
})();
