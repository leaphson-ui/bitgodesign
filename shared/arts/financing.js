/* Financing UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / scCompliance / goNetwork: white product panels, Inter Tight, BitGo blue, a short eased loop that ends on a
   complete still frame. Every figure is from the live page's own images. Styles: financing.css.
     fiLoan       "Bitcoin and Crypto-Backed Loans": 6 BTC and 120 staked ETH pledged, 250,000 USDC drawn at a 28.84% loan-to-value
     fiPortfolio  "Portfolio-Based Financing": the holdings in a Go Account are checked one by one and each adds to one
                  borrowing power across the portfolio (live: 3,420,715.13 USD)
     fiEarn       "Earn Income and Rewards": USDC lent earns interest and staked ETH earns rewards, both held in BitGo custody */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };   // old label out before the new one comes in

  /* Bitcoin and crypto-backed loans: liquidity without liquidation. 6 BTC and 120 staked ETH are pledged (the ETH stays staked),
     the collateral value builds, and 250,000 USDC is drawn at the live loan-to-value: 250,000 / 866,858.40 = 28.84%. */
  UI.fiLoan = el => {
    const LOAN = 250000, CV = 866858.40, LTV = LOAN / CV * 100;
    const card = B(0, 0, 360, 318, 'u-p',
      T(24, 34, 'Loan', 12.5, { w: 600, c: 'm' }) + `<div class="pill" data-k="pill" style="right:24px;top:21px;height:26px;width:76px"><i class="b0"></i><i class="b1"></i><span class="l0 m">Pending</span><span class="l1 a">${TICK}Drawn</span></div>` +
      T(24, 80, '250,000 USDC', 32, { w: 600, c: 'k' }) + T(24, 108, 'drawn against 6 BTC and 120 staked ETH', 12.5, { c: 'm' }) + hr(24, 130, 312) +
      [['Collateral', '6 BTC'], ['Staked collateral', '120 ETH']].map(([n, v], i) => { const y = 156 + i * 36; return T(24, y, n, 12.5, { c: 'm' }) + T(300, y, v, 13.5, { w: 600, c: 'k', al: 'r' }) + CK('c' + i, 314, y - 11, 22) + hr(24, y + 18, 312); }).join('') +
      T(24, 228, 'Collateral value', 12.5, { c: 'm' }) + T(336, 228, '0.00 USD', 13.5, { w: 600, c: 'k', al: 'r', k: 'cv' }) + hr(24, 246, 312) +
      T(24, 270, 'Loan-to-value', 13.5, { w: 600, c: 'k' }) + T(336, 270, '0.00%', 13.5, { w: 600, c: 'k', al: 'r', k: 'ltv' }) +
      B(24, 290, 312, 8, 'bar', '<i data-k="barf"></i>'));
    const hold = B(300, 300, 260, 150, 'u-p dk',
      T(22, 28, 'Holdings', 12, { w: 600, c: 'dm' }) + T(238, 28, 'Not sold', 12, { w: 600, c: 'fl-ok', al: 'r', k: 'ns' }) + B(22, 46, 216, 1, 'fl-hrd') +
      [['BTC', '6.00', 'Held in custody', 'Pledged'], ['ETH', '120.00', 'Staked', 'Staked · pledged']].map(([tk, q, a, b], i) => { const y = 58 + i * 46;
        return B(22, y, 40, 26, 'fl-tok', tk) + T(72, y + 4, tk, 13.5, { w: 600, c: 'wt' }) + T(72, y + 21, a, 12, { c: 'dm', k: 'ha' + i }) + T(72, y + 21, b, 12, { c: 'fl-ok', k: 'hb' + i }) + T(238, y + 12, q, 13.5, { w: 600, c: 'wt', al: 'r' }); }).join(''));
    mountUI(el, 560, 450, card + hold, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .9, a - .7, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      const p0 = f(.9, 1.4), p1 = f(1.9, 2.4);
      setCk(R.c0, p0, wait(.9, 1.4), t); setCk(R.c1, p1, wait(1.9, 2.4), t); swap(R.ha0, R.hb0, p0); swap(R.ha1, R.hb1, p1);
      setTx(R.cv, fmt(CV * f(1.0, 2.8)) + ' USD');
      const lv = f(3.1, 4.1); R.barf.style.width = (lv * LTV).toFixed(2) + '%'; setTx(R.ltv, (lv * LTV).toFixed(2) + '%');
      const ok = f(4.4, 4.9), pl = R.pill; pl.style.width = (76 + 4 * ok).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - ok; pl.children[2].style.opacity = 1 - ok; pl.children[1].style.opacity = ok; pl.children[3].style.opacity = ok;
      R.ns.style.opacity = .35 + .65 * ok;
    });
  };

  /* Portfolio-based financing: not just one asset. Each holding is checked and marked Eligible in turn, and the borrowing
     power at the foot grows across the whole account to the live figure. */
  UI.fiPortfolio = el => {
    const rows = [['BTC', 'Bitcoin', '22.4 BTC', 1825877.76], ['ETH', 'Ether', '312.5 ETH', 983812.50], ['SOL', 'Solana', '8,400 SOL', 1531740.00], ['USDC', 'USD Coin', '2,500,000 USDC', 2500000.00]];
    const BP = 3420715.13, TOT = rows.reduce((s, r) => s + r[3], 0), RH = 58, Y0 = 62;
    const card = B(0, 0, 460, 360, 'u-p',
      T(24, 34, 'Go Account', 14, { w: 600, c: 'k' }) + T(436, 34, 'Portfolio', 12.5, { c: 'm', al: 'r' }) + hr(24, 56, 412) +
      B(12, Y0 + 3, 436, RH - 6, 'hl', '', 'hl') +
      rows.map(([tk, n, amt, v], i) => { const y = Y0 + i * RH;
        return B(24, y + 15, 44, 28, 'chip', tk, 'ch' + i) + T(80, y + 21, n, 14, { w: 600, c: 'k' }) + T(80, y + 39, amt, 12, { c: 'm' }) +
          T(436, y + 21, fmt(v) + ' USD', 13.5, { w: 600, c: 'k', al: 'r' }) + T(436, y + 39, 'In account', 12, { c: 'm', al: 'r', k: 'ea' + i }) + T(436, y + 39, `${TICK} Eligible`, 12, { w: 600, c: 'a', al: 'r', k: 'eb' + i }); }).join('') +
      hr(24, Y0 + 4 * RH + 6, 412) + T(24, 330, 'Borrowing power', 12.5, { c: 'm' }) + T(436, 330, '0.00 USD', 20, { w: 600, c: 'k', al: 'r', k: 'bp' }));
    mountUI(el, 460, 360, card, (R, t) => {
      if (reduce) t = 7;
      const P = 10, tt = t % P, off = sm(8.8, 9.6, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let pos = 0, w = 0;
      rows.forEach((r, i) => {
        const s0 = .6 + i * 1.1, e = f(s0 + .35, s0 + .75);
        if (i) pos += sm(s0 - .35, s0, tt);
        swap(R['ea' + i], R['eb' + i], e); R['ch' + i].classList.toggle('on', e > .5); w += r[3] * e;
      });
      R.hl.style.transform = `translateY(${(pos * RH).toFixed(2)}px)`; R.hl.style.opacity = sm(.2, .5, tt) * (1 - sm(4.9, 5.4, tt)) * (1 - off);
      setTx(R.bp, fmt(BP * w / TOT) + ' USD');
    });
  };

  /* Earn income and rewards: USDC lent earns interest and staked ETH earns rewards; both figures accrue to the live amounts,
     and the foot confirms the assets stay held in BitGo custody. */
  UI.fiEarn = el => {
    const rows = [['USDC', 'USD Coin', 'Lent · 1,000,000 USDC', 12480, 120, 2, 'USDC', 'Interest earned'], ['ETH', 'Ether', 'Staked · 120 ETH', 3.84, .12, 2, 'ETH', 'Rewards earned']];
    const card = B(0, 0, 460, 262, 'u-p',
      T(24, 34, 'Earn', 14, { w: 600, c: 'k' }) + '<div class="tabs"><span class="sel">All</span><span>Lending</span><span>Staking</span></div>' + hr(24, 56, 412) +
      rows.map(([tk, n, sub, , , , u, lab], i) => { const y = 66 + i * 70;
        return B(24, y + 19, 44, 28, 'chip on', tk) + T(80, y + 25, n, 14, { w: 600, c: 'k' }) + T(80, y + 43, sub, 12, { c: 'm' }) +
          T(436, y + 25, '', 15, { w: 600, c: 'a', al: 'r', k: 'v' + i }) + T(436, y + 43, lab, 12, { c: 'm', al: 'r' }) + (i ? '' : hr(24, y + 68, 412)); }).join('') +
      hr(24, 212, 412) + T(24, 236, 'Held in BitGo custody', 12.5, { c: 'm' }) + CK('ck', 416, 226, 20));
    mountUI(el, 460, 262, card, (R, t) => {
      if (reduce) t = 7;
      const P = 9, tt = t % P, off = sm(8.2, 8.9, tt), acc = sm(.3, 5.6, tt) * (1 - off);
      rows.forEach(([, , , end, d, dp, u], i) => setTx(R['v' + i], '+' + fmt(end - d * (1 - acc), dp) + ' ' + u));
      setCk(R.ck, sm(5.6, 6.1, tt) * (1 - off), 0, t);
    });
  };
})();
