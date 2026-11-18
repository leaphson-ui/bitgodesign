/* Settlement UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / goNetwork / gmFinancing: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends
   on a complete still frame (reduced motion draws that frame). Facts come from the live page and its FAQ; no venues, rates or
   savings the page does not state. Styles: settlement.css.
     stDvp      "Real-time settlement between counterparties": each side's leg is locked in custody, then both legs settle in the
                same instant (100.00 BTC against 9,500,000 USD, 95,000 a coin); if one leg is not ready, nothing moves.
     stSecure   "Security first": the settlement account's protections tick (qualified custody, bankruptcy-remote structure,
                $250M insurance coverage), and the assets stay in custody before, during and after settlement.
     stRisk     "Reduced risk": counterparty, exchange and operational exposure each come down, with the reason from the FAQ.
     stCapital  "Capital efficient": prefunding three venues (10M + 8M + 6M) leaves 6,000,000 of 30,000,000 USDC free; with
                off-exchange settlement the whole 30,000,000 stays in custody and available to allocate. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'st-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Delivery vs. payment: two counterparty panels over the settlement panel. Each leg travels down and is locked (Ready);
     the two legs then settle together, and both sides receive in the same instant. */
  UI.stDvp = el => {
    const party = (x, k, name, role, give, get) => B(x, 0, 250, 140, 'u-p',
      T(22, 30, name, 13.5, { w: 600, c: 'k' }) + T(228, 30, role, 12, { c: 'm', al: 'r' }) + hr(22, 48, 206) +
      T(22, 74, 'Delivers', 12.5, { c: 'm' }) + T(228, 74, give, 13.5, { w: 600, c: 'k', al: 'r' }) + hr(22, 92, 206) +
      T(22, 116, 'Receives', 12.5, { c: 'm' }) + T(194, 116, get, 13.5, { w: 600, c: 'k', al: 'r', k: 'g' + k }) + CK('r' + k, 208, 106, 20), 'pp' + k);
    const A = party(0, 0, 'Counterparty A', 'Seller', '100.00 BTC', '9,500,000 USD'), Bp = party(340, 1, 'Counterparty B', 'Buyer', '9,500,000 USD', '100.00 BTC');
    const set = B(120, 200, 350, 168, 'u-p dk',
      T(22, 28, 'Go Network settlement', 12, { w: 600, c: 'dm' }) + T(328, 28, 'Delivery vs. payment', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 306) +
      [['BTC leg', '100.00 BTC'], ['USD leg', '9,500,000 USD']].map(([n, v], i) => { const y = 70 + i * 30;
        return T(22, y, n, 12.5, { w: 600, c: 'wt' }) + T(130, y, v, 12.5, { c: 'dm' }) + T(296, y, 'Waiting', 12, { c: 'dm', al: 'r', k: 'la' + i }) + T(296, y, 'Locked', 12, { w: 600, c: 'st-ok', al: 'r', k: 'lb' + i }) + CK('l' + i, 306, y - 8, 16); }).join('') +
      HRD(22, 118, 306) + RESP('rs', 22, 132, 160, 'Both legs settled') + T(328, 143, '0.0s', 12.5, { w: 600, c: 'wt', al: 'r', k: 'tm' }));
    const lines = `<svg class="st-ln" width="590" height="368" viewBox="0 0 590 368">${['M125 140V170H215V200', 'M465 140V170H375V200'].map((d, i) => `<path class="bs" id="stp${i}" d="${d}"/><path class="pg" data-k="pg${i}" pathLength="1" d="${d}"/>`).join('')}</svg>`;
    const mv = ['100.00 BTC', '9,500,000 USD'].map((s, i) => `<div class="st-mv" data-k="mv${i}"><span>${s}</span></div>`).join('');
    mountUI(el, 590, 368, lines + A + Bp + set + mv, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      [0, 1].forEach(i => {
        const s0 = .5 + i * .5, go = sm(s0, s0 + 1, tt), lk = f(s0 + .95, s0 + 1.25);
        R['pg' + i].style.strokeDashoffset = (1 - f(s0, s0 + 1)).toFixed(4);
        const P = R['mv' + i].__p || (R['mv' + i].__p = el.querySelector('#stp' + i)), pt = P.getPointAtLength(P.getTotalLength() * go);
        R['mv' + i].style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
        R['mv' + i].style.opacity = sm(s0 - .1, s0 + .1, tt) * (1 - sm(s0 + .9, s0 + 1.1, tt)) * (1 - off);
        swap(R['la' + i], R['lb' + i], lk); R['pp' + i].classList.toggle('act', tt > s0 - .2 && tt < s0 + 1.1 && off < .5);
      });
      const both = f(2.5, 2.9), wt = sm(2.0, 2.2, tt) * (1 - sm(2.45, 2.55, tt)) * (1 - off);   // one instant for both legs
      setCk(R.l0, both, wt, t); setCk(R.l1, both, wt, t);
      const rcv = f(2.9, 3.3); setCk(R.r0, rcv, 0, t); setCk(R.r1, rcv, 0, t); R.g0.style.opacity = R.g1.style.opacity = .35 + .65 * rcv;
      setTx(R.tm, (1.8 * f(.5, 2.9)).toFixed(1) + 's'); setResp(R, 'rs', f(3.0, 3.4), t);
    });
  };

  /* Security first: the account's protections tick one by one and the account reads Safeguarded; the dark panel shows the assets
     in custody before, during and after the settlement. */
  UI.stSecure = el => {
    const acct = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Settlement account', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Checking', 'Safeguarded', 24, 21) +
      T(24, 80, '250.00 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'Held in BitGo qualified custody', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      [['Qualified custody', 'Regulated custodian'], ['Bankruptcy-remote', 'Structure in place'], ['Insurance', '$250M coverage']].map(([n, sub], i) => { const y = 140 + i * 52 + 26;
        return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join(''));
    const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
    const dur = B(316, 196, 254, 200, 'u-p dk',
      T(22, 28, 'Through settlement', 12, { w: 600, c: 'dm' }) + T(232, 28, '250.00 BTC', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      ['Before', 'During', 'After'].map((n, j) => { const y = 70 + j * 30; return T(22, y, n, 12.5, { c: 'dm' }) + `<span class="st-lk" data-k="k${j}" style="left:${120}px;top:${y - 11}px">${LOCK}In custody</span>`; }).join('') +
      RESP('rs', 22, 162, 156, 'Remained in custody'));
    mountUI(el, 570, 410, acct + dur, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      [0, 1, 2].forEach(i => { const s0 = .8 + i * .9; setCk(R['c' + i], f(s0, s0 + .4), wait(s0, s0 + .4), t); });
      setPill(R.pill, f(3.6, 4.1), 'Checking', 'Safeguarded');
      [0, 1, 2].forEach(j => { const a = f(4.0 + j * .35, 4.3 + j * .35); R['k' + j].style.opacity = .3 + .7 * a; R['k' + j].style.transform = `translateX(${((1 - a) * -6).toFixed(2)}px)`; });
      setResp(R, 'rs', f(5.1, 5.5), t);
    });
  };

  /* Reduced risk: three layers of exposure, each meter coming down in turn with the reason beside it (from the FAQ); the dark
     panel counts the layers covered. */
  UI.stRisk = el => {
    const L = [['Counterparty', 'Both legs settle, or neither'], ['Exchange', 'Assets stay in custody'], ['Operational', 'Records for reconciliation']], Y0 = 136, RH = 54;
    const risk = B(0, 10, 380, 300, 'u-p',
      T(24, 34, 'Settlement risk', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Assessing', 'Mitigated', 24, 21) +
      T(24, 78, 'Every layer', 24, { w: 600, c: 'k' }) + T(24, 104, 'Go Network settlement', 12.5, { c: 'm' }) + hr(24, 124, 332) +
      L.map(([n, sub], i) => { const y = Y0 + i * RH;
        return T(24, y + 18, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 35, sub, 12, { c: 'm' }) + B(224, y + 23, 72, 6, 'bar st-rb', `<i data-k="m${i}"></i>`) +
          T(356, y + 26, 'Exposed', 12, { w: 600, c: 'm', al: 'r', k: 'ea' + i }) + T(356, y + 26, 'Reduced', 12, { w: 600, c: 'a', al: 'r', k: 'eb' + i }) + (i < 2 ? hr(24, y + RH - 2, 332) : ''); }).join(''));
    const cov = B(260, 292, 300, 130, 'u-p dk',
      T(22, 28, 'Layers covered', 12, { w: 600, c: 'dm' }) + T(278, 28, '0 of 3', 12, { w: 600, c: 'wt', al: 'r', k: 'cnt' }) + HRD(22, 46, 256) +
      [0, 1, 2].map(i => B(22 + i * 88, 62, 80, 6, 'st-seg3', `<i data-k="s${i}"></i>`)).join('') +
      RESP('rs', 22, 88, 132, 'Risk mitigated'));
    mountUI(el, 560, 422, risk + cov, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let n = 0;
      L.forEach((_, i) => { const s0 = .8 + i * 1.0, p = f(s0, s0 + .7); R['m' + i].style.width = (100 - 78 * p).toFixed(2) + '%'; swap(R['ea' + i], R['eb' + i], f(s0 + .4, s0 + .8)); R['s' + i].style.width = (f(s0 + .4, s0 + .8) * 100).toFixed(2) + '%'; n += f(s0 + .4, s0 + .8); });
      setTx(R.cnt, `${Math.floor(n + .5)} of 3`); setPill(R.pill, f(4.0, 4.5), 'Assessing', 'Mitigated'); setResp(R, 'rs', f(4.3, 4.7), t);
    });
  };

  /* Capital efficient: the allocation switches from prefunded venues to off-exchange settlement. The venue segments fold back
     into custody and the capital available to allocate grows from 6,000,000 to the full 30,000,000 USDC. */
  UI.stCapital = el => {
    const V = [['Venue 1', 10e6], ['Venue 2', 8e6], ['Venue 3', 6e6]], TOT = 30e6, C0 = TOT - V.reduce((s, v) => s + v[1], 0), W = 280;
    const alloc = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Capital allocation', 12.5, { w: 600, c: 'm' }) + T(316, 34, '30,000,000 USDC', 12, { c: 'm', al: 'r' }) +
      `<div class="st-tabs" style="left:24px;top:52px"><i data-k="tb"></i><span data-k="t0">Prefunded</span><span data-k="t1">Off-exchange</span></div>` +
      T(24, 112, 'Available to allocate', 12.5, { c: 'm' }) + T(304, 112, fmt(C0, 0) + ' USDC', 15, { w: 600, c: 'k', al: 'r', k: 'av' }) +
      `<div class="st-stack" style="left:24px;top:132px;width:${W}px;height:14px">${V.map((_, i) => `<i class="v${i}" data-k="sg${i}"></i>`).join('')}<i class="cu" data-k="sgc"></i></div>` + hr(24, 166, 292) +
      V.map(([n, v], i) => { const y = 190 + i * 28; return `<i class="st-sw v${i}" style="left:24px;top:${y - 4}px"></i>` + T(40, y, n, 12.5, { c: 'm' }) + T(304, y, fmt(v, 0) + ' USDC', 13, { w: 600, c: 'k', al: 'r', k: 'va' + i }) + T(304, y, 'Settled off-exchange', 12.5, { w: 600, c: 'a', al: 'r', k: 'vb' + i }); }).join('') +
      `<i class="st-sw cu" style="left:24px;top:${274 - 4}px"></i>` + T(40, 274, 'In custody', 12.5, { c: 'm' }) + T(304, 274, fmt(C0, 0) + ' USDC', 13, { w: 600, c: 'k', al: 'r', k: 'cu' }));
    const net = B(316, 220, 254, 180, 'u-p dk',
      T(22, 28, 'Off-exchange settlement', 12, { w: 600, c: 'dm' }) + HRD(22, 46, 210) +
      T(22, 70, 'Held in custody', 12.5, { c: 'dm' }) + T(232, 70, '–', 13, { w: 600, c: 'wt', al: 'r', k: 'hc' }) +
      T(22, 98, 'Prefunded at venues', 12.5, { c: 'dm' }) + T(232, 98, '–', 13, { w: 600, c: 'wt', al: 'r', k: 'pf' }) + HRD(22, 116, 210) +
      RESP('rs', 22, 134, 124, 'No prefunding'));
    mountUI(el, 570, 410, alloc + net, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const sw = f(1.2, 1.7);
      R.tb.style.transform = `translateX(${(sw * 100).toFixed(2)}%)`; R.t0.classList.toggle('sel', sw < .5); R.t1.classList.toggle('sel', sw >= .5);
      let pre = 0;
      V.forEach(([, v], i) => { const p = f(1.7 + i * .35, 2.5 + i * .35), rem = v * (1 - p); pre += rem; R['sg' + i].style.width = (rem / TOT * W).toFixed(2) + 'px'; swap(R['va' + i], R['vb' + i], p); });
      const cu = TOT - pre; R.sgc.style.width = (cu / TOT * W).toFixed(2) + 'px';
      setTx(R.av, fmt(cu, 0) + ' USDC'); setTx(R.cu, fmt(cu, 0) + ' USDC');
      const dn = f(3.3, 3.7); setTx(R.hc, dn > .02 ? fmt(TOT, 0) : '–'); setTx(R.pf, dn > .02 ? '0' : '–'); R.hc.style.opacity = R.pf.style.opacity = .4 + .6 * dn;
      setResp(R, 'rs', f(3.7, 4.1), t);
    });
  };
})();
