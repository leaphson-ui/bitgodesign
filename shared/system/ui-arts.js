/* More UI arts for the 3x multicard and the 50/50 (registered into the same registry as modules.js's UI arts).
   Same language as the Self-Custody arts: white product panels, one dark panel, Inter Tight, BitGo blue, a short
   eased loop that ends on a complete still frame. Load after modules.js. Each art says what its card says.
   Styles: ui-arts.css, every rule scoped to its art. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, reduce } = K;

  /* small shared pieces, built only from the kit's parts */
  const pw = s => Math.round(s.length * 6.4 + 30);                                   // pill width for a label
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const DOTS = '<i class="wd" style="left:18px"></i><i class="wd" style="left:32px"></i><i class="wd" style="left:46px"></i>';
  const HRD = (x, y, w) => B(x, y, w, 1, 'ua-hrd');                                   // divider on a dark panel
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
  const BTN = (k, x, y, w, h, a, b) => B(x, y, w, h, 'ua-btn', `<span class="l0" data-k="${k}0">${a}</span><span class="l1" data-k="${k}1">${TICKW}${b}</span>`, k);
  const setBtn = (R, k, press, done) => { R[k].style.transform = `scale(${(1 - press * .05).toFixed(3)})`; R[k + '0'].style.opacity = cl(1 - done * 2); R[k + '1'].style.opacity = cl(done * 2 - 1); };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };  // old label out before the new one comes in
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  /* typed code block on a dark panel (same as Self-Custody's API cards) */
  const code = (L, top, lh) => {
    const segs = []; let total = 0;
    const html = L.map((ln, li) => `<div class="cl" style="top:${top + li * lh}px">${ln.map(([s, c]) => { segs.push({ s, li }); total += s.length; return `<span class="${c}"></span>`; }).join('')}<i class="cr"></i></div>`).join('');
    const set = (el, R, p, t) => {
      const n = Math.floor(total * cl(p));
      if (R.__n !== n) {
        R.__n = n; let r = n, cline = 0; const sp = el.querySelectorAll('.cl > span');
        segs.forEach((g, i) => { const cut = g.s.slice(0, Math.max(0, Math.min(g.s.length, r))); r -= g.s.length; if (cut) cline = g.li; if (sp[i].textContent !== cut) sp[i].textContent = cut; });
        el.querySelectorAll('.cl > i').forEach((c, i) => { c.style.display = i === cline ? '' : 'none'; });
      }
      el.querySelectorAll('.cl > i').forEach(c => { c.style.opacity = reduce ? 0 : (Math.sin(t * 5) > -.3 ? 1 : 0); });
    };
    return { html, set };
  };

  /* ---------------------------------------------------------------------------------------------------------------
     Cold Wallets: "Keeping Your Assets Safe, One Feature at a Time"
     --------------------------------------------------------------------------------------------------------------- */

  /* Your Hardware: an offline signer order sourced through three distributors. Each unit is checked in turn: the
     attestation panel matches its serial, firmware signature and tamper seal, then the unit's row ticks. */
  UI.cwHardware = el => {
    const U = [['A', 'Distributor A', '4821-K7'], ['B', 'Distributor B', '7730-Q2'], ['C', 'Distributor C', '1194-M5']], W0 = [.8, 2.6, 4.4];
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Hardware order', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Verifying', 'Verified', 24, 21) +
      T(24, 80, 'Offline signer', 30, { w: 600, c: 'k' }) + T(24, 108, '3 units · sourced through 3 distributors', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      U.map(([a, n, sn], i) => { const y = 140 + i * 52 + 26; return B(25, y - 15, 30, 30, 'av', a, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, `Unit ${i + 1} · SN ${sn}`, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      T(24, 308, 'Units verified', 12, { c: 'm' }) + B(116, 305, 134, 6, 'bar', '<i data-k="barf"></i>') + T(304, 308, '0 of 3', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const att = B(316, 176, 254, 214, 'u-p dk',
      T(22, 28, 'Attestation', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Unit 1', 12, { w: 600, c: 'dm', al: 'r', k: 'un' }) + HRD(22, 46, 210) +
      [['Serial', '', 'wt mono'], ['Firmware', 'Signed', 'wt'], ['Tamper seal', 'Intact', 'wt']].map(([n, v, c], j) => { const y = 70 + j * 34; return T(22, y, n, 12.5, { c: 'dm' }) + T(198, y, v, 12.5, { w: 600, c, al: 'r', k: 'v' + j }) + CK('k' + j, 214, y - 8, 16) + (j < 2 ? HRD(22, y + 17, 210) : ''); }).join('') +
      RESP('rs', 22, 172, 132, 'Matches order'));
    mountUI(el, 570, 410, card + att, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let cnt = 0;
      U.forEach((_, i) => { const s = W0[i], p = f(s + 1.15, s + 1.5), wt = sm(s - .1, s + .1, tt) * (1 - sm(s + 1.05, s + 1.15, tt)) * (1 - off); setCk(R['c' + i], p, wt, t); R['av' + i].classList.toggle('on', p > .5 || wt > .5); cnt += p; });
      const u = tt < W0[1] - .05 ? 0 : tt < W0[2] - .05 ? 1 : 2, loc = tt - W0[u], out = u < 2 ? sm(1.5, 1.7, loc) : 0;
      setTx(R.un, `Unit ${u + 1}`); setTx(R.v0, U[u][2]);
      [0, 1, 2].forEach(j => { const a = sm(.05 + .28 * j, .25 + .28 * j, loc) * (1 - out) * (1 - off); R['v' + j].style.opacity = a; setCk(R['k' + j], sm(.15 + .28 * j, .4 + .28 * j, loc) * (1 - out) * (1 - off), 0, t); });
      R.barf.style.width = (cnt / 3 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(cnt + .5)} of 3`);
      const ok = f(6.1, 6.7); setPill(R.pill, ok, 'Verifying', 'Verified'); setResp(R, 'rs', f(6.0, 6.4), t);
    });
  };

  /* Our Software: an offline signing session. The offline signer reviews the transaction and signs it with the user
     key, the session steps through Build, Sign offline and Export, and the half-signed file is ready for co-signing. */
  UI.cwSoftware = el => {
    const rows = [['Amount', '40.00 BTC', 'wt'], ['To', 'bc1q8f2…k29x', 'wt mono'], ['From', 'Treasury · cold wallet', 'wt']];
    const sig = B(0, 10, 330, 236, 'u-p dk',
      DOTS + T(312, 24, 'Offline signer', 12, { al: 'r', c: 'dm' }) +
      T(22, 64, 'Review transaction', 13.5, { w: 600, c: 'wt' }) +
      rows.map(([n, v, c], i) => { const y = 98 + i * 26; return T(22, y, n, 12.5, { c: 'dm', k: 'rn' + i }) + T(92, y, v, 12.5, { w: 600, c, k: 'rv' + i }); }).join('') +
      BTN('btn', 22, 174, 210, 42, 'Sign with user key', 'Signed with user key'));
    const st = [['Build', 32], ['Sign offline', 165], ['Export', 298]];
    const ses = B(250, 196, 330, 200, 'u-p',
      T(22, 30, 'Signing session', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Unsigned', 'Half-signed', 22, 17) +
      B(46, 77, 104, 4, 'bar', '<i data-k="b0"></i>') + B(179, 77, 104, 4, 'bar', '<i data-k="b1"></i>') +
      st.map(([n, x], i) => CK('s' + i, x - 11, 68, 22) + T(x, 108, n, 12, { w: 600, c: 'nm', al: 'c' })).join('') + hr(22, 128, 286) +
      B(16, 138, 298, 48, 'ua-row', T(14, 16, 'tx_7f3a…c21.psbt', 12.5, { w: 600, c: 'k mono' }) + T(14, 33, 'Half-signed · ready for BitGo co-sign', 12, { c: 'm' }), 'fr'));
    mountUI(el, 580, 410, sig + ses, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      rows.forEach((_, i) => { const a = f(.25 + i * .2, .55 + i * .2); R['rn' + i].style.opacity = R['rv' + i].style.opacity = a; R['rv' + i].style.transform = `translateX(${((1 - a) * 6).toFixed(2)}px)`; });
      setCk(R.s0, f(.9, 1.3), 0, t); R.b0.style.width = (f(1.3, 1.8) * 100).toFixed(2) + '%';
      const press = sm(1.9, 2.05, tt) * (1 - sm(2.05, 2.25, tt)), done = f(2.25, 2.6);
      setBtn(R, 'btn', press, done);
      setCk(R.s1, f(2.4, 2.8), sm(1.8, 1.9, tt) * (1 - sm(2.35, 2.45, tt)) * (1 - off), t); setPill(R.pill, f(2.5, 3.0), 'Unsigned', 'Half-signed');
      R.b1.style.width = (f(3.0, 3.5) * 100).toFixed(2) + '%'; setCk(R.s2, f(3.5, 3.9), 0, t);
      const fr = f(3.7, 4.3); R.fr.style.opacity = fr; R.fr.style.transform = `translateY(${((1 - fr) * 8).toFixed(2)}px)`;
    });
  };

  /* HSM Protection: a withdrawal request is evaluated against the wallet policy inside the HSM. The rule is checked
     line by line, the key stays sealed, then the request's policy, integrity and signature rows tick. */
  UI.cwHsm = el => {
    const req = B(0, 14, 340, 312, 'u-p',
      T(24, 34, 'Transaction request', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Evaluating', 'Signed', 24, 21) +
      T(24, 80, '120.00 ETH', 32, { w: 600, c: 'k' }) + T(24, 108, 'To <span style="font-feature-settings:normal;font-variant-ligatures:none">0x7a3f</span>…91c2 · Treasury wallet', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      [['Policy check', 'Evaluated inside the HSM'], ['Payload integrity', 'Hash matches the request'], ['Signature', 'Released by the HSM']].map(([n, sub], i) => { const y = 140 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join(''));
    const L = [['policy', 'Treasury limits'], ['rule', 'amount ≤ 500.00 ETH'], ['value', '120.00 ETH'], ['result', 'allow']];
    const hsm = B(316, 170, 254, 226, 'u-p dk',
      T(22, 28, 'HSM', 12, { w: 600, c: 'dm' }) + `<span class="ua-ch dk" style="right:16px;top:16px">${LOCK}Key sealed</span>` + HRD(22, 50, 210) +
      B(22, 62, 210, 36, 'ua-krow', T(12, 18, 'Signing key', 12.5, { c: 'dm' }) + T(198, 18, 'wk_3f9…a1', 12.5, { w: 600, c: 'wt mono', al: 'r' }), 'kr') +
      B(12, 0, 230, 26, 'ua-scan', '', 'scan') +
      L.map(([n, v], j) => { const y = 124 + j * 26; return T(22, y, n, 12.5, { c: 'dm mono' }) + T(96, y, v, 12.5, { w: 600, c: j === 3 ? 'ua-ok mono' : 'wt mono', k: 'l' + j }); }).join(''));
    mountUI(el, 570, 410, req + hsm, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const pos = Math.min(3, cl((tt - .8) / 1.8) * 3), sv = sm(.6, .8, tt) * (1 - sm(2.75, 3.05, tt)) * (1 - off);
      R.scan.style.transform = `translateY(${(111 + pos * 26).toFixed(2)}px)`; R.scan.style.opacity = sv;
      [0, 1, 2].forEach(j => { R['l' + j].style.opacity = .45 + .55 * f(.8 + j * .6, 1.1 + j * .6); });
      R.l3.style.opacity = f(2.55, 2.9);
      const wait = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      setCk(R.c0, f(3.0, 3.4), wait(.8, 3.0), t); setCk(R.c1, f(3.6, 4.0), wait(3.3, 3.6), t); setCk(R.c2, f(4.5, 4.9), wait(4.0, 4.5), t);
      R.kr.classList.toggle('act', tt > 4.0 && tt < 5.2 && off < .5);
      setPill(R.pill, f(5.0, 5.5), 'Evaluating', 'Signed');
    });
  };

  /* ---------------------------------------------------------------------------------------------------------------
     Global Markets: "Global Liquidity Layer"
     --------------------------------------------------------------------------------------------------------------- */

  /* Electronic Execution: a limit order goes in over the REST API (FIX and WebSocket beside it), is accepted, and the
     order ticket fills in three executions. Avg price × quantity = notional. */
  UI.gmElectronic = el => {
    const C = code([[['POST ', 'kw'], ['/trading/v1/orders', 'st']], [['{', 'pn']], [['  "pair"', 'ky'], [': ', 'pn'], ['"BTC-USD"', 'st'], [',', 'pn']], [['  "side"', 'ky'], [': ', 'pn'], ['"buy"', 'st'], [',', 'pn']], [['  "qty"', 'ky'], [': ', 'pn'], ['"15.00"', 'st'], [',', 'pn']], [['  "limit"', 'ky'], [': ', 'pn'], ['"97250.00"', 'st']], [['}', 'pn']]], 58, 22);
    const api = B(0, 8, 340, 252, 'u-p dk',
      DOTS + '<div class="gme-tabs" style="right:14px;top:12px"><span class="sel">REST</span><span>FIX</span><span>WebSocket</span></div>' + C.html +
      `<div class="resp" data-k="resp" style="left:22px;top:216px;height:22px">${CK('rk', 8, 4, 14)}<span>201 Created</span></div>`);
    const F = [[4.20, 97230.00], [5.55, 97240.50]]; F.push([5.25, (15 * 97236.40 - F[0][0] * F[0][1] - F[1][0] * F[1][1]) / 5.25]);
    const tk = B(250, 182, 330, 234, 'u-p',
      T(22, 30, 'Order · BTC / USD', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Open', 'Filled', 22, 17) +
      T(22, 74, '15.00 BTC', 30, { w: 600, c: 'k' }) + T(22, 101, 'Buy · limit 97,250.00 USD', 12.5, { c: 'm' }) + hr(22, 120, 286) +
      T(22, 144, 'Filled', 12, { c: 'm' }) + B(70, 141, 130, 6, 'bar', '<i data-k="barf"></i>') + T(308, 144, '0.00 of 15.00 BTC', 12, { w: 600, c: 'k', al: 'r', k: 'fq' }) + hr(22, 164, 286) +
      T(22, 188, 'Avg price', 12, { c: 'm' }) + T(308, 188, '–', 13, { w: 600, c: 'k', al: 'r', k: 'ap' }) +
      T(22, 212, 'Notional', 12, { c: 'm' }) + T(308, 212, '–', 13, { w: 600, c: 'k', al: 'r', k: 'nt' }));
    const S = [3.3, 3.95, 4.6];
    mountUI(el, 580, 420, api + tk, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      C.set(el, R, cl((tt - .4) / 2.1) * (1 - off), t);
      const rc = f(2.6, 2.9); R.resp.style.opacity = rc; setCk(R.rk, rc, 0, t);
      let q = 0, nt = 0, k = 0;
      F.forEach(([qq, px], i) => { const p = f(S[i], S[i] + .3); q += qq * p; if (p > .5) { nt += qq * px; k++; } });
      R.barf.style.width = (q / 15 * 100).toFixed(2) + '%'; setTx(R.fq, `${fmt(q)} of 15.00 BTC`);
      const qd = F.slice(0, k).reduce((s, [qq]) => s + qq, 0);
      setTx(R.ap, k ? fmt(nt / qd) : '–'); setTx(R.nt, k ? fmt(nt) + ' USD' : '–');
      setPill(R.pill, f(5.0, 5.5), 'Open', 'Filled');
    });
  };

  /* Voice or Chat Execution: an RFQ with the OTC desk. The client asks for a block, the desk sends a firm quote, the
     client accepts, the desk confirms, and the block trade ticket flips to Confirmed. 250 × 97,180 = 24,295,000. */
  UI.gmVoice = el => {
    const chat = B(0, 6, 350, 300, 'u-p',
      B(20, 16, 32, 32, 'av on', 'D') + T(62, 24, 'OTC desk', 13.5, { w: 600, c: 'k' }) + T(62, 41, 'Your desk trader', 12, { c: 'm' }) + T(330, 32, 'RFQ', 12, { w: 600, c: 'm', al: 'r' }) + hr(20, 62, 310) +
      '<div class="gv-b gv-me" data-k="m0" style="right:20px;top:76px">Looking to buy 250 BTC. Can you quote?</div>' +
      '<div class="gv-b gv-ty" data-k="ty" style="left:20px;top:122px"><i></i><i></i><i></i></div>' +
      B(20, 122, 310, 104, 'ua-row', T(16, 22, 'Firm quote · 250.00 BTC', 12, { w: 600, c: 'm' }) + T(294, 22, '0:30', 12, { w: 600, c: 'k mono', al: 'r', k: 'cd' }) +
        T(16, 54, '97,180.00', 22, { w: 600, c: 'k' }) + T(16, 78, 'USD per BTC · offer', 12, { c: 'm' }) +
        BTN('btn', 186, 40, 108, 38, 'Accept', 'Accepted') + B(16, 94, 278, 3, 'bar', '<i data-k="cdb"></i>'), 'qt') +
      '<div class="gv-b" data-k="m1" style="left:20px;top:240px">Done. You bought 250 BTC at 97,180.00.</div>');
    const conf = B(318, 222, 262, 168, 'u-p',
      T(22, 30, 'Block trade', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Confirmed', 22, 17) +
      T(22, 72, '250.00 BTC', 28, { w: 600, c: 'k' }) + T(22, 98, 'Bought at 97,180.00 USD', 12.5, { c: 'm' }) + hr(22, 116, 218) +
      T(22, 140, 'Notional', 12, { c: 'm' }) + T(240, 140, '24,295,000.00 USD', 12.5, { w: 600, c: 'k', al: 'r' }), 'cf');
    mountUI(el, 580, 410, chat + conf, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const popIn = (n, p) => { n.style.opacity = cl(p * 2.5); n.style.transform = `scale(${(.92 + .08 * pop(p)).toFixed(3)})`; };
      popIn(R.m0, f(.4, .8));
      const ty = sm(1.0, 1.15, tt) * (1 - sm(1.8, 1.9, tt)) * (1 - off); R.ty.style.opacity = ty;
      [...R.ty.children].forEach((d, i) => { d.style.opacity = reduce ? .5 : .35 + .65 * Math.max(0, Math.sin(t * 7 - i * .9)); });
      popIn(R.qt, f(1.9, 2.3));
      const acc = f(3.6, 3.9), press = sm(3.35, 3.5, tt) * (1 - sm(3.5, 3.7, tt));
      setBtn(R, 'btn', press, acc); R.qt.classList.toggle('act', tt > 2.9 && tt < 3.9 && off < .5);
      const left = 30 - cl((Math.min(tt, 3.6) - 2.3) / 1.3) * 5; setTx(R.cd, `0:${String(Math.ceil(left)).padStart(2, '0')}`); R.cdb.style.width = (left / 30 * 100).toFixed(2) + '%';
      popIn(R.m1, f(4.3, 4.7));
      const cf = f(4.7, 5.2); R.cf.style.opacity = cf; R.cf.style.transform = `translateY(${((1 - cf) * 10).toFixed(2)}px)`;
      setPill(R.pill, f(5.4, 5.9), 'Pending', 'Confirmed');
    });
  };

  /* Advanced Tools: a TWAP order works through ten slices. Each fill lands on the TCA chart against the arrival price,
     the average fill and slippage update, and the execution report is generated when the order completes.
     Fills average 97,214.60 against a 97,200.00 arrival: +1.5 bps. */
  UI.gmTools = el => {
    const DEV = [4, 9, 12, 18, 10, 15, 22, 17, 20, 19], ARR = 97200, N = DEV.length;
    const cx = i => 12 + i * 21.5, cy = d => 70 - d * 2.3;
    const twap = B(0, 10, 340, 292, 'u-p',
      T(24, 34, 'TWAP order', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Working', 'Complete', 24, 21) +
      T(24, 80, '500.00 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'Buy · 10 slices over 60 min', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      DEV.map((_, i) => B(24 + i * 28.2, 146, 25, 36, 'gmt-sl', '<i data-k="sl' + i + '"></i>')).join('') +
      T(24, 204, 'Executed', 12, { c: 'm' }) + T(304, 204, '0.00 of 500.00 BTC', 12, { w: 600, c: 'k', al: 'r', k: 'ex' }) + hr(24, 224, 292) +
      T(24, 248, 'Execution report', 13.5, { w: 600, c: 'k' }) + T(24, 266, 'Fills and TCA · CSV', 12, { c: 'm', k: 'rs0' }) + T(24, 266, 'Ready to download', 12, { c: 'a', k: 'rs1' }) + CK('rp', 284, 247, 20));
    const chart = `<svg class="gmt-ch" style="left:22px;top:48px" width="210" height="84" viewBox="0 0 210 84"><path class="gmt-ar" d="M0 70H210"/><polyline class="gmt-avl" data-k="avl" points=""/>${DEV.map((d, i) => `<circle data-k="d${i}" cx="${cx(i)}" cy="${cy(d)}" r="0"/>`).join('')}</svg>`;
    const tca = B(316, 178, 254, 232, 'u-p dk',
      T(22, 28, 'Transaction cost analysis', 12, { w: 600, c: 'dm' }) + chart + T(232, 108, 'Arrival', 12, { c: 'dm', al: 'r' }) + HRD(22, 142, 210) +
      T(22, 164, 'Arrival price', 12.5, { c: 'dm' }) + T(232, 164, fmt(ARR), 12.5, { w: 600, c: 'wt', al: 'r' }) +
      T(22, 188, 'Avg fill', 12.5, { c: 'dm' }) + T(232, 188, '–', 12.5, { w: 600, c: 'wt', al: 'r', k: 'af' }) +
      T(22, 212, 'Slippage vs arrival', 12.5, { c: 'dm' }) + T(232, 212, '–', 12.5, { w: 600, c: 'ua-ok', al: 'r', k: 'sp' }));
    mountUI(el, 570, 420, twap + tca, (R, t) => {
      if (reduce) t = 9;
      const P = 11, tt = t % P, off = sm(9.8, 10.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let q = 0, k = 0, sum = 0; const pts = [];
      DEV.forEach((d, i) => { const s = .6 + i * .52, p = f(s, s + .32); R['sl' + i].style.height = (p * 100).toFixed(2) + '%'; R['d' + i].setAttribute('r', (3.4 * pop(p)).toFixed(2)); q += 50 * p; if (p > .5) { k++; sum += d; pts.push(`${cx(i)},${cy(sum / k).toFixed(2)}`); } });
      if (R.avl.__p !== pts.length) { R.avl.__p = pts.length; R.avl.setAttribute('points', pts.join(' ')); }
      setTx(R.ex, `${fmt(q)} of 500.00 BTC`);
      setTx(R.af, k ? fmt(ARR + sum / k) : '–'); setTx(R.sp, k ? `+${(sum / k / ARR * 1e4).toFixed(1)} bps` : '–');
      setPill(R.pill, f(6.0, 6.5), 'Working', 'Complete');
      const rp = f(6.9, 7.3); setCk(R.rp, rp, sm(6.0, 6.1, tt) * (1 - sm(6.8, 6.9, tt)) * (1 - off), t); swap(R.rs0, R.rs1, rp);
    });
  };

  /* ---------------------------------------------------------------------------------------------------------------
     Global Markets: "Financing, Derivatives, & Structured Solutions"
     --------------------------------------------------------------------------------------------------------------- */

  /* Prime Financing: a USDC loan against BTC. The loan-to-value is worked out (400,000 / 970,000 = 41.2%), the request
     is approved, and the USDC lands as available to trade while the BTC stays held, pledged, not sold. */
  UI.gmFinancing = el => {
    const LTV = 400000 / 970000 * 100;
    const req = B(0, 14, 340, 296, 'u-p',
      T(24, 34, 'Financing request', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'In review', 'Approved', 24, 21) +
      T(24, 80, '400,000 USDC', 32, { w: 600, c: 'k' }) + T(24, 108, 'Against 10.00 BTC · holdings not sold', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      T(24, 158, 'Loan-to-value', 13.5, { w: 600, c: 'k' }) + T(316, 158, '0.0%', 13.5, { w: 600, c: 'k', al: 'r', k: 'ltv' }) +
      B(24, 178, 292, 8, 'bar', '<i data-k="barf"></i>') + hr(24, 222, 292) +
      T(24, 246, 'Collateral', 12, { c: 'm' }) + T(24, 268, '10.00 BTC', 15, { w: 600, c: 'k' }) +
      T(150, 246, 'Collateral value', 12, { c: 'm' }) + T(150, 268, '970,000 USD', 15, { w: 600, c: 'k' }));
    const hold = B(316, 196, 254, 206, 'u-p dk',
      T(22, 28, 'Holdings', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Trading account', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      B(22, 58, 30, 30, 'ua-tok', 'B') + T(62, 65, 'BTC', 13.5, { w: 600, c: 'wt' }) + T(62, 82, 'In custody', 12, { c: 'dm', k: 'ba' }) + T(62, 82, 'Pledged · not sold', 12, { c: 'ua-ok', k: 'bb' }) + T(232, 73, '10.00', 13.5, { w: 600, c: 'wt', al: 'r' }) + HRD(22, 100, 210) +
      B(22, 112, 30, 30, 'ua-tok', 'U') + T(62, 119, 'USDC', 13.5, { w: 600, c: 'wt' }) + T(62, 136, 'Available to trade', 12, { c: 'dm' }) + T(232, 127, '0', 13.5, { w: 600, c: 'wt', al: 'r', k: 'us' }) +
      RESP('rs', 22, 164, 132, 'Funds released'));
    mountUI(el, 570, 410, req + hold, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const lv = f(.7, 1.9); R.barf.style.width = (lv * LTV).toFixed(2) + '%'; setTx(R.ltv, (lv * LTV).toFixed(1) + '%');
      swap(R.ba, R.bb, f(1.4, 1.9));
      setPill(R.pill, f(2.4, 2.9), 'In review', 'Approved');
      setTx(R.us, fmt(400000 * f(3.1, 4.3), 0));
      setResp(R, 'rs', f(4.3, 4.7), t);
    });
  };

  /* Derivatives & Structured Solutions: a hedge builder. A protective put is added to a long BTC position; the payoff
     line bends from unlimited downside to a floor at the strike, and the exposure line says so. */
  UI.gmDerivatives = el => {
    const W = 312, H = 120, X = p => (p - 70000) / 50000 * W, Y = v => (2.3e6 - v) / 5e6 * H;
    const un = [[X(70000), Y(-2.7e6)], [X(90000), Y(-0.7e6)], [X(120000), Y(2.3e6)]], hg = [[X(70000), Y(-0.9e6)], [X(90000), Y(-0.9e6)], [X(120000), Y(2.1e6)]];
    const d = pts => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
    const svg = `<svg class="gmd-ch" style="left:24px;top:122px" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <path class="gmd-z" d="M0 ${Y(0).toFixed(1)}H${W}"/><path class="gmd-k" d="M${X(90000).toFixed(1)} 0V${H}"/>
      <path class="gmd-pr" data-k="pr" d="M0 ${un[0][1].toFixed(1)}L${un[1][0].toFixed(1)} ${un[1][1].toFixed(1)}L${un[1][0].toFixed(1)} ${hg[1][1].toFixed(1)}L0 ${hg[0][1].toFixed(1)}Z"/>
      <path class="gmd-un" data-k="un" d="${d(un)}"/><path class="gmd-hg" data-k="hg" d="${d(un)}"/></svg>`;
    const bld = B(0, 10, 360, 284, 'u-p',
      T(24, 34, 'Hedge builder', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Draft', 'Hedged', 24, 21) +
      T(24, 78, 'Long 100.00 BTC', 24, { w: 600, c: 'k' }) + T(24, 104, 'Payoff at expiry', 12.5, { c: 'm' }) + svg +
      T(X(90000) + 24, 262, 'Strike 90,000', 12, { w: 600, c: 'a', al: 'c' }));
    const leg = (k, y, n, sub, right) => B(16, y, 248, 50, 'ua-row', T(14, 17, n, 13.5, { w: 600, c: 'k' }) + T(14, 34, sub, 12, { c: 'm' }) + right, k);
    const legs = B(310, 192, 270, 208, 'u-p',
      T(22, 30, 'Legs', 12.5, { w: 600, c: 'm' }) + T(248, 30, 'BTC · 30-day', 12, { c: 'm', al: 'r' }) +
      leg('g0', 46, 'Long BTC', '100.00 BTC · spot', '') +
      leg('g1', 102, 'Buy put', 'Strike 90,000 · 100.00 BTC', `<span class="ua-ch" style="right:12px;top:13px">${TICKW}Added</span>`) +
      hr(22, 166, 226) + T(22, 186, 'Downside', 12, { c: 'm' }) + T(248, 186, 'Unlimited', 12.5, { w: 600, c: 'k', al: 'r', k: 'x0' }) + T(248, 186, 'Floored at 90,000', 12.5, { w: 600, c: 'a', al: 'r', k: 'x1' }));
    mountUI(el, 580, 410, bld + legs, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const g = f(1.0, 1.6); R.g1.style.opacity = g; R.g1.style.transform = `translateY(${((1 - g) * 10).toFixed(2)}px)`; R.g1.classList.toggle('act', tt > 1.0 && tt < 3.0 && off < .5);
      const h = f(1.7, 2.9);
      R.hg.setAttribute('d', d(un.map(([x, y], i) => [x, y + (hg[i][1] - y) * h]))); R.un.style.opacity = h; R.pr.style.opacity = h;
      swap(R.x0, R.x1, f(2.5, 3.0)); setPill(R.pill, f(3.0, 3.5), 'Draft', 'Hedged');
    });
  };

  /* Collateral Management: a margin monitor on collateral held in qualified custody. The BTC price falls, the margin
     ratio drops to the 140% target, a 2.00 BTC top-up settles from custody and the ratio recovers.
     16 × 95,000 / 1,000,000 = 152.0%; 16 × 86,875 = 139.0%; 18 × 86,875 = 156.4%. */
  UI.gmCollateral = el => {
    const LOAN = 1e6, P0 = 95000, P1 = 86875, T0 = .4, T1 = 2.8, TU = [3.7, 4.3];
    const price = s => P0 + (P1 - P0) * sm(T0, T1, s), qty = s => 16 + 2 * sm(TU[0] + .25, TU[0] + .55, s), ratio = s => qty(s) * price(s) / LOAN * 100;
    const CW = 210, CH = 80, cxs = s => s / 5 * CW, cys = r => (160 - r) / 30 * CH;
    const acct = B(0, 10, 340, 288, 'u-p',
      T(24, 34, 'Collateral account', 12.5, { w: 600, c: 'm' }) + `<span class="ua-ch" style="right:24px;top:21px;height:26px">${LOCK}Qualified custody</span>` +
      T(24, 80, '152.0%', 32, { w: 600, c: 'k', k: 'rt' }) + T(24, 108, 'Margin ratio · target 140%', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      [['Collateral', '16.00 BTC', 'cq'], ['BTC price', '95,000.00 USD', 'px'], ['Collateral value', '1,520,000 USD', 'cv'], ['Loan', '1,000,000 USDC', '']].map(([n, v, k], i) => { const y = 156 + i * 34; return T(24, y, n, 12.5, { c: 'm' }) + T(304, y, v, 13.5, { w: 600, c: 'k', al: 'r', k }) + (i < 3 ? hr(24, y + 17, 292) : ''); }).join(''));
    const tgt = cys(140);
    const mon = B(316, 172, 254, 228, 'u-p dk',
      T(22, 28, 'Margin monitor', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Live', 12, { w: 600, c: 'ua-ok', al: 'r' }) +
      `<svg class="gmc-ch" style="left:22px;top:48px" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><path class="gmc-tg" d="M0 ${tgt.toFixed(1)}H${CW}"/><path class="gmc-ln" data-k="ln" d=""/><circle class="gmc-hd" data-k="hd" r="3.6"/></svg>` +
      T(22, 144, 'Target 140%', 12, { c: 'dm' }) + HRD(22, 162, 210) +
      T(22, 184, 'Top-up', 13.5, { w: 600, c: 'wt' }) + T(22, 202, 'Monitoring', 12, { c: 'dm', k: 'ta' }) + T(22, 202, '2.00 BTC from custody · settled', 12, { c: 'ua-ok', k: 'tb' }) + CK('tc', 212, 183, 20));
    mountUI(el, 570, 410, acct + mon, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const now = Math.min(tt, 5), lerp = (a, b) => a + (b - a) * off;      // the reset eases the figures back, it never replays the drop
      const px = lerp(price(now), P0), q = lerp(qty(now), 16), r = q * px / LOAN * 100;
      setTx(R.rt, r.toFixed(1) + '%'); setTx(R.px, fmt(px) + ' USD'); setTx(R.cq, q.toFixed(2) + ' BTC'); setTx(R.cv, fmt(q * px, 0) + ' USD');
      const n = Math.max(1, Math.round(now / 5 * 60)), pts = []; for (let i = 0; i <= n; i++) { const u = now * i / n; pts.push(`${cxs(u).toFixed(1)} ${cys(ratio(u)).toFixed(1)}`); }
      R.ln.setAttribute('d', 'M' + pts.join('L')); R.hd.setAttribute('cx', cxs(now).toFixed(1)); R.hd.setAttribute('cy', cys(ratio(now)).toFixed(1));
      R.ln.style.opacity = R.hd.style.opacity = 1 - off;
      const st = f(TU[0] + .2, TU[1] + .2), due = sm(T1 - .1, T1, tt) * (1 - off);
      setCk(R.tc, st, due * (1 - sm(TU[0] + .1, TU[0] + .2, tt)), t); swap(R.ta, R.tb, st);
      setTx(R.ta, due > .5 ? 'Below target · topping up' : 'Monitoring');
    });
  };
})();
