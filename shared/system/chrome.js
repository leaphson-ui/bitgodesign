/* Site chrome for every page in the v3 Refokus style: nav (mega menus), mobile menu, newsletter form and footer.
   Copy comes word for word from window.CHROME (shared/chrome-2026-11-16.js, captured from the live bitgo.com).
   Usage: renderChrome({ logo, logoHref, newsletterInFooter }) before the page's own script runs. */
(function () {
  const C = window.CHROME;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const act = l => C.actions.find(a => a.label === l) || { label: l, href: '#' };
  const CONNECT = 'https://www.bitgo.com/connect-with-us/';
  const ICONS = {
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zm6 0h2.9v1.7h.1c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8V21h-3v-6.4c0-1.5 0-3.5-2.1-3.5S11.9 12.8 11.9 14.5V21H9z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21z"/></svg>',
    ChatGPT: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z"/><path d="M12 8.2l3.3 1.9v3.8L12 15.8l-3.3-1.9v-3.8z"/></svg>',
    Claude: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/></svg>',
    Gemini: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.6 4.9 4.6 8.9 9.5 9.5-4.9.6-8.9 4.6-9.5 9.5-.6-4.9-4.6-8.9-9.5-9.5 4.9-.6 8.9-4.6 9.5-9.5z"/></svg>',
    Grok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M8 16.5l8-9"/></svg>'
  };
  const icon = label => { const k = Object.keys(ICONS).find(k => label.toLowerCase().includes(k.toLowerCase())); return k ? ICONS[k] : ''; };

  window.renderChrome = function (opt = {}) {
    const LOGO = opt.logo || '../shared/assets/bitgo-logo.svg';
    const sk = $('#skip'); if (sk && window.BITGO) sk.textContent = window.BITGO.skip;
    const login = act('Log In'), signup = act('Sign Up');

    /* ---------- nav ---------- */
    const group = g => `<div class="mgp">${g.href ? `<a class="mgp-t" href="${g.href}">${g.label}</a>` : `<span class="mgp-t">${g.label}</span>`}
      <ul>${g.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul></div>`;
    const feat = m => m.featured && m.featured.length ? `<div class="mc mc-feat"><p class="mc-t">${m.featuredTitle}${m.featuredTag ? ` <span class="tag">${m.featuredTag}</span>` : ''}</p>
      ${m.featured.map((f, i) => `<a class="fcard f${i}" href="${f.href}"><span class="fart" aria-hidden="true"></span>${Parts.eyebrow(f.label, { sm: true, rv: false })}<span class="ft">${f.text}</span></a>`).join('')}</div>` : '';
    $('#nav').innerHTML =
      `<a class="logo" href="${opt.logoHref || '#top'}" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="77" height="26"></a>
      <nav class="menus" aria-label="Primary">${C.menus.map(m =>
        `<div class="mi"><button aria-expanded="false">${m.label}<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="mega${m.featured.length ? ' has-feat' : ''}" style="--cols:${m.columns.length}">
          <div class="mmain">${m.columns.map(c => `<div class="mc"><p class="mc-t">${c.title}</p>${c.groups.map(group).join('')}</div>`).join('')}</div>${feat(m)}</div></div>`).join('')}</nav>
      <div class="acts"><span class="lang">${C.language}</span><a class="lnk" href="${login.href}">${login.label}</a><a class="lnk" href="${signup.href}">${signup.label}</a><a class="btn white sm" href="${CONNECT}">${C.actionsOrder.includes('Connect With Us') ? 'Connect With Us' : ''}</a><button class="burger" aria-label="Menu"><i></i><i></i></button></div>`;
    const mob = document.createElement('div');
    mob.className = 'mobile';
    mob.innerHTML = C.menus.map(m => `<details><summary>${m.label}</summary>${m.columns.map(c => `<h4>${c.title}</h4>${c.groups.map(g =>
      `<p class="mg-g">${g.href ? `<a href="${g.href}">${g.label}</a>` : g.label}</p><ul>${g.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul>`).join('')}`).join('')}${m.featured.length ? `<h4>${m.featuredTitle}</h4><ul>${m.featured.map(f => `<li><a href="${f.href}">${f.text}</a></li>`).join('')}</ul>` : ''}</details>`).join('') +
      `<a class="btn" href="${signup.href}">${signup.label}</a> <a class="btn ghost" href="${login.href}">${login.label}</a>`;
    document.body.appendChild(mob);
    const nav = $('#nav');
    $('.burger', nav).onclick = () => { const o = !mob.classList.contains('open'); mob.classList.toggle('open', o); nav.classList.toggle('mopen', o); };
    mob.addEventListener('click', e => { if (e.target.closest('a')) { mob.classList.remove('open'); nav.classList.remove('mopen'); } });
    $$('.mi', nav).forEach(mi => {
      const btn = $('button', mi);
      const set = o => { $$('.mi', nav).forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); }); if (o) { mi.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } nav.classList.toggle('menu-open', !!o); };
      // keep the open panel inside the right page margin
      const fit = () => { const m = $('.mega', mi); if (!m) return; m.style.setProperty('--shift', '0px'); const pad = parseFloat(getComputedStyle(nav).paddingRight) || 24, over = m.getBoundingClientRect().right - (innerWidth - pad); if (over > 0) m.style.setProperty('--shift', -over + 'px'); };
      mi.addEventListener('mouseenter', () => requestAnimationFrame(fit)); btn.addEventListener('click', () => requestAnimationFrame(fit));
      mi.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && set(true));
      btn.addEventListener('click', () => set(!mi.classList.contains('open')));
    });
    const closeAll = () => { $$('.mi', nav).forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); }); nav.classList.remove('menu-open'); };
    nav.addEventListener('mouseleave', closeAll);
    addEventListener('keydown', e => e.key === 'Escape' && closeAll());
    // over a white or paper section (.on-light) the nav switches to its light mode: dark text, dark logo, blue button
    const lightUnder = () => { const y = nav.offsetHeight / 2; return [...document.querySelectorAll('.on-light')].some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }); };
    const navBtn = $('.acts .btn', nav);
    const navState = () => { const lite = lightUnder(); nav.classList.toggle('solid', scrollY > 40); nav.classList.toggle('lite', lite); if (navBtn) navBtn.classList.toggle('white', !lite); };   // over a light section the nav button is the shared blue button, not white
    addEventListener('scroll', navState, { passive: true }); addEventListener('resize', navState); navState();

    /* ---------- footer ---------- */
    const F = C.footer;
    const legal = F.legal.join('<br><br>').split(/<br>\s*<br>/).map(s => s.trim()).filter(Boolean);
    $('#footer').innerHTML =
      `<div class="wrap">
      ${opt.newsletterInFooter ? `<div class="foot-news"><h3>${F.newsletter}</h3>${newsForm()}</div>` : ''}
      <div class="foot-cols">${F.columns.map(c => `<div class="fc"><h3>${c.title}</h3><ul>${c.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul></div>`).join('')}</div>
      <div class="foot-mid"><div class="soc">${F.socials.map(s => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}">${icon(s.label)}</a>`).join('')}</div>
        <div class="ai"><span>${F.aiTitle}</span>${F.ai.map(s => `<a href="${opt.aiRef ? s.href.split('https%3A%2F%2Fwww.bitgo.com%2Fproducts%2Fqualified-custody.md').join(opt.aiRef) : s.href}" target="_blank" rel="noopener" aria-label="${s.label}">${icon(s.label)}</a>`).join('')}</div></div>
      <div class="foot-logo"><img src="${LOGO}" alt="BitGo"></div>
      <div class="legal">${legal.map(p => `<p>${p}</p>`).join('')}<p class="links">${F.bottom.map(b => `<a href="${b.href}">${b.label}</a>`).join('')}</p></div></div>`;
    wireNews();
  };

  /* the newsletter form: a glass capsule; on submit it shows the live site's own thank-you line */
  function newsForm() {
    const F = C.footer;
    return `<form class="nl2" novalidate><input type="email" placeholder="${F.email}" aria-label="${F.email}" autocomplete="email"><button class="btn white" type="submit"><span>${F.subscribe}</span>${arrow}</button><p class="nl2-ok" role="status">${F.states[0] || ''}</p></form>`;
  }
  function wireNews() {
    $$('.nl2').forEach(f => {
      if (f.dataset.wired) return; f.dataset.wired = 1;
      f.addEventListener('submit', e => { e.preventDefault(); const inp = $('input', f); if (inp.value.includes('@')) f.classList.add('done'); else { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); inp.focus(); } });
    });
  }
  window.renderNewsModule = function (el) {
    el.classList.add('news', 'm-news');
    el.innerHTML = `<div class="wrap"><div class="news-in"><h2 data-rv>${C.footer.newsletter.replace(/\.$/, '')}</h2>${newsForm()}</div></div>`;
    wireNews();
  };

  /* ---------- preview site routing ----------
     Links go only to pages we have rebuilt; every other link stays visible but does nothing.
     Add a page here when its mockup exists (key: its path on bitgo.com). */
  const ROUTES = {
    '/': '../v3-refokus/index.html',
    '/products/qualified-custody/': '../qc-refokus/index.html',
    '/products/custody-wallets/': '../cw-refokus/index.html',
    '/products/self-custody/': '../sc-refokus/index.html',
    // product pages built from the playbook (shared/system/PLAYBOOK.md): folder = the bitgo.com slug
    '/products/hot-wallets/': '../hot-wallets/index.html',
    '/products/cold-wallets/': '../cold-wallets/index.html',
    '/products/wallet-as-a-service/': '../wallet-as-a-service/index.html',
    '/products/prime/': '../prime/index.html',
    '/products/prediction-markets/': '../prediction-markets/index.html',
    '/products/financing/': '../financing/index.html',
    '/products/electronic-trading/': '../electronic-trading/index.html',
    '/products/otc-trading/': '../otc-trading/index.html',
    '/products/go-network-oes/': '../go-network-oes/index.html',
    '/products/go-network-dvp/': '../go-network-dvp/index.html',
    '/products/transfer-agent/': '../transfer-agent/index.html',
    '/products/collateral-management/': '../collateral-management/index.html',
    '/products/wealth-management/': '../wealth-management/index.html',
    '/products/settlement/': '../settlement/index.html',
    '/products/link/': '../link/index.html',
    '/products/staking/': '../staking/index.html',
    '/products/defi/': '../defi/index.html',
    '/products/restaking/': '../restaking/index.html',
    '/products/bitcoin-staking/': '../bitcoin-staking/index.html',
    '/products/ecosystem/': '../ecosystem/index.html',
    '/products/token-management/': '../token-management/index.html',
    '/products/listing-services/': '../listing-services/index.html',
    '/products/mint/': '../mint/index.html',
    '/products/stablecoins/': '../stablecoins/index.html',
    '/products/stablecoin-as-a-service/': '../stablecoin-as-a-service/index.html',
    '/products/platform/': '../platform/index.html',
    '/products/go-account/': '../go-account/index.html',
    '/solutions/asset-managers/': '../asset-managers/index.html',
    '/singapore/': '../singapore/index.html',
    '/company/security/': '../security/index.html',
    '/solutions/insurance/': '../insurance/index.html',
    '/research/': '../research/index.html',
    '/events/': '../events/index.html',
    '/company/careers/': '../careers/index.html',
    '/company/about-us/': '../about-us/index.html',
    '/company/licenses/': '../licenses/index.html',
    '/products/crypto-as-a-service/': '../crypto-as-a-service/index.html',
    '/stablecoin-reserves/': '../attestations/index.html',
    '/genius-act/': '../genius-act/index.html',
    '/resources/blog/': '../blog/index.html',
    '/resources/blog/unocoin-security-incident/': '../blog-post/index.html',
    '/reports/': '../reports/index.html',
    '/report/australia-digital-asset-transition/': '../report/index.html',
    '/resources/white-papers/': '../white-papers/index.html',
    '/resources/case-studies/': '../case-studies/index.html',
    '/resources/case-studies/lantern-finance/': '../case-study/index.html',
    '/legal/': '../legal/index.html',
    '/legal/bitgo-terms-of-use/': '../legal-doc/index.html',
    '/resources/fork-policy/': '../fork-policy/index.html',
    '/press/': '../newsroom/index.html',
    '/press/bitgo-brings-usdc-minting-and-redemption-into-go-accounts/': '../press-release/index.html'
  };
  function routeLinks() {
    $$('a[href]').forEach(a => {
      const raw = a.getAttribute('href');
      if (raw.startsWith('#') && raw.length > 1) return;                 // in-page anchors stay
      if (raw === '#') { a.removeAttribute('href'); a.classList.add('off'); a.setAttribute('aria-disabled', 'true'); return; }
      if (Object.values(ROUTES).includes(raw.split('#')[0])) return;     // already a mockup link
      if (/^(mailto|tel):/i.test(raw)) return;                           // email and phone links work as they are
      let u; try { u = new URL(raw, 'https://www.bitgo.com/'); } catch (e) { u = null; }
      const path = u && /^(www\.)?bitgo\.com$/.test(u.hostname) ? (u.pathname.endsWith('/') ? u.pathname : u.pathname + '/') : null;
      if (path && ROUTES[path]) { a.setAttribute('href', ROUTES[path] + (u.hash || '')); a.removeAttribute('target'); return; }   // keeps a #section jump
      if (u && !/^(www\.)?bitgo\.com$/.test(u.hostname) && /^https?:$/.test(u.protocol)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); return; }   // other sites and files (PDFs, partners): open them
      a.removeAttribute('href'); a.removeAttribute('target'); a.classList.add('off'); a.setAttribute('aria-disabled', 'true');
    });
  }
  window.routeLinks = routeLinks;
  document.addEventListener('DOMContentLoaded', routeLinks);
})();
