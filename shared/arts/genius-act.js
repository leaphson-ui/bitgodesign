/* GENIUS Act UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / stSecure / cwHardware: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on
   a complete still frame (reduced motion draws that frame). Every label comes from the live page and its FAQ: the USD1 blueprint
   (secure, compliant, scalable; launch and manage your own stablecoin within weeks) built on qualified custody, smart contracts,
   and banking rails and orchestration. Role labels only, no names, no dates or figures. Styles: genius-act.css.
     gaBlueprint  "Stablecoin-as-a-Service Blueprint": your stablecoin is set up on the USD1 blueprint. Its three foundations tick in
                  turn, the launch bar runs through the weeks, and the stablecoin reads Launched; the dark panel then shows it being
                  managed: secure, compliant, scalable. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const HRD = (x, y, w) => B(x, y, w, 1, 'ga-hrd');

  UI.gaBlueprint = el => {
    const FD = [['Qualified custody', 'Reserves held in custody'], ['Smart contracts', 'Your token, deployed'], ['Banking rails and orchestration', 'US dollars in and out']], S0 = [.8, 1.7, 2.6];
    const plan = B(0, 14, 350, 300, 'u-p',
      T(24, 34, 'Stablecoin launch', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Building', 'Launched', 24, 21) +
      T(24, 80, 'Your stablecoin', 28, { w: 600, c: 'k' }) + T(24, 108, 'On the USD1 blueprint', 12.5, { c: 'm' }) + hr(24, 130, 302) +
      FD.map(([n, sub], i) => { const y = 140 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 300, y - 10, 20); }).join(''));
    const mg = B(326, 250, 254, 206, 'u-p dk',
      T(22, 28, 'Launch', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Within weeks', 12, { w: 600, c: 'wt', al: 'r' }) + HRD(22, 46, 210) +
      B(22, 62, 210, 7, 'ga-bar', '<i data-k="lb"></i>') +
      ['Secure', 'Compliant', 'Scalable'].map((n, j) => { const y = 96 + j * 28; return T(22, y, n, 12.5, { w: 600, c: 'wt', k: 'n' + j }) + CK('k' + j, 216, y - 8, 16); }).join('') +
      HRD(22, 168, 210) + T(22, 188, 'Launch and manage', 12, { c: 'dm' }));
    mountUI(el, 580, 460, plan + mg, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      S0.forEach((s, i) => setCk(R['c' + i], f(s, s + .4), wait(s, s + .4), t));
      R.lb.style.width = (100 * f(.6, 3.4)).toFixed(2) + '%';
      setPill(R.pill, f(3.4, 3.9), 'Building', 'Launched');
      [0, 1, 2].forEach(j => { const p = f(4.0 + j * .35, 4.35 + j * .35); setCk(R['k' + j], p, 0, t); R['n' + j].style.opacity = .4 + .6 * p; });
    });
  };
})();
