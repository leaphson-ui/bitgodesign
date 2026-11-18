/* Delivery vs. Payment UI art (status: review). Registered into the shared UI registry through Modules.uiKit, in the language
   of ui-arts.js (cwHsm, gmFinancing): a white product panel over one dark panel, Inter Tight, BitGo blue, a short eased loop
   that ends on a complete still frame. Figures and names are the live hero card's (Delivery vs. payment, Go Network ·
   asset leg 12.5 BTC, cash leg 1,018,900.00 USD, Settled); the steps follow the live FAQ (both legs stay in
   qualified custody, settle only once both are confirmed, and release together; each settlement leaves a record).
   Styles: go-network-dvp.css.
     dvpSettle   "Designed for Operational Excellence": the asset leg and the cash leg are each locked in custody, and once both
                 are confirmed they release at the same moment; the settlement record fills in */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const HRD = (x, y, w) => B(x, y, w, 1, 'dvp-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };

  UI.dvpSettle = el => {
    const L = [['BTC', 'Asset leg', '12.5 BTC', 'Awaiting delivery'], ['USD', 'Cash leg', '1,018,900.00 USD', 'Awaiting payment']];
    const card = B(0, 0, 360, 330, 'u-p',
      T(24, 34, 'Delivery vs. payment', 14, { w: 600, c: 'k' }) + T(24, 54, '<i class="dvp-dot"></i>Go Network · Your firm', 12, { c: 'm' }) +
      PILL('pill', 'Matching', 'Settled', 22, 24) + hr(24, 76, 312) +
      L.map(([tk, n, v, wait], i) => B(16, 90 + i * 66, 328, 56, 'dvp-leg',
        B(12, 14, 44, 28, 'chip', tk, 'tk' + i) + T(68, 20, n, 12, { c: 'm' }) + T(68, 38, wait, 12, { c: 'm', k: 'wa' + i }) + T(68, 38, `${TICK} Locked in custody`, 12, { w: 600, c: 'a', k: 'wb' + i }) +
        T(284, 20, v, 14.5, { w: 600, c: 'k', al: 'r' }) + CK('c' + i, 294, 18, 20), 'lg' + i)).join('') +
      T(24, 246, 'Both legs', 12, { c: 'm' }) + B(92, 243, 136, 6, 'bar', '<i data-k="barf"></i>') + T(290, 246, '0 of 2', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }) +
      hr(24, 268, 266) + T(24, 294, 'Release', 12.5, { c: 'm' }) + T(290, 294, 'Both legs together', 13.5, { w: 600, c: 'k', al: 'r', k: 'rel' }));
    const rec = B(330, 262, 260, 168, 'u-p dk',
      T(22, 28, 'Settlement record', 12, { w: 600, c: 'dm' }) + T(238, 28, 'Go Network', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 216) +
      [['Asset leg', '12.5 BTC', 'wt'], ['Cash leg', '1,018,900.00 USD', 'wt'], ['Status', `${TICK} Settled`, 'dvp-ok']].map(([n, v, c], j) => { const y = 72 + j * 30; return T(22, y, n, 12.5, { c: 'dm', k: 'rn' + j }) + T(238, y, v, 13, { w: 600, c, al: 'r', k: 'rv' + j }) + (j < 2 ? HRD(22, y + 15, 216) : ''); }).join(''));
    mountUI(el, 590, 430, card + rec, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const wait = (a, b) => sm(a - .7, a - .5, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const lk = [f(1.3, 1.7), f(2.4, 2.8)], rel = f(3.1, 3.5);
      lk.forEach((p, i) => {
        setCk(R['c' + i], p, wait(1.3 + i * 1.1, 1.7 + i * 1.1), t); swap(R['wa' + i], R['wb' + i], p);
        R['tk' + i].classList.toggle('on', p > .5);
        R['lg' + i].classList.toggle('act', (tt > .5 + i * 1.1 && tt < 1.8 + i * 1.1 || rel > .05 && rel < .95) && off < .5);
      });
      const cnt = lk[0] + lk[1]; R.barf.style.width = (cnt / 2 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(cnt + .5)} of 2`);
      setPill(R.pill, rel, 'Matching', 'Settled'); R.rel.style.opacity = .3 + .7 * rel;
      [0, 1, 2].forEach(j => { const a = f(3.6 + j * .3, 4.0 + j * .3); R['rn' + j].style.opacity = R['rv' + j].style.opacity = .25 + .75 * a; });
    });
  };
})();
