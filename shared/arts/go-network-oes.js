/* Off-Exchange Settlement UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, in the
   language of ui-arts.js (cwHsm, gmFinancing): a white product panel over one dark panel, Inter Tight, BitGo blue, a short
   eased loop that ends on a complete still frame. Figures and names come from the live page and its hero card
   (12.5 BTC, allocated to OKX, held in BitGo qualified custody, assets moved: none, settlement offchain
   on Go Network; insurance up to $250M; partners such as OKX and Deribit). Styles: go-network-oes.css.
     oesCustody   "Mitigate risk": the custody account is checked (regulated custody, insured, not rehypothecated) and the
                  exposure panel shows every coin in BitGo custody and none on the exchange
     oesAllocate  "Increase capital efficiency": OKX is picked from the partner list, 12.5 BTC is allocated from custody and
                  mirrored to the OKX trading balance, with no assets moved */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'oes-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };

  /* Mitigate risk: assets stay in BitGo's regulated, bankruptcy-remote custody, in your name. The account's three checks tick in
     turn, the pill settles on Bankruptcy-remote, and the exposure panel fills the custody bar while the exchange bar stays empty. */
  UI.oesCustody = el => {
    const rows = [['Regulated custody', 'Held in BitGo qualified custody'], ['Insured', 'Up to $250M in regulated custody'], ['Not rehypothecated', 'Assets stay in your name']];
    const acct = B(0, 14, 340, 312, 'u-p',
      T(24, 34, 'Custody account', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Checking', 'Bankruptcy-remote', 24, 21) +
      T(24, 80, '12.5 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'Held in your name', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      rows.map(([n, sub], i) => { const y = 140 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join(''));
    const exp = B(316, 186, 254, 204, 'u-p dk',
      T(22, 28, 'Exposure', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Your firm', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      T(22, 70, 'BitGo custody', 12.5, { c: 'dm' }) + T(232, 70, '12.5 BTC', 13.5, { w: 600, c: 'wt', al: 'r' }) + B(22, 84, 210, 6, 'oes-bar', '<i data-k="b0"></i>') +
      T(22, 114, 'On the exchange', 12.5, { c: 'dm' }) + T(232, 114, 'None', 13.5, { w: 600, c: 'wt', al: 'r' }) + B(22, 128, 210, 6, 'oes-bar', '<i></i>') +
      RESP('rs', 22, 160, 204, 'Counterparty risk mitigated'));
    mountUI(el, 570, 410, acct + exp, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const wait = (a, b) => sm(a - .5, a - .3, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      [[1.1, 1.5], [2.0, 2.4], [2.9, 3.3]].forEach(([a, b], i) => setCk(R['c' + i], f(a, b), wait(a, b), t));
      R.b0.style.width = (f(1.0, 3.3) * 100).toFixed(2) + '%';
      setPill(R.pill, f(3.6, 4.1), 'Checking', 'Bankruptcy-remote');
      setResp(R, 'rs', f(4.0, 4.4), t);
    });
  };

  /* Increase capital efficiency: deploy capital to Go Network OES partners as needed. The selection lands on OKX, 12.5 BTC is
     allocated from custody and the OKX trading balance mirrors it a beat later; assets moved reads None, as on the live card. */
  UI.oesAllocate = el => {
    const V = [['O', 'OKX', 'Partner exchange'], ['D', 'Deribit', 'Partner exchange']], AMT = 12.5;
    const alloc = B(0, 10, 350, 262, 'u-p',
      T(24, 34, 'Allocate capital', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Mirroring', 'Allocated', 24, 21) +
      T(24, 80, '0.0 BTC', 32, { w: 600, c: 'k', k: 'amt' }) + T(24, 108, 'From BitGo qualified custody', 12.5, { c: 'm' }) + hr(24, 130, 302) +
      B(12, 140, 326, 50, 'hl', '', 'hl') +
      V.map(([a, n, sub], i) => { const y = 140 + i * 54; return B(26, y + 10, 30, 30, 'av', a, 'av' + i) + T(68, y + 18, n, 13.5, { w: 600, c: 'k' }) + T(68, y + 35, sub, 12, { c: 'm' }) + B(308, y + 17, 16, 16, 'rad', '<i></i>', 'rd' + i); }).join(''));
    const okx = B(306, 206, 264, 200, 'u-p dk',
      T(22, 28, 'OKX', 12, { w: 600, c: 'dm' }) + T(242, 28, 'Trading balance', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 220) +
      T(22, 80, '0.0 BTC', 26, { w: 600, c: 'wt', k: 'mir' }) + T(22, 106, 'Mirrored', 12, { c: 'dm', k: 'ma' }) + T(22, 106, `${TICK} Mirrored from custody`, 12, { w: 600, c: 'oes-ok', k: 'mb' }) + HRD(22, 126, 220) +
      T(22, 150, 'Settlement', 12.5, { c: 'dm' }) + T(242, 150, '<i class="oes-dot"></i>Offchain, Go Network', 12.5, { w: 600, c: 'wt', al: 'r', k: 'st' }) +
      T(22, 176, 'Assets moved', 12.5, { c: 'dm' }) + T(242, 176, 'None', 12.5, { w: 600, c: 'wt', al: 'r' }));
    mountUI(el, 570, 410, alloc + okx, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const pick = f(.5, 1.1), hlpos = 1 - pick;                  // the highlight starts on Deribit and settles on OKX
      R.hl.style.transform = `translateY(${(hlpos * 54).toFixed(2)}px)`; R.hl.style.opacity = sm(.2, .45, tt) * (1 - off);
      R.rd0.firstChild.style.opacity = pick; R.rd0.classList.toggle('on', pick > .02); R.av0.classList.toggle('on', pick > .5);
      const a = f(1.4, 2.9), m = f(1.65, 3.15);
      setTx(R.amt, (AMT * a).toFixed(1) + ' BTC'); setTx(R.mir, (AMT * m).toFixed(1) + ' BTC');
      swap(R.ma, R.mb, f(3.1, 3.5));
      setPill(R.pill, f(3.2, 3.7), 'Mirroring', 'Allocated');
      R.st.style.opacity = .35 + .65 * f(3.5, 3.9);
    });
  };
})();
