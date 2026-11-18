/* home-dark sections (2026-11-18): bitgo.com's own structure for three homepage sections, upgraded to this page's
   style (black ground, starfield, glass, BitGo-blue light). HD.trusted: logo tiles drifting in two rows around the
   centred headline. HD.spotlight: the 50/50 client video carousel. HD.latest: four post cards. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  const eb = t => `<span class="eyebrow" data-rv><i aria-hidden="true"></i>${t}</span>`;
  // a tile follows the cursor with a soft blue light (CSS --mx/--my)
  const spotlightTiles = root => root.addEventListener('pointermove', e => {
    const t = e.target.closest('.hd-tile'); if (!t) return; const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); t.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, { passive: true });

  window.HD = {
    /* { label, title, text, cta, logos: [src] } */
    trusted(el, o) {
      el.classList.add('hd-trusted');
      const half = Math.ceil(o.logos.length / 2), rowA = o.logos.slice(0, half), rowB = o.logos.slice(half).concat(o.logos.slice(0, Math.max(0, half - (o.logos.length - half))));
      const row = (list, cls) => `<div class="hd-row ${cls}" aria-hidden="true"><div class="hd-track">${[...list, ...list, ...list, ...list].map(src => `<div class="hd-tile"><img src="${src}" alt="" loading="lazy"></div>`).join('')}</div></div>`;
      el.innerHTML = row(rowA, 'r1') +
        `<div class="wrap hd-tr-head">${eb(o.label)}<h2 class="big" data-rv>${o.title}</h2><p class="lead" data-rv>${o.text}</p><a class="btn white" href="${o.cta.href}" data-rv>${o.cta.label}${arrow}</a></div>` +
        row(rowB, 'r2');
      spotlightTiles(el);
      // the rows drift (opposite ways), slow to a crawl under the cursor and pick up speed with the scroll
      if (reduce) return;
      const anims = [...el.querySelectorAll('.hd-track')].map((tr, i) => tr.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 90000, iterations: Infinity, direction: i ? 'reverse' : 'normal' }));
      let target = 1, rate = 1, lastY = scrollY, raf = 0;
      el.querySelectorAll('.hd-row').forEach(r => { r.addEventListener('pointerenter', () => { target = 0.15; kick(); }); r.addEventListener('pointerleave', () => { target = 1; kick(); }); });
      addEventListener('scroll', () => { const v = Math.min(6, Math.abs(scrollY - lastY) / 12); lastY = scrollY; rate = Math.max(rate, 1 + v); kick(); }, { passive: true });
      const step = () => { raf = 0; rate += (target - rate) * 0.06; anims.forEach(a => a.playbackRate = rate); if (Math.abs(rate - target) > 0.01) raf = requestAnimationFrame(step); };
      const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    },

    /* { label, slides: [{ title, video (YouTube URL) }] } */
    spotlight(el, o) {
      el.classList.add('hd-spot');
      const id = u => (u.match(/(?:v=|embed\/|youtu\.be\/)([\w-]{11})/) || [])[1];
      const ids = o.slides.map(s => id(s.video)), n = o.slides.length, pad = i => String(i + 1).padStart(2, '0');
      el.innerHTML = `<div class="wrap hd-sp">
        <div class="hd-sp-copy">${eb(o.label)}<div class="hd-sp-titles">${o.slides.map((s, i) => `<h2 class="hd-sp-t${i ? '' : ' on'}"${i ? ' aria-hidden="true"' : ''}>${s.title}</h2>`).join('')}</div>
          <div class="hd-sp-nav"><button class="hd-sp-b prev" aria-label="Previous video">${arrow}</button><span class="hd-sp-i">01 / ${pad(n - 1)}</span><button class="hd-sp-b next" aria-label="Next video">${arrow}</button></div></div>
        <div class="hd-sp-stage"><div class="hd-sp-frame">${o.slides.map((s, i) => `<div class="hd-sp-slide${i ? '' : ' on'}" data-i="${i}"><img class="hd-sp-poster" src="https://i.ytimg.com/vi/${ids[i]}/hqdefault.jpg" alt="" loading="lazy"><span class="hd-sp-play" aria-hidden="true"></span></div>`).join('')}</div>
          <div class="hd-sp-dots">${o.slides.map((s, i) => `<button class="hd-sp-dot${i ? '' : ' on'}" aria-label="Video ${i + 1}: ${s.title}"><i></i></button>`).join('')}</div></div>
      </div>`;
      const ts = [...el.querySelectorAll('.hd-sp-t')], ss = [...el.querySelectorAll('.hd-sp-slide')], ds = [...el.querySelectorAll('.hd-sp-dot')], ix = el.querySelector('.hd-sp-i');
      let cur = 0, seen = false;
      const embed = i => { const s = ss[i]; if (s.querySelector('iframe')) return; const f = document.createElement('iframe');
        f.src = `https://www.youtube.com/embed/${ids[i]}?autoplay=${reduce ? 0 : 1}&mute=1&loop=1&playlist=${ids[i]}&controls=1&rel=0&playsinline=1`; f.title = o.slides[i].title;
        f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.loading = 'lazy'; f.referrerPolicy = 'strict-origin-when-cross-origin'; s.appendChild(f); };
      const go = k => {
        const nx = (k + n) % n; if (nx === cur) return;
        [ts, ss, ds].forEach(list => { list[cur].classList.remove('on'); list[nx].classList.add('on'); });
        ts[cur].setAttribute('aria-hidden', 'true'); ts[nx].removeAttribute('aria-hidden');
        const old = ss[cur].querySelector('iframe'); if (old) old.remove();      // the slide that leaves stops playing
        cur = nx; ix.textContent = `${pad(cur)} / ${pad(n - 1)}`; if (seen) embed(cur);
      };
      el.querySelector('.prev').onclick = () => go(cur - 1); el.querySelector('.next').onclick = () => go(cur + 1);
      ds.forEach((d, i) => d.onclick = () => go(i)); ss.forEach((s, i) => s.addEventListener('click', () => { if (i === cur) embed(i); }));
      new IntersectionObserver(es => { if (es[0].isIntersecting && !seen) { seen = true; embed(cur); } }, { rootMargin: '0px 0px -20% 0px' }).observe(el);
    },

    /* { title, all: { label, href }, posts: [{ title, href, image }] } */
    latest(el, o) {
      el.classList.add('hd-latest');
      el.innerHTML = `<div class="wrap"><div class="hd-lt-top"><h2 data-rv>${o.title}</h2><a class="btn ghost" href="${o.all.href}" data-rv>${o.all.label}${arrow}</a></div>
        <ul class="hd-lt-grid">${o.posts.map((p, i) => `<li data-rv style="--d:${(i * 0.07).toFixed(2)}s"><a class="hd-card" href="${p.href}"><span class="hd-thumb"><img src="${p.image}" alt="" loading="lazy"></span><span class="hd-card-t">${p.title}</span><span class="hd-card-go" aria-hidden="true">${arrow}</span></a></li>`).join('')}</ul></div>`;
    }
  };
})();
