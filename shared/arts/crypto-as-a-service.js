/* Crypto-as-a-Service UI arts (status: review). Registered into the shared UI registry through Modules.uiKit, the same language as
   scSecurity / dfPolicy / stSecure: white product panels, one dark panel, Inter Tight, BitGo blue, a short eased loop that ends on a
   complete still frame (reduced motion draws that frame). Every label comes from the live page (trading, staking and transfers via
   your own front end, new revenue lines, a broader user base, BitGo Bank and Trust, N.A., user management, the policy engine,
   spending limits); role labels only, no client names; the amount is an illustration, with no fees, rates or revenue figures.
   Styles: crypto-as-a-service.css.
     caasRevenue  "Unlock new revenue streams": your platform switches on trading, staking and transfers one at a time; each one
                  opens a new revenue line on the dark panel, and the platform reads Live
     caasPolicy   "Backed by industry-leading security": an end user's withdrawal passes user management and the policy engine
                  (permissions, spending limit, policy rules) and is released from custody at BitGo Bank and Trust, N.A. */
(function () {
  const K = window.Modules && window.Modules.uiKit; if (!K) return;
  const { UI, B, T, hr, CK, TICK, setCk, setTx, mountUI, sm, cl, pop, reduce } = K;

  /* the small pieces ui-arts.js keeps private, re-declared with the same values */
  const pw = s => Math.round(s.length * 6.4 + 30);
  const PILL = (k, a, b, right, top) => `<div class="pill" data-k="${k}" style="right:${right}px;top:${top}px;height:26px;width:${pw(a)}px"><i class="b0"></i><i class="b1"></i><span class="l0 m">${a}</span><span class="l1 a">${TICK}${b}</span></div>`;
  const setPill = (pl, p, a, b) => { const w0 = pw(a), w1 = pw(b) + 17; pl.style.width = (w0 + (w1 - w0) * p).toFixed(2) + 'px'; pl.children[0].style.opacity = 1 - p; pl.children[2].style.opacity = 1 - p; pl.children[1].style.opacity = p; pl.children[3].style.opacity = p; };
  const RESP = (k, x, y, w, txt) => `<div class="resp" data-k="${k}" style="left:${x}px;top:${y}px;height:22px;width:${w}px">${CK(k + 'c', 8, 4, 14)}<span>${txt}</span></div>`;
  const setResp = (R, k, p, t) => { R[k].style.opacity = p; setCk(R[k + 'c'], p, 0, t); };
  const HRD = (x, y, w) => B(x, y, w, 1, 'caas-hrd');

  /* Unlock new revenue streams: the platform's three services switch on one at a time; each opens its revenue line on the dark
     panel (a line that starts to climb, no figures), and the platform's status turns Live. */
  UI.caasRevenue = el => {
    const SV = [['Trading', 'Top crypto pairs in your UI'], ['Staking', 'Rewards for your users'], ['Transfers', 'Buy and send crypto']], S0 = [.7, 1.9, 3.1];
    const plat = B(0, 14, 340, 266, 'u-p',
      T(24, 34, 'Your platform', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Building', 'Live', 24, 21) +
      T(24, 78, 'Crypto services', 24, { w: 600, c: 'k' }) + T(24, 104, 'Via your own front end', 12.5, { c: 'm' }) + hr(24, 124, 292) +
      SV.map(([n, sub], i) => { const y = 130 + i * 44; return T(24, y + 15, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 31, sub, 12, { c: 'm' }) +
        `<div class="caas-sw" style="left:278px;top:${y + 12}px"><i data-k="sw${i}"></i><b data-k="kn${i}"></b></div>`; }).join(''));
    const line = i => { const pts = Array.from({ length: 9 }, (_, j) => `${(j * 15).toFixed(1)},${(26 - j * 2.2 - Math.sin(j * 1.3 + i * 2) * 3.2 - (j > 5 ? (j - 5) * 1.6 : 0)).toFixed(1)}`).join(' ');
      return `<svg class="caas-ln" style="left:128px;top:${62 + i * 40}px" width="122" height="32" viewBox="-2 -2 124 32"><polyline class="bs" points="${pts}"/><polyline class="pg" data-k="ln${i}" pathLength="1" points="${pts}"/></svg>`; };
    const rev = B(250, 268, 300, 214, 'u-p dk',
      T(22, 28, 'Revenue lines', 12, { w: 600, c: 'dm' }) + T(278, 28, '0 of 3', 12, { w: 600, c: 'wt', al: 'r', k: 'cnt' }) + HRD(22, 46, 256) +
      SV.map(([n], i) => { const y = 78 + i * 40; return T(22, y, n, 13, { w: 600, c: 'wt', k: 'rn' + i }) + line(i) + T(278, y, 'New', 12, { w: 600, c: 'caas-ok', al: 'r', k: 'nw' + i }); }).join('') +
      RESP('rs', 22, 186, 168, 'Broader user base'));
    mountUI(el, 570, 486, plat + rev, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off);
      let n = 0;
      SV.forEach((_, i) => {
        const s = S0[i], on = f(s, s + .35), ln = f(s + .3, s + 1.3);
        R['sw' + i].style.opacity = on; R['kn' + i].style.transform = `translateX(${(18 * on).toFixed(2)}px)`;
        R['ln' + i].style.strokeDashoffset = (1 - ln).toFixed(4); R['rn' + i].style.opacity = .35 + .65 * on;
        const nw = f(s + .9, s + 1.2); R['nw' + i].style.opacity = nw; R['nw' + i].style.transform = `scale(${(.8 + .2 * pop(nw)).toFixed(3)})`; n += nw;
      });
      setTx(R.cnt, `${Math.floor(n + .5)} of 3`);
      setPill(R.pill, f(4.6, 5.1), 'Building', 'Live'); setResp(R, 'rs', f(5.0, 5.4), t);
    });
  };

  /* Backed by industry-leading security: an end user asks to withdraw from your platform. User management and the policy engine
     check it in turn (permissions, spending limit, policy rules); the request is approved and released from custody at BitGo Bank
     and Trust, N.A., a federally chartered national trust bank. */
  UI.caasPolicy = el => {
    const CH = [['User permissions', 'Withdraw enabled for this user'], ['Spending limit', 'Within the daily limit'], ['Policy engine', 'Every rule passed']], S0 = [.9, 1.8, 2.7];
    const req = B(0, 14, 340, 300, 'u-p',
      T(24, 34, 'Withdrawal request', 12.5, { w: 600, c: 'm' }) + PILL('pill', 'Reviewing', 'Approved', 24, 21) +
      T(24, 80, '2.50 ETH', 32, { w: 600, c: 'k' }) + T(24, 108, 'End user · user_4821', 12.5, { c: 'm' }) + hr(24, 130, 292) +
      CH.map(([n, sub], i) => { const y = 140 + i * 52 + 26; return T(24, y - 8, n, 13.5, { w: 600, c: 'k' }) + T(24, y + 9, sub, 12, { c: 'm' }) + CK('c' + i, 290, y - 10, 20); }).join(''));
    const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2.4"/><path d="M8.2 11V8.2a3.8 3.8 0 017.6 0V11"/></svg>';
    const cus = B(300, 296, 270, 170, 'u-p dk',
      T(22, 28, 'Custodian', 12, { w: 600, c: 'dm' }) + `<span class="caas-lk" data-k="lk" style="right:22px;top:17px">${LOCK}<em data-k="la">Held</em><em data-k="lb">Released</em></span>` + HRD(22, 46, 226) +
      T(22, 72, 'BitGo Bank and Trust, N.A.', 14, { w: 600, c: 'wt' }) + T(22, 92, 'Federally chartered national trust bank', 12, { c: 'dm' }) + HRD(22, 112, 226) +
      RESP('rs', 22, 128, 172, 'Released to end user'));
    mountUI(el, 570, 470, req + cus, (R, t) => {
      if (reduce) t = 7.5;
      const P = 10, tt = t % P, off = sm(8.6, 9.4, tt), f = (a, b) => sm(a, b, tt) * (1 - off), wait = (a, b) => sm(a - .6, a - .4, tt) * (1 - sm(b - .1, b, tt)) * (1 - off);
      S0.forEach((s, i) => setCk(R['c' + i], f(s, s + .4), wait(s, s + .4), t));
      setPill(R.pill, f(3.6, 4.1), 'Reviewing', 'Approved');
      const rel = f(4.3, 4.8); R.la.style.opacity = cl(1 - rel * 2); R.lb.style.opacity = cl(rel * 2 - 1); R.lk.classList.toggle('on', rel > .5);
      R.lk.style.width = (70 + 28 * rel).toFixed(2) + 'px';
      setResp(R, 'rs', f(4.8, 5.2), t);
    });
  };
})();
