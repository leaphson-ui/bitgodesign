/* Wealth Management UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scApp / gmFinancing / gmTools: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on a
   complete still frame (reduced motion draws that frame). Facts come from the live page and its FAQ; no venues, vendors or rates
   that the page does not state. Styles: wealth-management.css.
     wmInKind        "In-Kind Transfers": a client's held-away assets (1.25 BTC from a retail crypto account, 18.00 ETH from a
                     self-custody wallet) arrive in the client's account at BitGo as the same assets, not sold.
     wmBilling       "Automated Billing / Directly bill from your client accounts": a quarterly advisory fee run debits each
                     client account: 3,100 + 2,150 + 6,000 = 11,250.00 USD. No rate is shown (the page states none).
     wmReporting     "Reporting / Streamline your profit-and-loss reporting": the P&L chart draws and the account value moves from
                     2,480,000.00 to 2,640,820.00 (+160,820.00), and the report is ready. No formats and no realized/unrealized
                     split (the FAQ says formats are set during implementation and cost basis reporting is being enabled).
     wmIntegrations  "Integrations / Connect to external portfolio management and reporting systems": both systems are switched
                     on and positions, transactions and balances sync to them. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'wm-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const ICON = {
    exch: '<svg viewBox="0 0 24 24"><path d="M4 9.5L12 4l8 5.5M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3.5 20h17"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="13" rx="2.6"/><path d="M15.5 12.5h5M6.5 6l9-2.5"/><circle cx="16.4" cy="12.5" r=".9"/></svg>',
    pm: '<svg viewBox="0 0 24 24"><path d="M4 19.5V5M4 19.5h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6"/></svg>',
    rep: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15h6M9.5 18h4"/></svg>'
  };

  /* In-kind transfers: two held-away sources on the left, the client's account at BitGo on the right. Each asset travels
     across as itself (the amount on the moving chip is the amount that lands), and the source row ticks when it arrives. */
  UI.wmInKind = el => {
    const S = [['exch', 'Retail crypto account', 'BTC', 1.25, 'B'], ['wallet', 'Self-custody wallet', 'ETH', 18, 'E']];
    const src = B(0, 10, 300, 270, 'u-p',
      T(24, 34, 'Transfer in', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'In transit', 'Received', 24, 21) +
      T(24, 80, 'Held-away assets', 24, { w: 600, c: 'k' }) + T(24, 106, 'Moved in kind · not sold', 12.5, { c: 'm' }) + hr(24, 126, 252) +
      S.map(([ic, n, tk, q], i) => B(16, 140 + i * 60, 268, 52, 'wm-row', B(12, 10, 32, 32, 'wm-ki', ICON[ic]) + T(56, 19, n, 13.5, { w: 600, c: 'k' }) + T(56, 36, fmt(q) + ' ' + tk, 12, { c: 'm' }) + CK('c' + i, 232, 16, 20), 'r' + i)).join(''));
    const dst = B(340, 52, 250, 214, 'u-p dk',
      T(22, 28, 'Client account', 12, { w: 600, c: 'dm' }) + T(228, 28, 'BitGo custody', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 206) +
      S.map(([, , tk, q, ch], i) => { const y = 58 + i * 54;
        return B(22, y, 30, 30, 'wm-tok', ch) + T(62, y + 7, tk, 13.5, { w: 600, c: 'wt' }) + T(62, y + 24, 'Awaiting', 12, { c: 'dm', k: 'sa' + i }) + T(62, y + 24, 'Received in kind', 12, { c: 'wm-ok', k: 'sb' + i }) +
          T(228, y + 15, '0.00', 13.5, { w: 600, c: 'wt', al: 'r', k: 'q' + i }) + (i ? '' : HRD(22, y + 42, 206)); }).join('') +
      RESP('rs', 22, 174, 160, 'Transferred in kind'));
    const lines = `<svg class="wm-ln" width="590" height="290" viewBox="0 0 590 290">${[[176, 125], [236, 179]].map(([y0, y1], i) => { const d = `M284 ${y0}C314 ${y0} 312 ${y1} 340 ${y1}`; return `<path class="bs" id="wmp${i}" d="${d}"/><path class="pg" data-k="pg${i}" pathLength="1" d="${d}"/>`; }).join('')}</svg>`;
    const mv = S.map(([, , tk, q], i) => `<div class="wm-mv" data-k="mv${i}"><span>${fmt(q)} ${tk}</span></div>`).join('');
    mountUI(el, 590, 290, lines + src + dst + mv, (R, t) => {
      if (reduce) t = 7.5;
      const tt = t % 9, off = sm(8.2, 8.9, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let all = 0;
      S.forEach(([, , , q], i) => {
        const s0 = .6 + i * 1.6, go = sm(s0 + .3, s0 + 1.3, tt), land = f(s0 + 1.2, s0 + 1.5);
        R['r' + i].classList.toggle('act', tt > s0 && tt < s0 + 1.5 && off < .5);
        R['pg' + i].style.strokeDashoffset = (1 - f(s0 + .3, s0 + 1.3)).toFixed(4);
        const P = R['mv' + i].__p || (R['mv' + i].__p = el.querySelector('#wmp' + i)), pt = P.getPointAtLength(P.getTotalLength() * go);
        R['mv' + i].style.transform = `translate(${pt.x.toFixed(2)}px,${pt.y.toFixed(2)}px) translate(-50%,-50%)`;
        R['mv' + i].style.opacity = sm(s0 + .2, s0 + .4, tt) * (1 - sm(s0 + 1.2, s0 + 1.4, tt)) * (1 - off);
        setCk(R['c' + i], land, 0, t); swap(R['sa' + i], R['sb' + i], land); setTx(R['q' + i], fmt(q * land)); all += land;
      });
      setPill(R.pill, f(3.9, 4.4), 'In transit', 'Received'); setResp(R, 'rs', f(4.2, 4.6), t);
    });
  };

  /* Automated billing: the quarter's advisory fee is debited from each client account in turn; the collected total and the
     count build, and the run flips to Billed. */
  UI.wmBilling = el => {
    const A = [['0142', 1240000], ['0187', 860000], ['0203', 2400000]], RATE = .0025, TOT = A.reduce((s, a) => s + a[1] * RATE, 0);
    const run = B(0, 14, 340, 330, 'u-p',
      T(24, 34, 'Advisory fee run', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Scheduled', 'Billed', 24, 21) +
      T(24, 80, '0.00 USD', 30, { w: 600, c: 'k', k: 'tot' }) + T(24, 108, 'Quarterly · debited from client accounts', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      A.map(([n, aum], i) => { const y = 140 + i * 52 + 26;
        return B(24, y - 15, 30, 30, 'av', String(i + 1), 'av' + i) + T(64, y - 8, 'Account ' + n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, 'Assets ' + fmt(aum, 0) + ' USD', 12, { c: 'm' }) +
          T(276, y - 1, fmt(aum * RATE), 13.5, { w: 600, c: 'k', al: 'r', k: 'f' + i }) + CK('c' + i, 290, y - 10, 20); }).join('') +
      T(24, 308, 'Accounts billed', 12, { c: 'm' }) + B(124, 305, 126, 6, 'bar', '<i data-k="barf"></i>') + T(304, 308, '0 of 3', 12, { w: 600, c: 'k', al: 'r', k: 'cnt' }));
    const sch = B(316, 196, 254, 196, 'u-p dk',
      T(22, 28, 'Fee schedule', 12, { w: 600, c: 'dm' }) + T(232, 28, 'Advisor set', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      [['Frequency', 'Quarterly'], ['Debited from', 'Client accounts'], ['Accounts', '3']].map(([n, v], j) => { const y = 70 + j * 30; return T(22, y, n, 12.5, { c: 'dm' }) + T(232, y, v, 12.5, { w: 600, c: 'wt', al: 'r' }); }).join('') +
      RESP('rs', 22, 154, 132, 'Fees collected'));
    mountUI(el, 570, 410, run + sch, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      let cnt = 0, sum = 0;
      A.forEach(([, aum], i) => { const s0 = 1.0 + i * 1.1, p = f(s0, s0 + .4); setCk(R['c' + i], p, wait(s0, s0 + .4), t); R['av' + i].classList.toggle('on', p > .5); R['f' + i].style.opacity = .4 + .6 * p; cnt += p; sum += aum * RATE * p; });
      setTx(R.tot, fmt(sum) + ' USD'); R.barf.style.width = (cnt / 3 * 100).toFixed(2) + '%'; setTx(R.cnt, `${Math.floor(cnt + .5)} of 3`);
      setPill(R.pill, f(4.6, 5.1), 'Scheduled', 'Billed'); setResp(R, 'rs', f(4.9, 5.3), t);
    });
  };

  /* P&L reporting: the quarter's P&L line draws, the total, realized and unrealized figures count with it, and the report file
     is generated and ready. */
  UI.wmReporting = el => {
    const OPEN = 2480000, PNL = 160820, N = 26, CW = 312, CH = 84, pts = [];
    for (let i = 0; i < N; i++) { const u = i / (N - 1), v = u * .92 + .07 * Math.sin(u * 9) + .04 * Math.sin(u * 23); pts.push([u * CW, CH - 6 - cl(v) * (CH - 14)]); }
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), area = d + `L${CW} ${CH}L0 ${CH}Z`, end = pts[N - 1];
    const chart = `<svg class="wm-ch" style="left:24px;top:124px" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
      <defs><linearGradient id="wmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1647DB" stop-opacity=".18"/><stop offset="1" stop-color="#1647DB" stop-opacity="0"/></linearGradient>
      <clipPath id="wmc"><rect data-k="clip" x="0" y="0" width="0" height="${CH}"/></clipPath></defs>
      ${[.33, .66].map(g => `<line class="gl" x1="0" x2="${CW}" y1="${(CH * g).toFixed(1)}" y2="${(CH * g).toFixed(1)}"/>`).join('')}
      <g clip-path="url(#wmc)"><path class="ar" d="${area}"/><path class="ln" d="${d}"/></g>
      <circle class="pt" data-k="pt" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="0"/></svg>`;
    const rep = B(0, 6, 360, 296, 'u-p',
      T(24, 34, 'Profit and loss', 12.5, { w: 600, c: 'm' }) + '<div class="tabs"><span class="sel">Quarter</span><span>Year</span></div>' +
      T(24, 80, '+0.00 USD', 28, { w: 600, c: 'k', k: 'tot' }) + T(24, 106, 'All client accounts · quarter to date', 12.5, { c: 'm' }) + chart + hr(24, 222, 312) +
      T(24, 246, 'Opening value', 12, { c: 'm' }) + T(24, 268, fmt(OPEN), 15, { w: 600, c: 'k' }) +
      T(170, 246, 'Value now', 12, { c: 'm' }) + T(170, 268, fmt(OPEN), 15, { w: 600, c: 'k', k: 'cv' }));
    const ex = B(300, 236, 280, 160, 'u-p dk',
      T(22, 28, 'Report', 12, { w: 600, c: 'dm' }) + T(258, 28, 'Quarter to date', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 236) +
      B(22, 58, 236, 48, 'wm-file', B(10, 9, 30, 30, 'wm-fi', ICON.rep) + T(50, 16, 'P&L report · Q3', 13, { w: 600, c: 'wt' }) + T(50, 33, 'Generating', 12, { c: 'dm', k: 'ga' }) + T(50, 33, 'Ready to download', 12, { c: 'wm-ok', k: 'gb' }), 'fr') +
      RESP('rs', 22, 122, 132, 'Report ready'));
    mountUI(el, 580, 400, rep + ex, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const dr = f(.5, 2.8); R.clip.setAttribute('width', (CW * dr).toFixed(1));
      const pp = f(2.7, 3.0); R.pt.setAttribute('r', (4.2 * pp).toFixed(2));
      setTx(R.tot, '+' + fmt(PNL * dr) + ' USD'); setTx(R.cv, fmt(OPEN + PNL * dr));
      const fr = f(3.1, 3.5); R.fr.style.opacity = .35 + .65 * fr; R.fr.classList.toggle('act', tt > 3.1 && tt < 4.4 && off < .5);
      swap(R.ga, R.gb, f(3.6, 4.1)); setResp(R, 'rs', f(4.1, 4.5), t);
    });
  };

  /* Integrations: the advisor switches on the portfolio management and reporting connections, then the daily sync sends
     positions, transactions and balances, each ticking as it lands. */
  UI.wmIntegrations = el => {
    const C = [['pm', 'Portfolio management system', 'Positions · transactions'], ['rep', 'Reporting system', 'Balances · statements']];
    const con = B(0, 14, 350, 200, 'u-p',
      T(24, 34, 'Integrations', 12.5, { w: 600, c: 'm' }) + T(326, 34, '0 connected', 12, { w: 600, c: 'a', al: 'r', k: 'cn' }) + hr(24, 52, 302) +
      C.map(([ic, n, sub], i) => B(16, 64 + i * 64, 318, 56, 'wm-row', B(12, 12, 32, 32, 'wm-ki', ICON[ic]) + T(56, 20, n, 13.5, { w: 600, c: 'k' }) + T(56, 38, sub, 12, { c: 'm' }) +
        `<div class="wm-tg" style="left:266px;top:18px"><i data-k="tf${i}"></i><b data-k="tk${i}"></b></div>`, 'r' + i)).join(''));
    const RC = [['Positions', 214], ['Transactions', 1032], ['Balances', 38]];
    const sync = B(300, 204, 280, 214, 'u-p dk',
      T(22, 28, 'Sync', 12, { w: 600, c: 'dm' }) + T(258, 28, '0 records', 12, { c: 'dm', al: 'r', k: 'rc' }) + HRD(22, 46, 236) +
      RC.map(([n], j) => { const y = 72 + j * 32; return T(22, y, n, 13, { w: 600, c: 'wt' }) + T(228, y, 'Queued', 12, { c: 'dm', al: 'r', k: 'qa' + j }) + T(228, y, 'Synced', 12, { w: 600, c: 'wm-ok', al: 'r', k: 'qb' + j }) + CK('s' + j, 238, y - 8, 16) + (j < 2 ? HRD(22, y + 16, 236) : ''); }).join('') +
      RESP('rs', 22, 174, 128, 'Sync complete'));
    mountUI(el, 580, 420, con + sync, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let on = 0;
      C.forEach((_, i) => { const p = f(.6 + i * .7, .9 + i * .7); R['tf' + i].style.opacity = p; R['tk' + i].style.transform = `translateX(${(18 * p).toFixed(2)}px)`; R['r' + i].classList.toggle('act', tt > .4 + i * .7 && tt < 1.2 + i * .7 && off < .5); on += p; });
      setTx(R.cn, `${Math.floor(on + .5)} connected`);
      let rec = 0;
      RC.forEach(([, n], j) => { const s0 = 2.2 + j * .7, p = f(s0, s0 + .4); setCk(R['s' + j], p, sm(s0 - .4, s0 - .2, tt) * (1 - sm(s0 - .05, s0, tt)) * (1 - off), t); swap(R['qa' + j], R['qb' + j], p); rec += n * p; });
      setTx(R.rc, `${fmt(Math.round(rec), 0)} records`); setResp(R, 'rs', f(4.5, 4.9), t);
    });
  };
})();
