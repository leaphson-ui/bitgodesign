import { bars, ledger, network, staking, dial } from './viz.js';
import { initStack } from './stack.js';

export function buildSections({ B, $, el, esc: rawEsc, arrow, gsap, ST, reduce }) {
  // two source lines read as typos once set large; mend them without changing meaning
  const esc = s => rawEsc(String(s).replace('one place-hold, send', 'one place: hold, send').replace('staking and lending-digital assets', 'staking and lending, digital assets'));
  const set = (id, html) => { $('#' + id).innerHTML = html; };
  const img = (src, alt = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  const noise = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;
  document.documentElement.style.setProperty('--noise', noise);

  /* ---- trust: statement + logo marquee ---- */
  {
    const t = B.trust.title; // "Globally trusted since 2013"
    const m = t.match(/^(.*?)(\d{4})$/);
    const logos = B.trust.logos.map(l => `<li>${img(l)}</li>`).join('');
    set('trust', `
      <div class="wrap trust-head"><h2 class="display mega">${esc(m ? m[1].trim() : t)} <span class="fill">${m ? m[2] : ''}</span></h2></div>
      <div class="marq" aria-hidden="false"><ul class="track">${logos}${logos}</ul></div>`);
    const track = $('#trust .track');
    if (gsap) {
      const w = () => track.scrollWidth / 2;
      let x = 0, vel = 0, dir = -1;
      const speed = .55;
      gsap.ticker.add(() => {
        if (reduce) return;
        x += dir * (speed + Math.min(8, Math.abs(vel)) * .35); vel *= .9;
        if (x <= -w()) x += w(); if (x > 0) x -= w();
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
      if (ST) ST.create({ onUpdate: s => { vel = s.getVelocity() / 300; dir = s.direction === 1 ? -1 : 1; } });
    }
  }

  /* ---- badges ---- */
  {
    const [a, b, c] = B.badges.map(x => x.label);
    set('badges', `
      <div class="wrap badges-grid">
        <div class="bd bd-a"><canvas class="bd-bars"></canvas><p class="bd-t">${esc(a)}</p></div>
        <div class="bd bd-b"><p class="bd-t">${esc(b)}</p></div>
        <div class="bd bd-c"><p class="bd-t">${esc(c)}</p></div>
      </div>`);
    bars($('#badges .bd-bars'), { n: 40, mode: 'wave', color: '170,195,255', seed: 2, width: .5, maxH: .62, fromTop: true });
  }

  /* ---- core ---- */
  {
    const c = B.core;
    set('core', `
      <div class="wrap">
        <h2 class="display mega core-title"><span>${esc(c.title[0])}</span><span class="dim">${esc(c.title[1])}</span></h2>
        <div class="core-grid">
          <ul class="core-list">${c.items.map((it, i) => `
            <li class="crow${i === 0 ? ' on' : ''}" data-i="${i}">
              <h3 class="display">${esc(it.title)}</h3>
              <p class="short">${esc(it.short)}</p>
              <p class="long">${esc(it.long)}</p>
              <a class="lm" href="${it.cta.href}">${esc(it.cta.label)}${arrow}</a>
            </li>`).join('')}</ul>
          <div class="core-vis"><div class="core-sticky"><canvas id="stackGL" aria-hidden="true"></canvas></div></div>
        </div>
      </div>`);
    const rows = [...document.querySelectorAll('#core .crow')];
    let api = null;
    const setActive = i => { rows.forEach((r, k) => r.classList.toggle('on', k === i)); api && api.setActive(i); };
    let lastI = 0;
    rows.forEach((r, i) => ST && ST.create({ trigger: r, start: 'top 62%', end: 'bottom 62%', onToggle: s => { if (s.isActive) { lastI = i; setActive(i); } } }));
    initStack($('#stackGL'), $('#core .core-sticky')).then(a => { api = a; if (a) a.setActive(lastI); }).catch(e => console.error('stack', e));
  }

  /* ---- established (solid blue) ---- */
  {
    const e = B.established;
    set('established', `
      <div class="est-grain"></div>
      <div class="wrap est-in">
        <div class="est-head">
          <h2 class="display mega">${esc(e.title)}</h2>
          <div class="est-side"><p>${esc(e.text)}</p><a class="btn" href="${e.cta.href}">${esc(e.cta.label)}${arrow}</a></div>
        </div>
        <ul class="est-grid">${e.logos.map((l, i) => `
          <li class="ecard${l.text ? ' has' : ''}" tabindex="0">
            <div class="ec-logo">${img(l.image, l.name)}</div>
            ${l.text ? `<p class="ec-t">${esc(l.text)}</p>` : `<p class="ec-n">${esc(l.name)}</p>`}
          </li>`).join('')}</ul>
      </div>`);
  }

  /* ---- build ---- */
  {
    const b = B.build;
    const k = ['ledger', 'staking', 'network'];
    set('build', `
      <div class="wrap">
        <h2 class="display mega build-title">${esc(b.title)}</h2>
        <div class="build-grid">${b.cards.map((c, i) => `
          <article class="bcard b${i}">
            <canvas class="bviz" aria-hidden="true"></canvas>
            <div class="bbody"><h3 class="display">${esc(c.label)}</h3><p>${esc(c.text)}</p><a class="lm" href="${c.cta.href}">${esc(c.cta.label)}${arrow}</a></div>
          </article>`).join('')}</div>
      </div>`);
    const cv = document.querySelectorAll('#build .bviz');
    ledger(cv[0]); staking(cv[1]); network(cv[2]);
  }

  /* ---- support (paper) ---- */
  {
    const s = B.support;
    set('support', `
      <div class="wrap sup-grid">
        <div class="sup-left">
          <h2 class="display sup-title">${esc(s.title)}</h2>
          <ul class="sup-list">${s.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="sup-dial" role="img" aria-label="${esc(s.label)}">
          <canvas aria-hidden="true"></canvas>
          <div class="sup-c"><b>24/7</b><span>${esc(s.label.replace(/^24\/7\s*/, ''))}</span></div>
        </div>
      </div>`);
    dial($('#support canvas'));
  }

  /* ---- own: stacking slabs ---- */
  {
    const o = B.own;
    const modes = [
      { mode: 'wave', n: 96, width: .3, seed: 1 }, { mode: 'sparse', n: 15, width: .55, seed: 4 },
      { mode: 'travel', n: 70, width: .45, seed: 2 }, { mode: 'halving', n: 40, width: .6, seed: 1 }, { mode: 'build', n: 54, width: .55, seed: 6 }];
    set('own', `
      <div class="wrap">
        <h2 class="display mega own-title">${esc(o.title)}</h2>
        <div class="own-stack">${o.items.map((it, i) => `
          <article class="ocard o${i}" style="--i:${i}">
            <canvas class="obars" aria-hidden="true"></canvas>
            <div class="oin"><h3 class="display">${esc(it.title)}</h3><p>${esc(it.text)}</p></div>
          </article>`).join('')}</div>
      </div>`);
    document.querySelectorAll('#own .obars').forEach((cv, i) => bars(cv, { ...modes[i], color: '255,255,255' }));
  }

  /* ---- spotlight ---- */
  {
    const s = B.spotlight;
    set('spotlight', `
      <div class="wrap">
        <h2 class="display mega sp-title">${esc(s.label)}</h2>
        <div class="sp-grid">${s.slides.map((v, i) => `
          <a class="vid v${i}" href="${v.video}" target="_blank" rel="noopener">
            <span class="vbg"></span><span class="vgr"></span>
            <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
            <span class="vt display">${esc(v.title)}</span>
          </a>`).join('')}</div>
      </div>`);
  }

  /* ---- latest (paper) ---- */
  {
    const l = B.latest;
    set('latest', `
      <div class="wrap">
        <div class="lat-head"><h2 class="display mega">${esc(l.title)}</h2><a class="btn blue" href="${l.all.href}">${esc(l.all.label)}${arrow}</a></div>
        <ul class="lat-list">${l.posts.map(p => `
          <li><a href="${p.href}"><span class="lt">${esc(p.title)}</span><i class="go"><svg viewBox="0 0 14 14"><path d="M1 7h11M8 2.5 12.5 7 8 11.5"/></svg></i></a></li>`).join('')}</ul>
      </div>`);
  }

  /* ---- cta: solid blue block, strands return ---- */
  {
    const c = B.cta;
    set('cta', `
      <div class="wrap cta-wrap">
        <div class="cta-block">
          <canvas class="cta-bars" aria-hidden="true"></canvas>
          <div class="cta-in">
            <h2 class="display"><span>${esc(c.title[0])}</span><span>${esc(c.title[1])}</span></h2>
            <a class="btn" href="${B.BITGO}">${esc(c.button)}${arrow}</a>
          </div>
        </div>
      </div>`);
    bars($('#cta .cta-bars'), { n: 120, mode: 'wave', color: '255,255,255', seed: 5, width: .3, maxH: .66 });
  }

  /* ---- footer ---- */
  {
    const f = B.footer;
    set('footer', `
      <div class="wrap">
        <div class="f-top">
          <div class="f-news">
            <p class="display">${esc(f.newsletter)}</p>
            <form class="f-form" onsubmit="return false"><input type="email" placeholder="${esc(f.email)}" aria-label="${esc(f.email)}"><button class="btn blue" type="submit">${esc(f.subscribe)}${arrow}</button></form>
          </div>
          <ul class="f-soc">${f.socials.map(s => `<li><a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
        </div>
        <div class="f-mark"><img src="../shared/assets/bitgo-logo.svg" alt="" loading="lazy"></div>
        <div class="f-legal">${f.legal.map(p => `<p>${esc(p)}</p>`).join('')}
          <p>${esc(f.review)} <a href="${f.privacy.href}">${esc(f.privacy.label)}</a> ${esc(f.and)} <a href="${f.disclaimers.href}">${esc(f.disclaimers.label)}</a>.</p>
          <p>${esc(f.screenReader)}</p><p>${esc(f.complaints)}</p></div>
        <div class="f-bot"><span>${esc(f.nmls)}</span><a href="#">${esc(f.choices)}</a><span>${esc(f.rights)}</span></div>
      </div>`);
  }

  /* ---- reveals: hidden from JS only, so text stays readable without scripts ---- */
  if (gsap && ST && !reduce) {
    const rv = (sel, vars = {}) => document.querySelectorAll(sel).forEach(e => gsap.from(e, { y: 44, opacity: 0, duration: 1.1, ease: 'power3.out', ...vars, scrollTrigger: { trigger: e, start: 'top 88%', once: true } }));
    rv('.mega'); rv('.trust-head .fill', { y: 0, x: -30 }); rv('.bd', { y: 60 }); rv('.est-side'); rv('.sup-title'); rv('.sup-list li', { y: 24 });
    rv('.lat-list li', { y: 30 }); rv('.cta-in h2 span', { y: 70 }); rv('.f-top'); rv('.vid', { y: 70 });
    gsap.utils.toArray('.ecard').forEach((e, i) => gsap.from(e, { y: 60, opacity: 0, duration: 1, delay: (i % 4) * .08, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 92%', once: true } }));
    gsap.utils.toArray('.bcard').forEach((e, i) => gsap.from(e, { y: 80, opacity: 0, duration: 1.1, delay: i * .1, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 92%', once: true } }));
    // parallax on the staggered build cards
    gsap.utils.toArray('.b1').forEach(e => gsap.to(e, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.build-grid', start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.utils.toArray('.b2').forEach(e => gsap.to(e, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.build-grid', start: 'top bottom', end: 'bottom top', scrub: true } }));
    // dial breathes with scroll
    gsap.to('#support canvas', { rotate: 40, ease: 'none', scrollTrigger: { trigger: '#support', start: 'top bottom', end: 'bottom top', scrub: true } });
    // blue sections' grain drifts
    gsap.to('.est-grain', { backgroundPosition: '0 -400px', ease: 'none', scrollTrigger: { trigger: '#established', start: 'top bottom', end: 'bottom top', scrub: true } });
    // stacking cards: previous cards settle back as the next one covers them
    gsap.utils.toArray('.ocard').forEach((c, i, all) => {
      if (i === all.length - 1) return;
      gsap.to(c, { scale: .965, ease: 'none', scrollTrigger: { trigger: all[i + 1], start: 'top 75%', end: 'top 20%', scrub: true } });
    });
  }
}
