/* Mint UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as scSecurity /
   cwSoftware / gmFinancing: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on a complete
   still frame (reduced motion draws that frame). Words come from the live page and its FAQ (mint and redeem in one place, issuers,
   KYB, role-based permissions, address whitelists, policy thresholds, approvals by the issuer and BitGo operators). No issuer or
   stablecoin is named and no rate, fee or settlement time is shown: the amounts are an example (the minted amount matches the deposit, the reserve-backed match the FAQ describes). Styles: mint.css.
     mnMint      "Universal Mint and Redeem": mint and redeem sit side by side in one panel; 1,000,000.00 USD is deposited, the
                 same amount of the stablecoin is minted, and the treasury wallet's two balances move
     mnControls  "Institutional Controls": a 5,000,000.00 mint request passes KYB, role permission, the address whitelist and the
                 policy threshold, then the issuer and a BitGo operator approve it */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'mn-hrd');
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const BTN = (k, x, y, w, h, a, b) => B(x, y, w, h, 'mn-btn', `<span class="l0" data-k="${k}0">${a}</span><span class="l1" data-k="${k}1">${TICKW}${b}</span>`, k);
  const setBtn = (R, k, press, done) => { R[k].style.transform = `scale(${(1 - press * .05).toFixed(3)})`; R[k + '0'].style.opacity = cl(1 - done * 2); R[k + '1'].style.opacity = cl(done * 2 - 1); };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Universal Mint and Redeem: the Mint tab of a mint-and-redeem panel. The deposit is entered, the amount to receive follows one for
     one, Mint is pressed, and on the dark panel the treasury wallet's USD goes down by 1,000,000.00 while its stablecoin goes up by the
     same amount (5,000,000.00 -> 4,000,000.00; 0.00 -> 1,000,000.00). */
  UI.mnMint = el => {
    const fld = (y, lab, k, cur, cw) => B(24, y, 302, 74, 'mn-fld', T(16, 21, lab, 12, { c: 'm' }) + T(16, 50, '0.00', 24, { w: 600, c: 'k', k }) + B(286 - cw, 34, cw, 28, 'mn-cur', cur));
    const card = B(0, 10, 350, 352, 'u-p',
      '<div class="mn-seg" style="left:24px;top:20px;width:176px;height:34px"><span class="sel">Mint</span><span>Redeem</span></div>' +
      fld(70, 'You deposit', 'dep', 'USD', 56) + fld(154, 'You receive', 'rec', 'Stablecoin', 92) +
      B(159, 133, 32, 32, 'mn-sw', '<svg viewBox="0 0 24 24"><path d="M12 5v13M6.5 12.5L12 18l5.5-5.5"/></svg>') +
      T(24, 252, 'Issuer', 12.5, { c: 'm' }) + T(326, 252, 'Issuer A', 12.5, { w: 600, c: 'k', al: 'r' }) + hr(24, 266, 302) +
      T(24, 281, 'Settles to', 12.5, { c: 'm' }) + T(326, 281, 'Treasury wallet', 12.5, { w: 600, c: 'k', al: 'r' }) +
      BTN('btn', 24, 300, 302, 40, 'Mint', 'Minted'));
    const wal = B(340, 228, 254, 166, 'u-p dk',
      T(22, 28, 'Treasury wallet', 12, { w: 600, c: 'dm' }) + HRD(22, 46, 210) +
      T(22, 72, 'USD', 12.5, { w: 600, c: 'wt' }) + T(232, 72, '5,000,000.00', 12.5, { w: 600, c: 'wt', al: 'r', k: 'w0' }) + HRD(22, 89, 210) +
      T(22, 106, 'Stablecoin', 12.5, { w: 600, c: 'wt' }) + T(232, 106, '0.00', 12.5, { w: 600, c: 'wt', al: 'r', k: 'w1' }) +
      RESP('rs', 22, 128, 132, 'Minted to wallet'));
    mountUI(el, 594, 400, card + wal, (R, t) => {
      if (reduce) t = 6;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      setTx(R.dep, fmt(1e6 * f(.3, 1.0))); setTx(R.rec, fmt(1e6 * f(.7, 1.4)));
      const press = sm(1.9, 2.05, tt) * (1 - sm(2.05, 2.25, tt)), done = f(2.25, 2.6); setBtn(R, 'btn', press, done);
      const mv = f(2.6, 3.6); setTx(R.w0, fmt(5e6 - 1e6 * mv)); setTx(R.w1, fmt(1e6 * mv));
      setResp(R, 'rs', f(3.6, 4.0), t);
    });
  };

  /* Institutional Controls: a mint request is checked against the program's controls one by one (KYB, role permission, address
     whitelist, policy threshold), then the issuer and a BitGo operator approve it and it is cleared to mint. */
  UI.mnControls = el => {
    const CHK = [['KYB', 'Entity verified'], ['Role permission', 'Treasury operator'], ['Address whitelist', 'Destination approved'], ['Policy threshold', 'Within the set limit']];
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Mint request', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Approved', 24, 21) +
      T(24, 80, '5,000,000.00', 32, { w: 600, c: 'k' }) + T(24, 108, 'Stablecoin · to Treasury wallet', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      CHK.map(([n, sub], i) => { const y = 156 + i * 44; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20) + (i < 3 ? hr(24, y + 22, 292) : ''); }).join(''));
    const AP = ['Issuer', 'BitGo operator'];
    const apr = B(316, 196, 254, 202, 'u-p dk',
      T(22, 28, 'Approvals', 12, { w: 600, c: 'dm' }) + T(232, 28, '2 required', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      AP.map((n, j) => { const y = 76 + j * 48; return B(22, y - 15, 30, 30, 'mn-av', n[0], 'av' + j) + T(62, y - 8, n, 13, { w: 600, c: 'wt' }) + T(62, y + 9, 'Waiting', 12, { c: 'dm', k: 'wa' + j }) + T(62, y + 9, 'Approved', 12, { w: 600, c: 'mn-ok', k: 'wb' + j }) + CK('a' + j, 214, y - 8, 16) + (j < 1 ? HRD(22, y + 24, 210) : ''); }).join('') +
      RESP('rs', 22, 162, 136, 'Cleared to mint'));
    mountUI(el, 570, 410, card + apr, (R, t) => {
      if (reduce) t = 7;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      CHK.forEach((_, i) => { const a = .6 + i * .55; setCk(R['c' + i], f(a + .35, a + .55), wait(a, a + .35), t); });
      AP.forEach((_, j) => { const s = 3.2 + j * .7, p = f(s + .3, s + .55); setCk(R['a' + j], p, wait(s, s + .3), t); swap(R['wa' + j], R['wb' + j], p); R['av' + j].classList.toggle('on', p > .5 || wait(s, s + .3) > .5); });
      setResp(R, 'rs', f(4.7, 5.1), t); setPill(R.pill, f(4.8, 5.3), 'Pending', 'Approved');
    });
  };
})();
