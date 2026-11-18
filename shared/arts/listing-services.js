/* Listing Services (Asset Listings) UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same
   language as scSecurity / scApp / ecListings: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that
   ends on a complete still frame (reduced motion draws that frame). Words come from the live page (custody, wallets, trading and
   staking; exchanges, institutional counterparties and liquidity providers; self custody, qualified custody, token management; the
   supported assets shown in the live "See our full list of supported assets" image). No exchange is named and no count of assets,
   venues or holders is shown: the token amounts are an example. Styles: listing-services.css.
     lsGrow      "Grow / Share your asset in more places": the asset switches on across custody, wallets, trading and staking, and its
                 reach to exchanges, institutional counterparties and liquidity providers grows
     lsManage    "Manage / Run your entire digital asset operations": three operations run in turn (a distribution to investors, a
                 treasury stake, a move to cold storage) and each lands in the activity log
     lsTreasury  "Custody & Treasury": a foundation treasury held across self custody, qualified custody and token management; a
                 transfer moves 20,000,000 TKN from self custody into regulated qualified custody
     lsAssets    "See our full list of supported assets": a search for an asset finds it in the coins and tokens list (Supported), and
                 the asset lights in the grid of supported assets from the live image */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'ls-hrd');
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const BTN = (k, x, y, w, h, a, b) => B(x, y, w, h, 'ls-btn', `<span class="l0" data-k="${k}0">${a}</span><span class="l1" data-k="${k}1">${TICKW}${b}</span>`, k);
  const setBtn = (R, k, press, done) => { R[k].style.transform = `scale(${(1 - press * .05).toFixed(3)})`; R[k + '0'].style.opacity = cl(1 - done * 2); R[k + '1'].style.opacity = cl(done * 2 - 1); };
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Grow: the listed asset is switched on in four places on the platform, one tile at a time, and its reach to the three
     kinds of counterparty grows on the dark panel. */
  UI.lsGrow = el => {
    const PL = ['Custody', 'Wallets', 'Trading', 'Staking'];
    const tiles = PL.map((n, i) => { const x = 24 + (i % 2) * 147, y = 124 + Math.floor(i / 2) * 82;
      return B(x, y, 135, 70, 'ls-tile', T(16, 26, n, 13.5, { w: 600, c: 'k' }) + T(16, 46, 'Off', 12, { c: 'm', k: 'sa' + i }) + T(16, 46, 'Available', 12, { w: 600, c: 'a', k: 'sb' + i }) + CK('c' + i, 101, 16, 18), 'tl' + i); }).join('');
    const card = B(0, 10, 330, 300, 'u-p',
      T(24, 34, 'Availability', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Activating', 'Available', 24, 21) +
      B(24, 52, 40, 40, 'ls-tk', 'TKN') + T(76, 64, 'Your asset', 15, { w: 600, c: 'k' }) + T(76, 84, 'Listed on BitGo', 12, { c: 'm' }) + hr(24, 110, 282) + tiles);
    const RC = [['Exchanges', .8], ['Institutional counterparties', .8], ['Liquidity providers', .8]];   // equal fills: the page gives no figures
    const reach = B(306, 196, 264, 192, 'u-p dk',
      T(22, 28, 'Reach', 12, { w: 600, c: 'dm' }) + T(242, 28, 'Growing', 12, { w: 600, c: 'ls-ok', al: 'r' }) + HRD(22, 46, 220) +
      RC.map(([n], j) => { const y = 72 + j * 42; return T(22, y, n, 12.5, { w: 600, c: 'wt' }) + B(22, y + 15, 220, 5, 'ls-db', `<i data-k="db${j}"></i>`); }).join(''));
    mountUI(el, 570, 400, card + reach, (R, t) => {
      if (reduce) t = 7;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .1, a, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      PL.forEach((_, i) => { const a = .6 + i * .6, p = f(a + .35, a + .6); setCk(R['c' + i], p, wait(a, a + .35), t); swap(R['sa' + i], R['sb' + i], p); R['tl' + i].classList.toggle('on', p > .5); });
      RC.forEach(([, w], j) => { R['db' + j].style.width = (f(1.2 + j * .45, 3.8 + j * .35) * w * 100).toFixed(2) + '%'; });
      setPill(R.pill, f(3.3, 3.8), 'Activating', 'Available');
    });
  };

  /* Manage: an operations panel runs three jobs in turn (each bar fills, then ticks) and each finished job is logged on the dark
     activity panel. */
  UI.lsManage = el => {
    const OP = [['Distribute to investors', 'Token management · 48 wallets', 'Distribution complete'], ['Stake treasury', 'Staking · validator of choice', 'Stake delegated'], ['Move to cold storage', 'Wallets · Treasury', 'Moved to cold storage']];
    const S0 = [.5, 2.0, 3.5];
    const card = B(0, 10, 330, 318, 'u-p',
      T(24, 34, 'Operations', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'In progress', 'Complete', 24, 21) +
      OP.map(([n, sub], i) => B(16, 56 + i * 84, 298, 72, 'ls-row', T(16, 22, n, 13.5, { w: 600, c: 'k' }) + T(16, 40, sub, 12, { c: 'm' }) +
        B(16, 57, 206, 5, 'bar', `<i data-k="b${i}"></i>`) + T(282, 59, '0%', 12, { w: 600, c: 'k', al: 'r', k: 'pc' + i }) + CK('c' + i, 262, 18, 20), 'rw' + i)).join(''));
    const log = B(316, 222, 254, 168, 'u-p dk',
      T(22, 28, 'Activity', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Live', 12, { w: 600, c: 'ls-ok', al: 'r' }) + HRD(22, 46, 210) +
      OP.map(([, , done], j) => { const y = 72 + j * 34; return B(0, y - 14, 254, 28, 'ls-le', CK('a' + j, 22, 6, 16) + T(48, 14, done, 12.5, { w: 600, c: 'wt' }) + T(232, 14, 'Now', 12, { c: 'dm', al: 'r' }), 'e' + j); }).join(''));
    mountUI(el, 570, 400, card + log, (R, t) => {
      if (reduce) t = 6.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      OP.forEach((_, i) => {
        const s = S0[i], run = f(s, s + 1.1), ok = f(s + 1.15, s + 1.4);
        R['b' + i].style.width = (run * 100).toFixed(2) + '%'; setTx(R['pc' + i], Math.round(run * 100) + '%');
        setCk(R['c' + i], ok, 0, t); R['rw' + i].classList.toggle('act', tt > s && ok < .9 && off < .5);
        const e = f(s + 1.25, s + 1.6); R['e' + i].style.opacity = e; R['e' + i].style.transform = `translateY(${((1 - e) * 8).toFixed(2)}px)`; setCk(R['a' + i], e, 0, t);
      });
      setPill(R.pill, f(5.1, 5.6), 'In progress', 'Complete');
    });
  };

  /* Custody & Treasury: a foundation treasury of 120,000,000 TKN held across self custody, qualified custody and token management.
     A transfer of 20,000,000 TKN from self custody into qualified custody is confirmed, and the two balances update
     (80,000,000 -> 60,000,000; 30,000,000 -> 50,000,000; the total stays 120,000,000). */
  UI.lsTreasury = el => {
    const W = [['S', 'Self custody', 'Operations · hot and cold', 80e6], ['Q', 'Qualified custody', 'Regulated custody', 30e6], ['T', 'Token management', 'Vesting grants', 10e6]];
    const card = B(0, 14, 340, 318, 'u-p',
      T(24, 34, 'Foundation treasury', 12.5, { w: 600, c: 'm' }) + T(300, 34, 'TKN', 12.5, { w: 600, c: 'a', al: 'r' }) +
      T(24, 80, '120,000,000', 32, { w: 600, c: 'k' }) + T(24, 108, 'Across self custody and qualified custody', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      W.map(([a, n, sub, v], i) => { const y = 160 + i * 54; return B(24, y - 15, 30, 30, 'av', a, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, sub, 12, { c: 'm' }) +
        T(300, y, fmt(v), 13.5, { w: 600, c: 'k', al: 'r', k: 'v' + i }) + (i < 2 ? hr(24, y + 27, 292) : ''); }).join(''));
    const TR = [['From', 'Self custody'], ['To', 'Qualified custody'], ['Amount', '20,000,000 TKN']];
    const xfer = B(320, 196, 250, 206, 'u-p dk',
      T(22, 28, 'Transfer', 12, { w: 600, c: 'dm' }) + HRD(22, 46, 206) +
      TR.map(([n, v], j) => { const y = 68 + j * 30; return T(22, y, n, 12.5, { c: 'dm', k: 'tn' + j }) + T(228, y, v, 12.5, { w: 600, c: 'wt', al: 'r', k: 'tv' + j }); }).join('') +
      BTN('btn', 22, 150, 206, 40, 'Confirm transfer', 'Moved to custody'));
    mountUI(el, 570, 414, card + xfer, (R, t) => {
      if (reduce) t = 7;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      TR.forEach((_, j) => { const a = f(.3 + j * .2, .6 + j * .2); R['tn' + j].style.opacity = R['tv' + j].style.opacity = a; R['tv' + j].style.transform = `translateX(${((1 - a) * 6).toFixed(2)}px)`; });
      const press = sm(1.7, 1.85, tt) * (1 - sm(1.85, 2.05, tt)), done = f(2.05, 2.4); setBtn(R, 'btn', press, done);
      const mv = f(2.3, 3.5); setTx(R.v0, fmt(80e6 - 20e6 * mv)); setTx(R.v1, fmt(30e6 + 20e6 * mv));
      R.av0.classList.toggle('on', tt > 2.2 && tt < 3.6 && off < .5); R.av1.classList.toggle('on', tt > 2.2 && off < .5);
    });
  };

  /* Supported assets: a search for "Sol" filters the coins and tokens list down to Solana (Supported), and Solana lights in the
     grid of the nine assets the live image shows. */
  UI.lsAssets = el => {
    const A = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['XRP', 'XRP'], ['AVAX', 'Avalanche'], ['SOL', 'Solana'], ['ADA', 'Cardano'], ['SUI', 'Sui'], ['TRX', 'TRON'], ['AAVE', 'Aave']];
    const HIT = 4, Q = 'Sol', RH = 48;
    const rows = A.map(([tk, n], i) => `<div class="wr" data-k="r${i}" style="width:308px;height:${RH}px">` + B(0, 0, 308, 42, 'ls-ar', B(10, 6, 30, 30, 'av', tk.slice(0, 2), 'ra' + i) + T(52, 14, n, 13.5, { w: 600, c: 'k' }) + T(52, 31, tk, 12, { c: 'm' }) +
      `<span class="ls-sup" style="right:10px;top:10px">${TICK}Supported</span>`, 'rc' + i) + '</div>').join('');
    const card = B(0, 10, 340, 352, 'u-p',
      T(24, 34, 'Coins and tokens', 12.5, { w: 600, c: 'm' }) +
      B(24, 52, 292, 40, 'ls-srch', '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>' + T(40, 20, 'Search assets', 13.5, { c: 'm', k: 'ph' }) + T(40, 20, '<b data-k="q"></b><i class="ls-cr" data-k="cr"></i>', 13.5, { w: 500, c: 'k' })) +
      B(16, 104, 308, 240, 'ls-clip', rows));
    const G = [[3, 'AV'], [5, 'AD'], [8, 'AA'], [1, 'ET'], [0, 'BT'], [4, 'SO'], [6, 'SU'], [2, 'XR'], [7, 'TR']];   // the live image's grid order
    const grid = B(322, 172, 248, 220, 'u-p dk',
      T(22, 28, 'Supported assets', 12, { w: 600, c: 'dm' }) + HRD(22, 46, 204) +
      G.map(([i, c], k) => B(30 + (k % 3) * 66, 62 + Math.floor(k / 3) * 50, 40, 40, 'ls-gc', c, 'g' + i)).join(''));
    mountUI(el, 580, 400, card + grid, (R, t) => {
      if (reduce) t = 6.5;
      const P = 9, tt = t % P, off = sm(7.8, 8.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const n = Math.floor(Q.length * cl((tt - .7) / 1.1) * (1 - off) + 1e-6); setTx(R.q, Q.slice(0, n)); R.ph.style.opacity = n ? 0 : 1;
      R.cr.style.opacity = reduce ? 0 : (Math.sin(t * 5) > -.3 ? 1 : 0) * (1 - f(2.6, 2.8));
      const fl = f(1.9, 2.7);
      A.forEach((_, i) => {
        const hit = i === HIT, y = (i - HIT * fl) * RH;
        R['r' + i].style.transform = `translateY(${y.toFixed(2)}px)`; R['r' + i].style.opacity = (cl(1 + y / RH) * (hit ? 1 : 1 - .55 * fl)).toFixed(3);
        R['g' + i].classList.toggle('on', hit ? fl > .5 : false);
      });
      R.rc4.classList.toggle('act', fl > .6); R.ra4.classList.toggle('on', fl > .6);
      A.forEach((_, i) => { if (i !== HIT) { const s = .3 + i * .12; R['g' + i].style.opacity = (.55 + .45 * f(s, s + .3) * (1 - fl)).toFixed(3); } });
    });
  };
})();
