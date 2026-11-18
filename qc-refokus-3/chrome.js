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
      ${m.featured.map((f, i) => `<a class="fcard f${i}" href="${f.href}"><span class="fart" aria-hidden="true"></span><span class="eyebrow sm"><i aria-hidden="true"></i>${f.label}</span><span class="ft">${f.text}</span></a>`).join('')}</div>` : '';
    $('#nav').innerHTML =
      `<a class="logo" href="${opt.logoHref || '#top'}" aria-label="BitGo"><img src="${LOGO}" alt="BitGo" width="77" height="26"></a>
      <nav class="menus" aria-label="Primary">${C.menus.map(m =>
        `<div class="mi"><button aria-expanded="false">${m.label}</button><div class="mega${m.featured.length ? ' has-feat' : ''}" style="--cols:${m.columns.length + (m.featured.length ? 1 : 0)}">
          ${m.columns.map(c => `<div class="mc"><p class="mc-t">${c.title}</p>${c.groups.map(group).join('')}</div>`).join('')}${feat(m)}</div></div>`).join('')}</nav>
      <div class="acts"><span class="lang">${C.language}</span><a class="lnk" href="${login.href}">${login.label}</a><a class="lnk" href="${signup.href}">${signup.label}</a><a class="btn" href="${CONNECT}">${C.actionsOrder.includes('Connect With Us') ? 'Connect With Us' : ''}</a><button class="burger" aria-label="Menu"><i></i><i></i></button></div>`;
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
      const set = o => { $$('.mi', nav).forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); }); if (o) { mi.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } };
      mi.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && set(true));
      btn.addEventListener('click', () => set(!mi.classList.contains('open')));
    });
    nav.addEventListener('mouseleave', () => $$('.mi', nav).forEach(x => x.classList.remove('open')));
    addEventListener('keydown', e => e.key === 'Escape' && $$('.mi', nav).forEach(x => x.classList.remove('open')));
    addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

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
    return `<form class="nl2" novalidate><input type="email" placeholder="${F.email}" aria-label="${F.email}" autocomplete="email"><button class="btn" type="submit"><span>${F.subscribe}</span>${arrow}</button><p class="nl2-ok" role="status">${F.states[0] || ''}</p></form>`;
  }
  function wireNews() {
    $$('.nl2').forEach(f => {
      if (f.dataset.wired) return; f.dataset.wired = 1;
      f.addEventListener('submit', e => { e.preventDefault(); const inp = $('input', f); if (inp.value.includes('@')) f.classList.add('done'); else { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); inp.focus(); } });
    });
  }
  window.renderNewsModule = function (el) {
    el.innerHTML = `<div class="wrap"><div class="news-in"><h2 data-rv>${C.footer.newsletter}</h2>${newsForm()}</div></div>`;
    wireNews();
  };
})();
