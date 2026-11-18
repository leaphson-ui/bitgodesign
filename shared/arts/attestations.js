/* Stablecoin Reserves UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / stSecure / cwHardware: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on
   a complete still frame (reduced motion draws that frame). Every label comes from the live page: backed 1:1 by US dollars, 100%
   backed by short-term US government treasuries, US dollar deposits and other cash equivalents, monthly attestation reporting by
   third-party accounting firms under the AICPA criteria. No reserve totals, no dates, no firm names. Styles: attestations.css.
     atReport   "USD1 · See Reports": a monthly attestation report. Each reserve asset class is checked in turn, the report reads Attested,
                and on the dark panel the tokens and reserves bars are counted together, always equal: backed 1:1, 100% backed. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'at-hrd');

  /* USD1's attestation report: the reserve asset classes from the live page tick one by one (treasuries, deposits, cash
     equivalents), the report reads Attested; on the dark panel tokens and reserves are counted together, always equal (1:1), and
     the backing reads 100% backed. */
  UI.atReport = el => {
    const RS = [['Short-term US government treasuries', 'Reserve asset'], ['US dollar deposits', 'Reserve asset'], ['Other cash equivalents', 'Reserve asset']], S0 = [.9, 1.8, 2.7];
    const rep = B(0, 14, 350, 314, 'u-p',
      T(24, 34, 'Attestation report', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Reviewing', 'Attested', 24, 21) +
      T(24, 80, 'USD1', 32, { w: 600, c: 'k' }) + T(24, 108, 'Monthly · third-party accounting firm', 12.5, { c: 'm' }) + hr(24, 130, 302) +
      RS.map(([n, sub], i) => { const y = 140 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 300, y - 10, 20); }).join('') +
      T(24, 296, 'AICPA criteria for stablecoin reporting', 12, { c: 'm' }));
    const bk = B(326, 300, 254, 176, 'u-p dk',
      T(22, 28, 'Backing', 12, { w: 600, c: 'dm' }) + T(232, 28, '1:1', 13, { w: 600, c: 'wt', al: 'r' }) + HRD(22, 46, 210) +
      T(22, 70, 'Tokens', 12.5, { c: 'dm' }) + B(100, 66, 132, 7, 'at-bar tk', '<i data-k="tf"></i>') +
      T(22, 98, 'Reserves', 12.5, { c: 'dm' }) + B(100, 94, 132, 7, 'at-bar', '<i data-k="rf"></i>') +
      HRD(22, 118, 210) + RESP('rs', 22, 134, 118, '100% backed'));
    mountUI(el, 580, 478, rep + bk, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      let n = 0;
      S0.forEach((s, i) => { const p = f(s, s + .4); setCk(R['c' + i], p, wait(s, s + .4), t); n += p; });
      R.tf.style.width = R.rf.style.width = (100 * n / 3).toFixed(2) + '%';   // counted together: the two bars are always equal (1:1)
      setPill(R.pill, f(3.5, 4.0), 'Reviewing', 'Attested'); setResp(R, 'rs', f(3.6, 4.0), t);
    });
  };
})();
