/* Platform UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / lkRoles / lkPortfolio: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on a
   complete still frame (reduced motion draws that frame). Names and figures come from the live page's own product images
   (bitgo.com/products/platform/: the role list, the "Multi-Signature for Cold Wallets" policy, the Portfolio panel, the BitGo Assist
   prompt) and its copy (the Assist questions: "where do I see my staking rewards", "what is derivatives trading"; orders in BTC or
   USD). Member labels, the withdrawal amount and the BTC price are illustrations. Styles: platform.css.
     pfAdmin      "Admin Console": the role list (Link View, Organization Admin, Organization Viewer, Enterprise Admin, Wallet Admin);
                  a new analyst is onboarded as Organization Viewer, a former contractor is offboarded, and the change is logged
     pfPolicy     "Advanced Policy Engine": the live rule builds step by step (When Withdrawal, From Cold Wallets, If Amount above
                  $150,000, Then Require 2 approvals from Wallet Admins), goes Active, and a 180,000 USD withdrawal from a cold wallet
                  is held for its two approvals
     pfPortfolio  "Transparent Wallet Management": the live Portfolio panel. Custody Cold, Linked Accounts, Self-Custody and Custody Hot
                  sync in turn and the total builds to $45,006.56 across 8 wallets and 3 linked accounts
     pfAssist     "BitGo Assist": the live prompt ("What's my") completes to a balance question; the answer gives the figure and the
                  action, and Open Portfolio is pressed
     pfAsk        "Ask, and get there instantly": "Where do I see my staking rewards?"; Assist answers with the path (Home, Earn,
                  Staking rewards) and takes you there
     pfOrder      "Real-time intelligence for real-time decisions": an order is entered in USD instead of BTC; the BTC amount is
                  worked out beside it (250,000.00 USD at 95,000.00 = 2.6316 BTC) and the order is placed
     pfLearn      "Build your digital asset foundation": "What is derivatives trading?"; the answer streams in with the basics and
                  the main instruments to explore */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'pf-hrd');
  const swap = (a, b, p) => { a.style.opacity = cl(1 - p * 2); b.style.opacity = cl(p * 2 - 1); };
  const fmt = (v, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const TICKW = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8.5"/></svg>';
  const ARW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const UP = '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/></svg>';
  /* the BitGo Assist prompt (live: a dark glass bar, a spark mark, the typed question and a send button) */
  const PROMPT = (k, x, y, w) => `<div class="pf-prompt" style="left:${x}px;top:${y}px;width:${w}px;height:52px"><i class="pf-spk">${SPARK}</i><span class="pf-q" data-k="${k}"></span><i class="pf-cr" data-k="${k}cr"></i><b class="pf-send" data-k="${k}s">${UP}</b></div>`;
  const setPrompt = (R, k, s, p, t, sent) => {
    const n = Math.round(s.length * cl(p)); setTx(R[k], s.slice(0, n));
    R[k + 'cr'].style.opacity = reduce || sent > .5 ? 0 : (Math.sin(t * 6) > -.2 ? 1 : 0);
    R[k + 's'].classList.toggle('on', p > .98 && sent < .5); R[k + 's'].style.transform = `scale(${(1 - .12 * sm(0, .5, sent) * (1 - sm(.5, 1, sent))).toFixed(3)})`;
  };
  const BTN = (k, x, y, w, a, b) => B(x, y, w, 38, 'pf-btn', `<span data-k="${k}0">${a}${ARW}</span><span data-k="${k}1">${TICKW}${b}</span>`, k);

  /* Admin Console: the live role list on the dark panel. The selection steps to Organization Viewer and the new analyst is onboarded
     with it; the former contractor is offboarded; the change is logged. */
  UI.pfAdmin = el => {
    const M = [['OA', 'Treasury lead', 'Organization Admin', ''], ['EA', 'Operations', 'Enterprise Admin', ''], ['NA', 'New analyst', 'Invited', 'Organization Viewer · Onboarded'], ['FC', 'Former contractor', 'Link View', 'Offboarded']];
    const RO = ['Link View', 'Organization Admin', 'Organization Viewer', 'Enterprise Admin', 'Wallet Admin'];
    const card = B(0, 14, 340, 334, 'u-p',
      T(24, 34, 'Admin console', 12.5, { w: 600, c: 'm' }) + T(316, 34, 'Organization', 12, { c: 'm', al: 'r' }) +
      T(24, 78, 'Members', 22, { w: 600, c: 'k' }) + T(24, 104, 'Roles and permissions', 12.5, { c: 'm' }) + hr(24, 124, 292) +
      M.map(([a, n, r0, r1], i) => { const y = 134 + i * 50 + 25;
        return `<div class="pf-row" data-k="m${i}">` + B(25, y - 15, 30, 30, 'av', a, 'av' + i) + T(64, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(64, y + 9, r0, 12, { c: 'm', k: 'ra' + i }) + (r1 ? T(64, y + 9, r1, 12, { w: 600, c: 'a', k: 'rb' + i }) : '') + '</div>' +
          (i === 2 ? CK('c2', 290, y - 10, 20) : ''); }).join(''));
    const roles = B(316, 156, 254, 250, 'u-p dk',
      T(22, 28, 'Roles', 12, { w: 600, c: 'dm' }) + T(232, 28, 'New analyst', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 210) +
      '<i class="pf-sel" data-k="sel" style="left:14px;top:56px"></i>' +
      RO.map((r, i) => T(30, 70 + i * 30, r, 12.5, { w: 600, c: 'pf-ro', k: 'ro' + i })).join('') +
      RESP('rs', 22, 214, 124, 'Change logged'));
    mountUI(el, 570, 410, card + roles, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const pos = f(.8, 1.3) + f(1.6, 2.1); R.sel.style.transform = `translateY(${(pos * 30).toFixed(2)}px)`;
      RO.forEach((_, i) => R['ro' + i].classList.toggle('on', Math.round(pos) === i));
      const on = f(2.5, 2.9); swap(R.ra2, R.rb2, on); setCk(R.c2, on, sm(2.1, 2.3, tt) * (1 - sm(2.8, 2.9, tt)) * (1 - off), t); R.av2.classList.toggle('on', on > .5);
      const gone = f(3.6, 4.1); swap(R.ra3, R.rb3, gone); R.m3.style.opacity = (1 - .55 * gone).toFixed(3);
      setResp(R, 'rs', f(4.5, 4.9), t);
    });
  };

  /* Advanced Policy Engine: the live policy (Multi-Signature for Cold Wallets) is built step by step and goes Active; a withdrawal
     from a cold wallet above the threshold is then held for its two approvals. */
  UI.pfPolicy = el => {
    const S = [['When', 'Withdrawal', '1 of 4 workflows'], ['From', 'Cold Wallets', '3 cold wallets'], ['If', 'Amount above $150,000', 'per 5 days'], ['Then', 'Require 2 approvals', 'from Wallet Admins']];
    const card = B(0, 0, 380, 372, 'u-p',
      T(24, 32, 'Policy engine', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Draft', 'Active', 24, 19) +
      T(24, 70, 'Multi-Signature for Cold Wallets', 17, { w: 600, c: 'k' }) + hr(24, 92, 332) +
      `<i class="pf-rail" style="left:35px;top:122px;height:${3 * 62}px"><b data-k="rail"></b></i>` +
      S.map(([l, v, m], i) => { const y = 122 + i * 62;
        return `<i class="pf-node" data-k="n${i}" style="left:28px;top:${y - 7}px"></i>` + T(58, y - 9, l.toUpperCase(), 10.5, { w: 700, c: 'a pf-cap' }) + T(58, y + 9, v, 15, { w: 600, c: 'k', k: 'v' + i }) + T(58, y + 28, m, 12, { c: 'm', k: 'm' + i }); }).join(''));
    const ev = B(336, 228, 234, 176, 'u-p dk',
      T(22, 28, 'Withdrawal', 12, { w: 600, c: 'dm' }) + T(212, 28, 'Cold wallet', 12, { c: 'dm', al: 'r' }) + HRD(22, 46, 190) +
      T(22, 74, '180,000.00 USD', 17, { w: 600, c: 'wt' }) + T(22, 98, 'Above $150,000', 12, { c: 'dm' }) +
      T(22, 126, 'Approvals', 12, { c: 'dm' }) + T(212, 126, '0 of 2', 12, { w: 600, c: 'wt', al: 'r', k: 'cnt' }) +
      RESP('rs', 22, 142, 134, 'Policy enforced'));
    mountUI(el, 570, 404, card + ev, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      S.forEach((_, i) => { const s0 = .6 + i * .55, p = f(s0, s0 + .35); R['n' + i].classList.toggle('on', p > .5); R['v' + i].style.opacity = R['m' + i].style.opacity = .3 + .7 * p; });
      R.rail.style.height = (f(.6, 2.25) * 100).toFixed(2) + '%';
      setPill(R.pill, f(2.8, 3.3), 'Draft', 'Active');
      const a = f(4.0, 4.3) + f(4.8, 5.1); setTx(R.cnt, `${Math.floor(a + .5)} of 2`);
      setResp(R, 'rs', f(5.3, 5.7), t);
    });
  };

  /* Transparent Wallet Management: the live Portfolio panel. Each wallet type syncs in turn (its segment of the bar fills and its tile
     lights), and the total builds to the live $45,006.56. */
  UI.pfPortfolio = el => {
    const W = [['Custody Cold', 17240.11, '38.3%'], ['Linked Accounts', 13500.09, '30.0%'], ['Self-Custody', 7854.09, '17.5%'], ['Custody Hot', 6412.27, '14.2%']], TOT = 45006.56, BW = 500;
    let x = 0; const seg = W.map(([, v], i) => { const w = BW * v / TOT - (i < 3 ? 4 : 0), h = `<i class="pf-seg" style="left:${(30 + x).toFixed(1)}px;top:150px;width:${w.toFixed(1)}px"><b data-k="s${i}"></b></i>`; x += BW * v / TOT; return h; }).join('');
    const pan = B(0, 0, 560, 372, 'u-p',
      T(30, 38, 'Portfolio', 15, { w: 600, c: 'k' }) + B(430, 22, 100, 30, 'pf-chip', 'Go Account') +
      T(30, 94, '$0.00', 38, { w: 600, c: 'a', k: 'tot' }) + T(30, 128, 'Total balance across 8 wallets and 3 linked accounts', 12.5, { c: 'm' }) + seg +
      W.map(([n, v, pc], i) => { const cx = 18 + (i % 2) * 262, cy = 178 + Math.floor(i / 2) * 92;
        return B(cx, cy, 250, 80, 'pf-tile', T(16, 24, n, 12.5, { c: 'm' }) + T(16, 54, '$' + fmt(v), 19, { w: 600, c: 'k' }) + T(234, 54, pc, 12, { c: 'm', al: 'r' }), 'tl' + i); }).join(''));
    mountUI(el, 560, 372, pan, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let tot = 0;
      W.forEach(([, v], i) => { const s0 = .8 + i * .7, p = f(s0, s0 + .6); R['s' + i].style.width = (p * 100).toFixed(2) + '%'; R['tl' + i].classList.toggle('act', tt > s0 && tt < s0 + 1.1 && off < .5); R['tl' + i].style.opacity = (.45 + .55 * p).toFixed(3); tot += v * p; });
      setTx(R.tot, '$' + fmt(Math.round(tot * 100) / 100));
    });
  };

  /* BitGo Assist: the live prompt ("What's my") completes to a question; the answer gives the insight and the action, and the
     action is taken. */
  UI.pfAssist = el => {
    const Q = "What's my total balance?";
    const ans = B(40, 92, 480, 250, 'u-p',
      `<i class="pf-mk" style="left:24px;top:22px">${SPARK}</i>` + T(56, 34, 'BitGo Assist', 12.5, { w: 600, c: 'm' }) + hr(24, 56, 432) +
      T(24, 84, '$45,006.56', 30, { w: 600, c: 'k', k: 'a0' }) + T(24, 114, 'across 8 wallets and 3 linked accounts', 12.5, { c: 'm', k: 'a1' }) +
      [['Custody Cold', '38.3%'], ['Linked Accounts', '30.0%']].map(([n, p], i) => T(24, 146 + i * 22, n, 12.5, { c: 'nm', k: 'a' + (2 + i) }) + T(200, 146 + i * 22, p, 12.5, { w: 600, c: 'k', al: 'r', k: 'p' + i })).join('') +
      BTN('go', 24, 194, 170, 'Open Portfolio', 'Opened'), 'ans');
    mountUI(el, 560, 360, PROMPT('q', 0, 20, 560) + ans, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      setPrompt(R, 'q', Q, f(.4, 2.0), t, f(2.2, 2.5));
      const a = f(2.6, 3.0); R.ans.style.opacity = a; R.ans.style.transform = `translateY(${((1 - a) * 10).toFixed(2)}px)`;
      [0, 1, 2, 3].forEach(i => { R['a' + i].style.opacity = f(2.9 + i * .2, 3.2 + i * .2); }); R.p0.style.opacity = R.a2.style.opacity; R.p1.style.opacity = R.a3.style.opacity;
      const press = sm(4.4, 4.55, tt) * (1 - sm(4.55, 4.75, tt)); R.go.style.transform = `scale(${(1 - press * .05).toFixed(3)})`; swap(R.go0, R.go1, f(4.6, 4.9));
    });
  };

  /* Ask, and get there instantly: the live question, then the path through the platform lights step by step and you are taken
     to the page. */
  UI.pfAsk = el => {
    const Q = 'Where do I see my staking rewards?', PATH = ['Home', 'Earn', 'Staking rewards'];
    let x = 24; const chips = PATH.map((s, i) => { const w = Math.round(s.length * 7.2 + 28), h = B(x, 92, w, 30, 'pf-crumb', s, 'cb' + i) + (i < 2 ? `<i class="pf-sep" style="left:${x + w + 6}px;top:100px">›</i>` : ''); x += w + 22; return h; }).join('');
    const ans = B(0, 92, 400, 196, 'u-p',
      `<i class="pf-mk" style="left:24px;top:22px">${SPARK}</i>` + T(56, 34, 'BitGo Assist', 12.5, { w: 600, c: 'm' }) + hr(24, 56, 352) +
      T(24, 76, 'Staking rewards are under Earn.', 13.5, { w: 600, c: 'k' }) + chips + BTN('go', 24, 140, 160, 'Take me there', 'Opened'), 'ans');
    const dest = B(300, 250, 260, 130, 'u-p dk',
      T(22, 28, 'Earn', 12, { w: 600, c: 'dm' }) + T(238, 28, 'Staking rewards', 12, { w: 600, c: 'pf-ok', al: 'r' }) + HRD(22, 46, 216) +
      B(22, 62, 216, 8, 'pf-sk') + B(22, 80, 150, 8, 'pf-sk') + RESP('rs', 22, 96, 110, "You're here"), 'dest');
    mountUI(el, 560, 392, PROMPT('q', 0, 16, 560) + ans + dest, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      setPrompt(R, 'q', Q, f(.4, 2.0), t, f(2.2, 2.5));
      const a = f(2.6, 3.0); R.ans.style.opacity = a; R.ans.style.transform = `translateY(${((1 - a) * 10).toFixed(2)}px)`;
      PATH.forEach((_, i) => R['cb' + i].classList.toggle('on', f(3.1 + i * .35, 3.3 + i * .35) > .5));
      const press = sm(4.5, 4.65, tt) * (1 - sm(4.65, 4.85, tt)); R.go.style.transform = `scale(${(1 - press * .05).toFixed(3)})`; swap(R.go0, R.go1, f(4.7, 5.0));
      const d = f(4.9, 5.3); R.dest.style.opacity = d; R.dest.style.transform = `translateY(${((1 - d) * 12).toFixed(2)}px)`; setResp(R, 'rs', f(5.3, 5.7), t);
    });
  };

  /* Real-time intelligence: an order ticket. The amount switches from asset units (BTC) to quote currency (USD), 250,000.00 USD is
     entered, the BTC amount is worked out beside it, and the order is placed. */
  UI.pfOrder = el => {
    const USD = 250000, PX = 95000;
    const tk = B(0, 10, 360, 320, 'u-p',
      T(24, 34, 'Buy', 15, { w: 600, c: 'k' }) + B(66, 20, 56, 28, 'chip on', 'BTC') + T(336, 34, 'Price 95,000.00 USD', 12, { c: 'm', al: 'r' }) + hr(24, 58, 312) +
      T(24, 84, 'Enter amount in', 12.5, { c: 'm' }) +
      `<div class="pf-tabs" style="left:150px;top:68px"><i data-k="tb"></i><span data-k="t0">BTC</span><span data-k="t1">USD</span></div>` +
      B(24, 108, 312, 64, 'pf-field', T(18, 34, '0.00', 24, { w: 600, c: 'k', k: 'amt' }) + T(294, 34, 'BTC', 14, { w: 600, c: 'm', al: 'r', k: 'unit' })) +
      T(24, 196, 'You buy', 12.5, { c: 'm' }) + T(336, 196, '–', 13.5, { w: 600, c: 'k', al: 'r', k: 'eq' }) + hr(24, 214, 312) +
      T(24, 238, 'Worked out for you', 12.5, { c: 'm' }) + T(336, 238, 'No manual math', 12.5, { w: 600, c: 'a', al: 'r', k: 'nm' }) +
      BTN('go', 24, 262, 312, 'Place order', 'Order placed'));
    mountUI(el, 360, 340, tk, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      const sw = f(.8, 1.2); R.tb.style.transform = `translateX(${(sw * 100).toFixed(2)}%)`; R.t0.classList.toggle('sel', sw < .5); R.t1.classList.toggle('sel', sw >= .5);
      setTx(R.unit, sw < .5 ? 'BTC' : 'USD');
      const typ = f(1.5, 2.6), v = Math.round(USD * typ / 10000) * 10000; setTx(R.amt, fmt(v));
      setTx(R.eq, v ? fmt(v / PX, 4) + ' BTC' : '–'); R.nm.style.opacity = f(2.7, 3.0);
      const press = sm(3.8, 3.95, tt) * (1 - sm(3.95, 4.15, tt)); R.go.style.transform = `scale(${(1 - press * .05).toFixed(3)})`; swap(R.go0, R.go1, f(4.0, 4.3));
    });
  };

  /* Build your digital asset foundation: the live question, and the answer streams in line by line, ending on the instruments to
     explore next. */
  UI.pfLearn = el => {
    const Q = 'What is derivatives trading?';
    const L = ['Trading contracts whose value comes from', 'an underlying asset, such as BTC, instead', 'of trading the asset itself.'];
    const ans = B(0, 92, 420, 220, 'u-p',
      `<i class="pf-mk" style="left:24px;top:22px">${SPARK}</i>` + T(56, 34, 'BitGo Assist', 12.5, { w: 600, c: 'm' }) + hr(24, 56, 372) +
      L.map((s, i) => T(24, 82 + i * 22, s, 14, { w: 500, c: 'k', k: 'l' + i })).join('') +
      T(24, 160, 'Explore', 12, { c: 'm', k: 'ex' }) + ['Futures', 'Options', 'Hedging'].map((s, i) => B(24 + i * 92, 176, 84, 28, 'pf-crumb', s, 'cp' + i)).join(''), 'ans');
    mountUI(el, 560, 330, PROMPT('q', 0, 16, 560) + ans, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      setPrompt(R, 'q', Q, f(.4, 1.8), t, f(2.0, 2.3));
      const a = f(2.4, 2.8); R.ans.style.opacity = a; R.ans.style.transform = `translateY(${((1 - a) * 10).toFixed(2)}px)`;
      L.forEach((s, i) => { const p = f(2.8 + i * .5, 3.3 + i * .5); setTx(R['l' + i], s.slice(0, Math.round(s.length * p))); });
      R.ex.style.opacity = f(4.4, 4.7); [0, 1, 2].forEach(i => { const p = f(4.5 + i * .2, 4.8 + i * .2); R['cp' + i].style.opacity = p; R['cp' + i].classList.toggle('on', i === 0 && p > .9 && tt > 5.4); });
    });
  };
})();
