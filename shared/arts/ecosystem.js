/* Ecosystem UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / cwHardware / cwSoftware and the staking arts: white product panels, one dark panel, Inter Tight, BitGo blue, a short
   eased loop that ends on a complete still frame (reduced motion draws that frame). Terms come from the live Ecosystem cards and
   the Token Management and Asset Listings pages they link to (grant, cliff, vesting, unlocking, cold storage wallets; technical and
   risk reviews, ERC-20). No exchange is named and no rate is shown: the amounts are an example grant. Styles: ecosystem.css.
     ecVesting   "Vesting management": a grant's vesting schedule runs to its cliff, the cliff unlock is distributed to each
                 stakeholder group's cold storage wallet, and the schedule runs on to fully vested
     ecListings  "Asset listings": an asset's listing request passes its reviews and is activated on BitGo, then the listing switches
                 on with each exchange partner in turn */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'ec-hrd');
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };

  /* Vesting management: one grant, 2,400,000 tokens over 24 months, a 6-month cliff, then quarterly unlocks. The schedule line
     draws to the cliff; the cliff unlock (25%) goes out to investors and employees, each into a cold storage wallet; the line
     runs on to fully vested. */
  UI.ecVesting = el => {
    const CW = 256, CH = 100, M = 24, X = m => m / M * CW, V = m => m < 6 ? 0 : Math.min(M, 6 + Math.floor((m - 6) / 3) * 3) / M, Y = v => 4 + (1 - v) * (CH - 8);
    const path = mEnd => { let d = `M0 ${Y(0)}`, v0 = 0; for (const s of [6, 9, 12, 15, 18, 21, 24]) { if (s > mEnd) break; const v = V(s); d += `H${X(s).toFixed(2)}V${Y(v).toFixed(2)}`; v0 = v; } return d + `H${X(mEnd).toFixed(2)}`; };
    const area = mEnd => path(mEnd) + `V${Y(0)}H0Z`;
    const chart = `<svg class="ecv-ch" style="left:24px;top:140px" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><path class="ecv-bs" d="M0 ${Y(0)}H${CW}"/><path class="ecv-pl" d="${path(M)}"/><path class="ecv-ar" data-k="ar" d=""/><path class="ecv-ln" data-k="ln" d=""/><circle class="ecv-hd" data-k="hd" r="5" cx="0" cy="${Y(0)}"/></svg>`;
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Vesting schedule', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Vesting', 'Fully vested', 24, 21) +
      T(24, 80, '2,400,000', 32, { w: 600, c: 'k' }) + T(24, 108, 'Cliff 6 months · quarterly unlocks', 12.5, { c: 'm' }) + hr(24, 130, 292) + chart +
      T(24 + X(6), 254, 'Cliff', 11.5, { w: 600, c: 'm', al: 'c' }) + T(280, 254, '24 months', 11.5, { c: 'm', al: 'r' }) +
      T(24, 300, 'Vested', 12, { c: 'm' }) + B(80, 297, 140, 6, 'bar', '<i data-k="barf"></i>') + T(280, 300, '0%', 12, { w: 600, c: 'k', al: 'r', k: 'pc' }));
    const G = [['Investors', '360,000'], ['Employees', '240,000']];   // the live pages' stakeholders: "your investors and employees"
    const dist = B(316, 172, 254, 226, 'u-p dk',
      T(22, 28, 'Cliff unlock', 12, { w: 600, c: 'dm' }) + `<span class="ec-ch" style="right:16px;top:15px">${LOCK}Cold storage</span>` + HRD(22, 46, 210) +
      G.map(([n, a], j) => { const y = 80 + j * 50; return T(22, y - 7, n, 13, { w: 600, c: 'wt', k: 'gn' + j }) + T(22, y + 10, 'Cold storage wallet', 11.5, { c: 'dm' }) + T(196, y, a, 12.5, { w: 600, c: 'wt', al: 'r', k: 'ga' + j }) + CK('c' + j, 214, y - 8, 16) + (j < 1 ? HRD(22, y + 25, 210) : ''); }).join('') +
      RESP('rs', 22, 190, 178, 'Distributed on schedule'));
    mountUI(el, 570, 410, card + dist, (R, t) => {
      if (reduce) t = 8.6;
      const P = 11, tt = t % P, off = sm(9.8, 10.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const m = Math.min(M, (6 * sm(.5, 2.0, tt) + 18 * sm(4.4, 7.6, tt)) * (1 - off)), v = V(m), key = m.toFixed(3) + '|' + v;   // v in the key: the step at each unlock redraws even when m only moves by a hair
      if (R.__m !== key) { R.__m = key; R.ln.setAttribute('d', path(m)); R.ar.setAttribute('d', area(m)); R.hd.setAttribute('cx', X(m).toFixed(2)); R.hd.setAttribute('cy', Y(v).toFixed(2)); }
      R.barf.style.width = (v * 100).toFixed(2) + '%'; setTx(R.pc, Math.round(v * 100) + '%');
      let n = 0;
      G.forEach((_, j) => { const a = 2.3 + j * .7, p = f(a + .3, a + .6); setCk(R['c' + j], p, wait(a, a + .3), t); R['ga' + j].style.opacity = .4 + .6 * p; R['gn' + j].style.opacity = .55 + .45 * Math.max(p, wait(a, a + .3)); n += p; });
      setResp(R, 'rs', f(4.0, 4.4), t);
      setPill(R.pill, f(7.7, 8.2), 'Vesting', 'Fully vested');
    });
  };

  /* Asset listings: a listing request for an ERC-20 asset passes technical review and risk review and is activated on BitGo;
     then the listing switches on with each exchange partner in turn. */
  UI.ecListings = el => {
    const ST = ['Technical review', 'Risk review', 'Activated on BitGo'];
    const req = B(0, 8, 330, 222, 'u-p',
      T(22, 30, 'Listing request', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'In review', 'Listed', 22, 17) +
      B(22, 52, 40, 40, 'ecl-tk', 'TKN') + T(74, 64, 'Your asset', 15, { w: 600, c: 'k' }) + T(74, 84, 'ERC-20 · Ethereum', 12, { c: 'm' }) + hr(22, 108, 286) +
      ST.map((n, i) => { const y = 132 + i * 34; return T(22, y, n, 13.5, { w: 600, c: 'k', k: 'sn' + i }) + CK('s' + i, 286, y - 10, 20); }).join(''));
    const EX = ['A', 'B', 'C'];
    const net = B(250, 222, 330, 180, 'u-p dk',
      T(22, 28, 'Exchange partners', 12, { w: 600, c: 'dm' }) + T(308, 28, '0 of 3 listed', 12, { w: 600, c: 'wt', al: 'r', k: 'cnt' }) + HRD(22, 46, 286) +
      EX.map((a, j) => { const y = 58 + j * 40; return B(22, y + 3, 30, 30, 'ecl-av', a, 'av' + j) + T(64, y + 11, 'Exchange ' + a, 13, { w: 600, c: 'wt' }) + T(64, y + 28, 'Not listed', 11.5, { c: 'dm', k: 'pa' + j }) + T(64, y + 28, 'Listed', 11.5, { w: 600, c: 'ec-ok', k: 'pb' + j }) +
        B(270, y + 8, 38, 20, 'ecl-sw', '<i data-k="si' + j + '"></i><b data-k="sb' + j + '"></b>'); }).join(''));
    mountUI(el, 580, 410, req + net, (R, t) => {
      if (reduce) t = 7;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      ST.forEach((_, i) => { const a = .5 + i * .7, p = f(a + .4, a + .7); setCk(R['s' + i], p, wait(a, a + .4), t); R['sn' + i].classList.toggle('a', tt > a && p < .5 && off < .5); });
      setPill(R.pill, f(2.6, 3.0), 'In review', 'Listed');
      let n = 0;
      EX.forEach((_, j) => { const p = f(3.4 + j * .6, 3.7 + j * .6); R['si' + j].style.opacity = p; R['sb' + j].style.transform = `translateX(${(18 * p).toFixed(2)}px)`; swap(R['pa' + j], R['pb' + j], p); R['av' + j].classList.toggle('on', p > .5); n += p; });
      setTx(R.cnt, `${Math.floor(n + .5)} of 3 listed`);
    });
  };
})();
