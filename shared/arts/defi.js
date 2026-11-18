/* DeFi UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / cwHardware / cwSoftware: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends
   on a complete still frame (reduced motion draws that frame). The live page has no product images, so every label comes from its
   copy (approved protocols and addresses, spending thresholds, asset restrictions, full transaction context, protocol exposure,
   independent risk managers, receipt tokens in qualified custody, Concrete and Morpho); amounts are illustrations, no rates or
   yields. Styles: defi.css.
     dfPolicy    "Policy Engine": the four controls switch on (approved protocols, approved addresses, spending threshold, asset
                 restrictions); an interaction with an approved protocol is allowed and one with an unlisted protocol is blocked
     dfAudit     "Real-Time Audit Trail": a new onchain interaction arrives at the top of the trail with its full context (protocol,
                 approvals, policy), and the protocol exposure bars update in the same dashboard
     dfStrategy  "Select your strategy": the vault list moves to the vault that fits, and the risk manager's terms tick: investment
                 thesis, risk parameters, maximum exposure limit
     dfDeposit   "Deposit assets": a deposit goes into the selected vault; the assets are deposited, receipt tokens issued, and both
                 secured in BitGo qualified custody */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'df-hrd');
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const XW = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  const BTN = (k, x, y, w, h, a, b) => B(x, y, w, h, 'df-btn', `<span class="l0" data-k="${k}0">${a}</span><span class="l1" data-k="${k}1">${TICKW}${b}</span>`, k);
  const setBtn = (R, k, press, done) => { R[k].style.transform = `scale(${(1 - press * .05).toFixed(3)})`; R[k + '0'].style.opacity = cl(1 - done * 2); R[k + '1'].style.opacity = cl(done * 2 - 1); };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Policy engine: the four live controls switch on one by one; then two interactions meet the policy. The deposit into an
     approved protocol is allowed, the swap on an unlisted protocol is blocked before it moves anything. */
  UI.dfPolicy = el => {
    const RU = [['Approved protocols', 'Morpho · Concrete'], ['Approved addresses', 'Whitelist only'], ['Spending threshold', '1,000,000 USDC per day'], ['Asset restrictions', 'USDC · ETH · BTC']];
    const pol = B(0, 14, 340, 266, 'u-p',
      T(24, 34, 'Policy · DeFi', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Draft', 'Active', 24, 21) + hr(24, 56, 292) +
      RU.map(([n, sub], i) => { const y = 62 + i * 48; return T(24, y + 18, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 35, sub, 12, { c: 'm' }) + `<div class="df-sw" style="left:278px;top:${y + 16}px"><i data-k="sw${i}"></i><b data-k="kn${i}"></b></div>`; }).join(''));
    const IX = [['Morpho · Deposit', '250,000 USDC', 'Allowed', 1], ['Unlisted protocol · Swap', '80,000 USDC', 'Blocked', 0]];
    const run = B(300, 262, 270, 160, 'u-p dk',
      T(22, 28, 'Interactions', 12, { w: 600, c: 'dm' }) + T(248, 28, 'Policy check', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 226) +
      IX.map(([n, amt, res, ok], i) => { const y = 58 + i * 52;
        return T(22, y + 12, n, 13, { w: 600, c: 'wt' }) + T(22, y + 30, amt, 12, { c: 'dm' }) +
          `<span class="df-res ${ok ? 'ok' : 'no'}" data-k="r${i}" style="right:22px;top:${y + 9}px">${ok ? TICKW : XW}${res}</span>`; }).join(''));
    mountUI(el, 570, 422, pol + run, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      RU.forEach((_, i) => { const p = f(.6 + i * .45, .9 + i * .45); R['sw' + i].style.opacity = p; R['kn' + i].style.transform = `translateX(${(18 * p).toFixed(2)}px)`; });
      setPill(R.pill, f(2.5, 3.0), 'Draft', 'Active');
      [3.4, 4.4].forEach((s, i) => { const p = f(s, s + .35); R['r' + i].style.opacity = p; R['r' + i].style.transform = `scale(${(.8 + .2 * pop(p)).toFixed(3)})`; });
    });
  };

  /* Real-time audit trail: every onchain interaction lands at the top of the trail with its full context; the newest one opens
     (protocol, approvals, policy), and the protocol exposure on the dark panel moves with it. */
  UI.dfAudit = el => {
    const EV = [['Deposit · Morpho', '250,000 USDC', '2 of 2 approvals · policy passed'], ['Vote · DAO governance', 'Onchain', '2 of 2 approvals · policy passed'], ['Deposit · Concrete', '400,000 USDC', '2 of 2 approvals · policy passed'], ['Swap · via WalletConnect', '12.00 ETH', '2 of 2 approvals · policy passed']];
    const rows = EV.map(([n, amt, ctx], i) => `<div class="wr" data-k="e${i}" style="width:304px;height:56px">` + `<i class="df-dot" style="left:2px;top:13px"></i>` +
      T(22, 18, n, 13.5, { w: 600, c: 'k' }) + T(304, 18, amt, 12.5, { w: 600, c: 'k', al: 'r' }) + T(22, 36, ctx, 12, { c: 'm' }) + '</div>').join('');
    const trail = B(0, 0, 352, 250, 'u-p',
      T(24, 34, 'Audit trail', 15, { w: 600, c: 'k' }) + `<span class="df-live" style="right:24px;top:27px"><i></i>Real time</span>` + hr(24, 56, 304) +
      B(24, 66, 304, 174, 'df-clip', rows));
    const EX = [['Concrete', 400000], ['Morpho', 250000], ['Other protocols', 120000]], MAX = 500000;
    const exp = B(316, 236, 254, 170, 'u-p dk',
      T(22, 28, 'Protocol exposure', 12, { w: 600, c: 'dm' }) + T(232, 28, 'USDC', 12, { w: 600, c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      EX.map(([n], i) => { const y = 66 + i * 40; return T(22, y, n, 12.5, { c: 'dm' }) + T(232, y, '', 12.5, { w: 600, c: 'wt', al: 'r', k: 'xv' + i }) + B(22, y + 14, 210, 6, 'df-bar', `<i data-k="xb${i}"></i>`); }).join(''));
    mountUI(el, 570, 406, trail + exp, (R, t) => {
      if (reduce) t = 6;
      const sp = 2.4, n = EV.length, step = reduce ? 0 : t / sp, base = Math.floor(step), fr = reduce ? 1 : sm(0, .3, step - base);
      EV.forEach((_, i) => { const slot = ((i - base) % n + n) % n, y = (slot - 1 + fr) * 58, w = R['e' + i]; w.style.transform = `translateY(${y.toFixed(2)}px)`; w.style.opacity = slot === 0 ? fr : slot >= 3 ? Math.max(0, 1 - (slot - 3 + fr)) : 1; w.classList.toggle('new', slot === 0 || (slot === 1 && fr < 1)); });
      const g = reduce ? 1 : .92 + .08 * (.5 + .5 * Math.sin(t * .9));
      EX.forEach(([, v], i) => { const val = v * (i === 1 ? g : 1); setTx(R['xv' + i], fmt(Math.round(val / 1000) * 1000, 0)); R['xb' + i].style.width = (val / MAX * 100).toFixed(2) + '%'; });
    });
  };

  /* Select your strategy: the vault list moves to the vault that matches the objective, and the dark panel shows what its
     independent risk manager has set: investment thesis, risk parameters, maximum exposure limits. */
  UI.dfStrategy = el => {
    const VL = [['CO', 'Concrete vault', 'Delta-neutral strategy'], ['MO', 'Morpho vault', 'Earn · onchain credit markets']], RH = 64, Y0 = 70;
    const list = B(0, 14, 340, 250, 'u-p',
      T(24, 34, 'Vault strategies', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Choosing', 'Selected', 24, 21) + hr(24, 56, 292) +
      B(12, Y0, 316, RH - 8, 'hl', '', 'hl') +
      VL.map(([a, n, sub], i) => { const y = Y0 + i * RH; return B(26, y + 13, 30, 30, 'av', a, 'av' + i) + T(68, y + 20, n, 13.5, { w: 600, c: 'k' }) + T(68, y + 37, sub, 12, { c: 'm' }) + B(296, y + 20, 16, 16, 'rad', '<i></i>', 'rd' + i); }).join('') +
      hr(24, 206, 292) + T(24, 230, 'Objective · risk tolerance', 12, { c: 'm' }) + T(300, 230, 'Matched', 12, { w: 600, c: 'a', al: 'r', k: 'mt' }));
    const TM = [['Investment thesis', 'Set'], ['Risk parameters', 'Set'], ['Maximum exposure', 'Limit set']];
    const rm = B(316, 170, 254, 206, 'u-p dk',
      T(22, 28, 'Risk manager', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Independent', 12, { w: 600, c: 'df-ok', al: 'r' }) + HRD(22, 46, 210) +
      TM.map(([n, v], j) => { const y = 72 + j * 36; return T(22, y, n, 12.5, { c: 'dm' }) + T(196, y, v, 12.5, { w: 600, c: 'wt', al: 'r', k: 'v' + j }) + CK('k' + j, 214, y - 8, 16) + (j < 2 ? HRD(22, y + 18, 210) : ''); }).join('') +
      RESP('rs', 22, 168, 150, 'Vault aligned'));
    mountUI(el, 570, 390, list + rm, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const at = 1 - sm(1.2, 2.0, tt) * (1 - off);   // the highlight starts on Morpho and settles on Concrete
      R.hl.style.transform = `translateY(${(at * RH).toFixed(2)}px)`;
      VL.forEach((_, i) => { const a = cl(1 - Math.abs(at - i)); R['rd' + i].firstChild.style.opacity = a; R['rd' + i].classList.toggle('on', a > .02); R['av' + i].classList.toggle('on', a > .5); });
      setPill(R.pill, f(2.1, 2.5), 'Choosing', 'Selected'); R.mt.style.opacity = f(2.1, 2.5);
      TM.forEach((_, j) => { const p = f(2.6 + j * .5, 2.9 + j * .5); R['v' + j].style.opacity = p; setCk(R['k' + j], p, 0, t); });
      setResp(R, 'rs', f(4.3, 4.7), t);
    });
  };

  /* Deposit assets: one press deposits into the selected vault; the three live steps tick in the order the copy gives them:
     assets deposited through the provider's vault, receipt tokens issued, both secured in BitGo qualified custody. */
  UI.dfDeposit = el => {
    const RW = [['Assets deposited', 'Concrete vault · onchain execution'], ['Receipt tokens issued', 'Held for the strategy you selected'], ['Secured in custody', 'BitGo qualified custody']];
    const card = B(0, 0, 430, 372, 'u-p',
      T(24, 34, 'Deposit · Concrete vault', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Secured', 24, 21) +
      T(24, 80, '1,000,000 USDC', 32, { w: 600, c: 'k' }) + T(24, 108, 'From qualified custody', 12.5, { c: 'm' }) + hr(24, 130, 382) +
      RW.map(([n, v], i) => B(16, 144 + i * 56, 398, 48, 'df-row', T(16, 16, n, 13.5, { w: 600, c: 'k' }) + T(16, 33, v, 12, { c: 'm' }) + CK('c' + i, 362, 14, 20), 'r' + i)).join('') +
      BTN('btn', 24, 316, 382, 40, 'Deposit', 'Deposited'));
    mountUI(el, 430, 372, card, (R, t) => {
      if (reduce) t = 7;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const press = sm(.8, .95, tt) * (1 - sm(.95, 1.15, tt)); setBtn(R, 'btn', press, f(1.15, 1.5));
      RW.forEach((_, i) => { const a = 1.7 + i * .7, p = f(a, a + .35); setCk(R['c' + i], p, sm(a - .4, a - .2, tt) * (1 - sm(a + .25, a + .35, tt)) * (1 - off), t); R['r' + i].classList.toggle('act', tt > a - .4 && tt < a + .5 && off < .5); });
      setPill(R.pill, f(3.9, 4.4), 'Pending', 'Secured');
    });
  };
})();
