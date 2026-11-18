/* Staking UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / cwHardware / cwSoftware / cwHsm: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop
   that ends on a complete still frame (reduced motion draws that frame). Names and figures come from the live page's own product
   images (bitgo.com/products/staking/: the stake Timeline, the Figment ETH Stake Positions table, the Validator Partners list) and
   its copy. No yield promises: the only rate shown is the 4.38% printed in the live positions image. Styles: staking.css.
     skTimeline    "Secure Execution": the live timeline. Admin approval, then the restaking delegation of 92 ETH waits for and gets
                   BitGo's signature, the delegation goes out, the activation period runs, and the positions are earning
     skValidators  "Enterprise-Grade Validators": the live validator partners (Blockdaemon, Kiln, Chorus One, Figment: the live Validator Partners image on the Staking page) go through
                   due diligence one by one: security, resiliency, slashing risk
     skBabylon     "Babylon": BTC is staked from a BitGo wallet; it is locked on Bitcoin (never leaves the network) while it helps
                   secure proof-of-stake networks; ownership and custody stay with the client
     skCore        "Core": BTC is delegated to Core for consensus and governance, with no token wrapping and no cross-chain bridge
     skRestake     "EigenCloud": native ETH restaking and EIGEN token staking switch on in self-custody cold, self-custody hot and
                   custody wallets, with AVS operators
     skAssets      "Select Your Asset": the asset list moves to Ethereum and its reward rate shows before staking
     skRewards     "View Rewards": the live ETH stake positions, their rewards accruing in real time into one total */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, reduce } = K;
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'sk-hrd');
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
  const ARW = '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  const BTN = (k, x, y, w, h, a, b) => B(x, y, w, h, 'sk-btn', `<span class="l0" data-k="${k}0">${a}</span><span class="l1" data-k="${k}1">${TICKW}${b}</span>`, k);
  const setBtn = (R, k, press, done) => { R[k].style.transform = `scale(${(1 - press * .05).toFixed(3)})`; R[k + '0'].style.opacity = cl(1 - done * 2); R[k + '1'].style.opacity = cl(done * 2 - 1); };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Secure execution: the live Timeline. Each step's node ticks in order and the rail fills between them; while Transactions is
     open, the dark panel shows its two live transactions: the restaking delegation waits for and receives BitGo's signature, then
     the delegation is sent. Activation runs, and the positions are earning. */
  UI.skTimeline = el => {
    const ST = [['Pending Admin Approval', 'Your stake requires admin approval'], ['Transactions', 'Staked amount assigned to validators'], ['Activation Period', 'Validators become active'], ['Positions', 'Positions are active and earning rewards']], SY = i => 82 + i * 80;
    const tl = B(0, 0, 330, 404, 'u-p',
      T(24, 34, 'Timeline', 15, { w: 600, c: 'k' }) + PILL('pill', 'Pending', 'Earning', 24, 21) + hr(24, 56, 282) +
      ST.slice(0, 3).map((_, i) => B(33, SY(i) + 22, 2, 58, 'sk-rail', `<i data-k="rl${i}"></i>`)).join('') +
      ST.map(([n, sub], i) => CK('s' + i, 24, SY(i), 20) + T(58, SY(i) + 8, n, 13.5, { w: 600, c: 'k', k: 'sn' + i }) + T(58, SY(i) + 26, sub, 12, { c: 'm' })).join(''));
    const TX = [['Restaking: Delegate 92 ETH', 'Awaiting BitGo Signature', 'Signed by BitGo'], ['Delegate 92 ETH', 'Awaiting restaking transaction', 'Sent to the network']];
    const tx = B(298, 120, 274, 170, 'u-p dk',
      T(22, 28, 'Transactions', 12, { w: 600, c: 'dm' }) + T(252, 28, 'ETH', 12, { w: 600, c: 'dm', al: 'r' }) + HRD(22, 46, 230) +
      TX.map(([n, a, b], i) => { const y = 60 + i * 52;
        return B(22, y + 4, 28, 28, 'sk-ic', ARW, 'ic' + i) + T(60, y + 10, n, 13, { w: 600, c: 'wt' }) + T(60, y + 28, a, 12, { c: 'dm', k: 'ta' + i }) + T(60, y + 28, b, 12, { c: 'sk-ok', k: 'tb' + i }) + CK('t' + i, 232, y + 9, 18); }).join(''));
    mountUI(el, 572, 404, tl + tx, (R, t) => {
      if (reduce) t = 8;
      const P = 11, tt = t % P, off = sm(9.8, 10.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off), w = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const S = [[.6, 1.0, .2], [3.9, 4.2, 1.4], [5.6, 6.0, 4.6], [6.6, 7.0, 6.4]];
      S.forEach(([a, b, s], i) => { setCk(R['s' + i], f(a, b), w(s, a), t); R['sn' + i].classList.toggle('a', tt > s && tt < b && off < .5); });
      [[1.0, 1.4], [4.2, 4.6], [6.0, 6.4]].forEach(([a, b], i) => { R['rl' + i].style.height = (f(a, b) * 100).toFixed(2) + '%'; });
      [[2.2, 2.6, 1.5], [3.2, 3.6, 2.6]].forEach(([a, b, s], i) => { const p = f(a, b); setCk(R['t' + i], p, w(s, a), t); swap(R['ta' + i], R['tb' + i], p); R['ic' + i].classList.toggle('on', tt > s && off < .5); });
      setPill(R.pill, f(6.8, 7.3), 'Pending', 'Earning');
    });
  };

  /* Enterprise-grade validators: the live validator partners. Each in turn goes through due diligence in the dark panel (security,
     resiliency, slashing risk); its row ticks and the review count fills. */
  UI.skValidators = el => {
    const V = [['BD', 'Blockdaemon'], ['KI', 'Kiln'], ['CO', 'Chorus One'], ['FI', 'Figment']], W0 = [.6, 2.0, 3.4, 4.8];
    const card = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Validator Partners', 15, { w: 600, c: 'k' }) + PILL('pill', 'Reviewing', 'Approved', 24, 21) + hr(24, 56, 292) +
      V.map(([a, n], i) => { const y = 92 + i * 52; return B(25, y - 15, 30, 30, 'av', a, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, 'Due diligence', 12, { c: 'm', k: 'va' + i }) + T(64, y + 9, 'Approved for delegation', 12, { c: 'a', k: 'vb' + i }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      T(24, 308, 'Reviewed', 12, { c: 'm' }) + B(96, 305, 150, 6, 'bar', '<i data-k="barf"></i>') + T(304, 308, '0 of 4', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const CH = [['Security', 'Reviewed'], ['Resiliency', 'Reviewed'], ['Slashing risk', 'Minimized']];
    const dd = B(316, 180, 254, 212, 'u-p dk',
      T(22, 28, 'Due diligence', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Blockdaemon', 12, { w: 600, c: 'wt', al: 'r', k: 'un' }) + HRD(22, 46, 210) +
      CH.map(([n, v], j) => { const y = 72 + j * 36; return T(22, y, n, 12.5, { c: 'dm' }) + T(196, y, v, 12.5, { w: 600, c: 'sk-ok', al: 'r', k: 'v' + j }) + CK('k' + j, 214, y - 8, 16) + (j < 2 ? HRD(22, y + 18, 210) : ''); }).join('') +
      RESP('rs', 22, 172, 168, 'Validators approved'));
    mountUI(el, 570, 400, card + dd, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.8, 9.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let cnt = 0;
      V.forEach((_, i) => { const s = W0[i], p = f(s + 1.05, s + 1.35), wt = sm(s - .1, s + .1, tt) * (1 - sm(s + .95, s + 1.05, tt)) * (1 - off);
        setCk(R['c' + i], p, wt, t); R['av' + i].classList.toggle('on', p > .5 || wt > .5); swap(R['va' + i], R['vb' + i], p); cnt += p; });
      const u = tt < W0[1] - .05 ? 0 : tt < W0[2] - .05 ? 1 : tt < W0[3] - .05 ? 2 : 3, loc = tt - W0[u], out = u < 3 ? sm(1.3, 1.45, loc) : 0;
      setTx(R.un, V[u][1]);
      CH.forEach((_, j) => { const a = sm(.1 + .28 * j, .3 + .28 * j, loc) * (1 - out) * (1 - off); R['v' + j].style.opacity = a; setCk(R['k' + j], a, 0, t); });
      R.barf.style.width = (cnt / 4 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(cnt + .5)} of 4`);
      setPill(R.pill, f(6.3, 6.8), 'Reviewing', 'Approved'); setResp(R, 'rs', f(6.2, 6.6), t);
    });
  };

  /* Babylon: BTC is staked from the client's BitGo wallet. On the dark panel the Bitcoin Timechain keeps adding blocks and the
     staked BTC sits locked on it (it never leaves the Bitcoin network) while the proof-of-stake networks it secures light up. */
  UI.skBabylon = el => {
    const card = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Stake · Babylon', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Staked', 24, 21) +
      T(24, 80, '5.00 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'From Treasury · BitGo wallet', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      [['Locked on Bitcoin', 'Never leaves the Bitcoin network'], ['Ownership', 'Full ownership kept'], ['Custody', 'Stays in your BitGo wallet']].map(([n, sub], i) => { const y = 166 + i * 46; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join(''));
    const blk = [0, 1, 2, 3, 4, 5].map(i => `<i class="sk-blk" data-k="bk${i}" style="left:${22 + i * 36}px;top:62px"></i>`).join('');
    const net = B(316, 190, 254, 196, 'u-p dk',
      T(22, 28, 'Bitcoin Timechain', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Finality', 12, { c: 'dm', al: 'r' }) + blk +
      `<span class="sk-lk" data-k="lk" style="left:${22 + 3 * 36 + 4}px;top:44px">${LOCK}</span>` + HRD(22, 112, 210) +
      T(22, 136, 'Securing proof-of-stake networks', 12, { c: 'dm' }) +
      [0, 1, 2].map(i => `<i class="sk-pos" data-k="ps${i}" style="left:${22 + i * 24}px;top:156px"></i>`).join('') + T(232, 163, 'Earning', 12, { w: 600, c: 'sk-ok', al: 'r', k: 'ea' }));
    mountUI(el, 570, 400, card + net, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const st = f(.8, 1.2); setPill(R.pill, st, 'Pending', 'Staked');
      [[1.3, 1.6], [1.8, 2.1], [2.3, 2.6]].forEach(([a, b], i) => setCk(R['c' + i], f(a, b), 0, t));
      for (let i = 0; i < 6; i++) { const on = reduce ? 1 : sm(.2 + i * .45, .45 + i * .45, tt) * (1 - off); R['bk' + i].style.opacity = (.25 + .75 * on).toFixed(3); R['bk' + i].classList.toggle('on', i === 3 && st > .5); }
      const lk = f(1.2, 1.6); R.lk.style.opacity = lk; R.lk.style.transform = `translateY(${((1 - pop(lk)) * -8).toFixed(2)}px)`;
      [0, 1, 2].forEach(i => R['ps' + i].classList.toggle('on', f(2.8 + i * .3, 3.0 + i * .3) > .5));
      R.ea.style.opacity = f(3.6, 4.0);
    });
  };

  /* Core: BTC is delegated to Core's network for consensus and governance. The three conditions on the live card tick: no token
     wrapping, no cross-chain bridge, network participation on. */
  UI.skCore = el => {
    const RW = [['Token wrapping', 'None'], ['Cross-chain bridge', 'None'], ['Network participation', 'Consensus · governance']];
    const card = B(0, 0, 430, 372, 'u-p',
      T(24, 34, 'Delegate BTC · Core', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Delegated', 24, 21) +
      T(24, 80, '2.50 BTC', 32, { w: 600, c: 'k' }) + T(24, 108, 'Secured by proof-of-work and delegated staking', 12.5, { c: 'm' }) + hr(24, 130, 382) +
      RW.map(([n, v], i) => B(16, 144 + i * 56, 398, 48, 'sk-row', T(16, 16, n, 13.5, { w: 600, c: 'k' }) + T(16, 33, v, 12, { c: 'm' }) + CK('c' + i, 362, 14, 20), 'r' + i)).join('') +
      BTN('btn', 24, 316, 382, 40, 'Delegate', 'Delegated'));
    mountUI(el, 430, 372, card, (R, t) => {
      if (reduce) t = 7;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      RW.forEach((_, i) => { const a = .6 + i * .55, p = f(a, a + .35); setCk(R['c' + i], p, 0, t); R['r' + i].classList.toggle('act', tt > a - .2 && tt < a + .5 && off < .5); });
      const press = sm(2.6, 2.75, tt) * (1 - sm(2.75, 2.95, tt)), done = f(2.95, 3.3);
      setBtn(R, 'btn', press, done); setPill(R.pill, f(3.1, 3.6), 'Pending', 'Delegated');
    });
  };

  /* EigenCloud: one switch per wallet. Self-custody cold, self-custody hot and custody wallets are picked in turn; in each, native
     ETH restaking and EIGEN token staking tick on, and the dark panel shows AVS operators securing them. */
  UI.skRestake = el => {
    const WL = [['Self-custody cold', LOCK], ['Self-custody hot', '<i class="sk-hot"></i>'], ['Custody', '<svg viewBox="0 0 24 24"><path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18M12 3l9 5H3z"/></svg>']];
    const card = B(0, 14, 340, 312, 'u-p',
      T(24, 34, 'Restaking · EigenLayer', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Pending', 'Restaked', 24, 21) +
      `<div class="sk-tabs" style="left:24px;top:62px">${WL.map(([n, ic], i) => `<span data-k="tb${i}">${ic}${['Cold', 'Hot', 'Custody'][i]}</span>`).join('')}</div>` + hr(24, 104, 292) +
      [['ETH', 'Native ETH restaking'], ['EIGEN', 'EIGEN token staking']].map(([tk, n], i) => { const y = 140 + i * 54; return B(24, y - 14, 50, 28, 'chip', tk, 'ch' + i) + T(86, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(86, y + 9, 'Self-custody cold', 12, { c: 'm', k: 'wn' + i }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      hr(24, 238, 270) + T(24, 266, 'Wallets enabled', 12, { c: 'm' }) + B(124, 263, 112, 6, 'bar', '<i data-k="barf"></i>') + T(294, 266, '0 of 3', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const ops = B(316, 196, 254, 190, 'u-p dk',
      T(22, 28, 'AVS operators', 12, { w: 600, c: 'dm' }) + HRD(22, 46, 210) +
      [0, 1, 2].map(j => { const y = 60 + j * 30; return `<i class="sk-op" data-k="op${j}" style="left:22px;top:${y}px"></i>` + `<i class="sk-sk" style="left:44px;top:${y + 7}px;width:${118 - j * 18}px"></i>` + CK('o' + j, 214, y + 2, 16); }).join('') +
      RESP('rs', 22, 152, 172, 'Securing restaked ETH'));
    mountUI(el, 570, 400, card + ops, (R, t) => {
      if (reduce) t = 7.6;
      const P = 10, tt = t % P, off = sm(8.8, 9.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off), W0 = [.4, 2.0, 3.6];
      const u = tt < W0[1] - .1 ? 0 : tt < W0[2] - .1 ? 1 : 2, loc = tt - W0[u], out = u < 2 ? sm(1.45, 1.6, loc) : 0;
      WL.forEach((_, i) => R['tb' + i].classList.toggle('sel', i === u));
      [0, 1].forEach(j => { setTx(R['wn' + j], WL[u][0]); const p = sm(.3 + j * .35, .6 + j * .35, loc) * (1 - out) * (1 - off); setCk(R['c' + j], p, 0, t); R['ch' + j].classList.toggle('on', p > .5); });
      let n = 0; W0.forEach(s => { n += f(s + 1.0, s + 1.2); });
      R.barf.style.width = (n / 3 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(n + .5)} of 3`);
      [0, 1, 2].forEach(j => { const p = f(1.0 + j * .4, 1.3 + j * .4); setCk(R['o' + j], p, 0, t); R['op' + j].classList.toggle('on', p > .5); });
      setPill(R.pill, f(5.3, 5.8), 'Pending', 'Restaked'); setResp(R, 'rs', f(5.4, 5.8), t);
    });
  };

  /* Select your asset: the highlight moves down the supported-asset list (networks named on the live page) and settles on
     Ethereum; the dark panel shows its reward rate (the 4.38% in the live positions image) with the stake button. */
  UI.skAssets = el => {
    const A = [['SOL', 'Solana'], ['AVAX', 'Avalanche'], ['ETH', 'Ethereum'], ['NEAR', 'NEAR'], ['TIA', 'Celestia']], RH = 50, Y0 = 76, SEL = 2;
    const list = B(0, 0, 300, 344, 'u-p',
      T(24, 34, 'Stake', 15, { w: 600, c: 'k' }) + T(276, 34, 'Supported assets', 12, { c: 'm', al: 'r' }) +
      `<div class="sk-search" style="left:24px;top:52px;width:252px;height:30px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><span>Search assets</span></div>` +
      B(12, Y0 + 14, 276, RH - 4, 'hl', '', 'hl') +
      A.map(([tk, n], i) => { const y = Y0 + 14 + i * RH; return B(24, y + 9, 48, 28, 'chip', tk, 'ch' + i) + T(84, y + 23, n, 14, { c: 'nm', k: 'nm' + i }) + T(276, y + 23, 'View rate', 12, { c: 'm', al: 'r' }); }).join(''));
    const det = B(318, 168, 252, 196, 'u-p dk',
      T(22, 28, 'Ethereum', 12, { w: 600, c: 'dm' }) + T(230, 28, 'ETH', 12, { w: 600, c: 'dm', al: 'r' }) + HRD(22, 46, 208) +
      T(22, 68, 'Reward rate', 12, { c: 'dm' }) + T(22, 98, '4.38%', 30, { w: 600, c: 'wt', k: 'rt' }) +
      BTN('btn', 22, 132, 208, 42, 'Stake ETH', 'Selected'));
    mountUI(el, 570, 384, list + det, (R, t) => {
      if (reduce) t = 7;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const pos = SEL * sm(.5, 2.1, tt) * (1 - off);
      R.hl.style.transform = `translateY(${(pos * RH).toFixed(2)}px)`;
      A.forEach((_, i) => { const on = Math.abs(pos - i) < .5; R['ch' + i].classList.toggle('on', on); R['nm' + i].classList.toggle('sel', on); });
      const d = f(2.2, 2.6); R.rt.style.opacity = d; R.rt.style.transform = `translateY(${((1 - d) * 6).toFixed(2)}px)`;
      const press = sm(3.4, 3.55, tt) * (1 - sm(3.55, 3.75, tt)); setBtn(R, 'btn', press, f(3.75, 4.1));
    });
  };

  /* View rewards: the live "ETH Stake Positions" table (three 32 ETH positions, two Active and one Restaked) with its rewards
     accruing in real time; the dark panel keeps the running total of all of them in one place. */
  UI.skRewards = el => {
    const PS = [[0.0012446, 2.97, 'Active'], [1.34776, 3214.13, 'Active'], [0.234567, 559.39, 'Restaked']], TOT = PS.reduce((s, p) => s + p[0], 0), USD = PS.reduce((s, p) => s + p[1], 0);
    const tab = B(0, 0, 440, 246, 'u-p',
      T(24, 34, 'ETH Stake Positions', 15, { w: 600, c: 'k' }) + '<div class="tabs"><span class="sel">All</span><span>Active</span><span>Restaked</span></div>' + hr(24, 56, 392) +
      [['Staked', 24], ['Rewards', 150], ['Rate', 292], ['Status', 344]].map(([h, x]) => T(x, 76, h, 11.5, { w: 600, c: 'm' })).join('') +
      PS.map(([r, u, s], i) => { const y = 96 + i * 48;
        return T(24, y + 12, '32 ETH', 13.5, { w: 600, c: 'k' }) + T(24, y + 29, '$76,313.50 USD', 11.5, { c: 'm' }) +
          T(150, y + 12, '', 13.5, { w: 600, c: 'k', k: 'r' + i }) + T(150, y + 29, '', 11.5, { c: 'm', k: 'u' + i }) +
          T(292, y + 12, '4.38%', 13, { w: 600, c: 'a' }) + `<span class="sk-st${s === 'Restaked' ? ' rs' : ''}" style="left:344px;top:${y + 3}px">${s}</span>`; }).join(''));
    const tot = B(286, 236, 284, 160, 'u-p dk',
      T(22, 28, 'Total rewards', 12, { w: 600, c: 'dm' }) + `<span class="sk-live" style="right:22px;top:20px"><i></i>Live</span>` + HRD(22, 46, 240) +
      T(22, 80, '', 26, { w: 600, c: 'wt', k: 'tt' }) + T(22, 108, '', 12.5, { c: 'dm', k: 'tu' }) +
      `<svg class="sk-spark" style="left:22px;top:124px" width="240" height="24" viewBox="0 0 240 24"><path data-k="sp" pathLength="1" d="M0 22L40 20L80 17L120 15L160 11L200 7L240 2"/></svg>`);
    mountUI(el, 570, 396, tab + tot, (R, t) => {
      if (reduce) t = 6.5;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), acc = sm(.3, 6.5, tt) * (1 - off), g = .985 + .015 * acc;
      PS.forEach(([r, u], i) => { setTx(R['r' + i], fmt(r * g, [7, 5, 6][i]) + ' ETH'); setTx(R['u' + i], '$' + fmt(u * g, 2) + ' USD'); });
      setTx(R.tt, fmt(TOT * g, 7) + ' ETH'); setTx(R.tu, '$' + fmt(USD * g, 2) + ' USD');
      R.sp.style.strokeDashoffset = (1 - sm(.3, 6.5, tt) * (1 - off)).toFixed(4);
    });
  };
})();
