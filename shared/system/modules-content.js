/* BitGo design system: the content modules (blog, resources, newsroom, case studies, white papers, reports, events,
   careers, press releases, legal pages). Shared like modules.js; load right after it (styles: modules-content.css).
     Modules.listing  an index of posts (grown from the approved Modules.latest)
     Modules.article  a long-form body (grown from the candidate Modules.prose)
   Both place the shared parts (base.css, Parts.*, Modules.headline, Modules.hero) and never restyle them. Copy always
   comes in from the page's content file; nothing here writes copy of its own. */
(function () {
  const arrow = Modules.uiKit.arrow;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const route = () => { if (window.routeLinks) window.routeLinks(); };   // links written after load go through the preview router too
  const GO = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11 11 5M6 5h5v5"/></svg>';
  const LENS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>';
  const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  let uid = 0;

  /* A post's meta line: one child per item, separated by CSS dots (so each item reads as its own line of text). */
  const META = ['label', 'category', 'date', 'read', 'author'];
  const metaLine = (p, keys, cls) => {
    const items = keys.filter(k => p[k]).map(k => k === 'label' || k === 'category' ? `<b>${esc(p[k])}</b>` : `<span>${esc(p[k])}</span>`);
    return items.length ? `<p class="ls-meta${cls ? ' ' + cls : ''}">${items.join('')}</p>` : '';
  };
  const img = (p, cls) => p.image ? `<span class="${cls}"><img src="${esc(p.image)}" alt="${esc(p.alt || '')}" loading="lazy" decoding="async"></span>` : '';

  /* ---------- Listing: an index of posts ----------
     Modules.listing(el, {
       hero,          { eyebrow, title, lead }: the page opener. Draws the shared hero (Modules.hero, the page's h1; title
                      may be an array of lines) and puts the search field and the tabs in its copy column. No 3D unless
                      hero.model names one from the library (model, fit and cta pass through to Modules.hero).
                      hero.mark { src, text }: a live brand mark set inline at the end of the h1, its name kept as visually
                      hidden text (case studies: "Built with" + the BitGo shield, read as "Built with BitGo").
                      hero.sr: a line the live page keeps visually hidden in its hero (the case studies' companies line).
       eyebrow, title, text   the section headline: a title row on the left (as Modules.latest), or the centred shared
                      headline with head: 'center'. title is the shared h2.big (one headline size everywhere).
       all,           { label, href }: the ghost button beside the title (Modules.latest's "All").
       featured,      a lead post: wide image beside its meta, title and excerpt. featured.label is its kicker ("Featured").
       posts,         [{ title, href, image, alt, category, date, year, read, author, excerpt, label, go, logo }]. Every
                      field but title and href is optional and simply left out when missing. go: the card's live link
                      label ("Download Report", "Read More"), its own line with the arrow (grid: under the excerpt;
                      rows: beside the arrow ring, under the text on phones). logo: the post's client logo (thumb: 'logo').
       layout,        'grid' (default): cards in columns, image on top. 'rows': ruled rows with a thumbnail, the excerpt,
                      the meta line and the latest's arrow, filling with glass boxes on hover (the homepage Latest).
       cols,          grid columns on desktop: 2, 3 (default) or 4.
       thumb,         'logo': the rows show each post's logo (post.logo) contained on the open curtain instead of its image
                      cropped in a frame (the case studies' client logos).
       meta,          which meta items show, in order (default ['label','category','date','read','author']).
       excerpt,       false hides the excerpts (title-only cards).
       search,        { label, placeholder, empty }: a search field. Results open under it as you type (title and
                      meta, linked), or the empty line when nothing matches; Enter filters the target listing with the
                      text and scrolls to it. Ctrl/Cmd K focuses it.
       tabs,          [{ label, href, topic, current, home }] (+ tabsLabel, its accessible name): a row of tabs. A tab with
                      a topic filters the target listing by category ('All' clears it) and scrolls to it; one with an
                      href is a plain link; home sets the index's own name in bold at the start of the row.
       target,        section id of the listing that search and tabs drive (default: this one).
       year,          { label, all, options: ['2026', ...] }: a year filter beside the title (post.year).
                      style: 'buttons': bare year buttons instead of the menu; pressing the pressed year clears the filter.
       all.icon       the live glyph after the "All" label ("→"), set as text in place of the drawn arrow.
       query,         { label, placeholder }: a text filter beside the title (title, excerpt, category, author).
       more,          { label, step, href, back, icon }: show step posts, the button shows step more; with none left it
                      hides, or turns into a real link to href (a live archive page, mapped by the shared router). back: true
                      makes that link a back link: no forward arrow, icon (the live glyph "←") before the label.
       --- added 2026-11-17 for research, events and licenses (status: review) ---
       posts[].href   left out: the card or row is not a link (no arrow, no hover boxes).
       thumb,         'mark': each row's post.logo in its own colours (a flag, a coloured mark), contained, no frame.
                      'date': each row's post.day over post.mon as a date tile (an event's start).
       clamp,         false: excerpts show in full (no 2-3 line cut): entity and licence texts that must stay whole.
       group,         'month': the rows sit under a sub-heading per post.group ("November 2026"), heading left of its rows on
                      desktop, recomputed after every filter.
       tabs[].count   a count beside a tab's label (the events' regions: "APAC 2").
       hero.logo      { src, alt }: a live mark over the h1 in place of the eyebrow (the BitGo Research lockup).
       hero.link      { label, href, icon }: a second, ghost button beside hero.cta; icon is a live glyph set after the label ("↓").
       featured.byline { name, text }: the author and their line under the featured excerpt.
       side,          { title, posts: [{ title, href, category, read }] }: a short ranked list beside the grid ("Selected research").
       layout 'covers'  report covers in a rail that scrolls sideways (arrows beside the title): each a glass cover with the
                      listing's mark ({ src, alt }: o.mark), the title and post.label, and post.go with the arrow under it.
       layout 'charts'  data figures, not links: post.label (kicker), title, excerpt, the chart (post.image, a live chart file),
                      then post.from + post.source { title, href } and post.actions [{ action: 'embed' | 'png', label, aria }]:
                      Embed copies the chart's markup with its source link, PNG saves the chart as a PNG. The first figure is large.
       note,          a small-print line under the list (a sources line).
       empty,         the live line shown when a filter leaves nothing ("No events match this region.").
       map,           { label, list, image, frame, locate, start }: the events explorer. start: 'list' opens on the list.
                      Without image the map is a plain graticule (lines every 30 degrees) under the pins. A bar holds the tabs (region filters)
                      and two view buttons (label: Map, list: List). Map view: the live map drawing (image) with a pin per
                      post.location at post.x / post.y (percent of the map), each opening a card (the location, then each
                      event's post.date and title); locate ({ label }) is a menu of the locations that opens one. List view:
                      the rows (thumb 'date', group 'month'). Both views stay in the page; the hidden one is hidden.
     })
     Filters, tabs and "more" re-render the list in place; a filter that matches nothing leaves it empty (no live
     empty-state line exists to show). Modules.listing.get(id) returns a listing's controller ({ set({ topic, year,
     query }), posts }). Labels the live page keeps visually hidden (label, year.label,
     query.label) stay as visually hidden text. */
  const REG = {};
  window.Modules.listing = function (el, o) {
    el.classList.add('m-listing'); if (o.clamp === false) el.classList.add('ls-full');
    const id = el.id || 'ls' + (++uid), layout = o.layout || 'grid', keys = o.meta || META;
    const posts = o.posts || [], step = (o.more && o.more.step) || posts.length || 1;
    const state = { topic: 'All', year: '', query: '', shown: step };
    const n = () => ++uid;

    /* the parts */
    const lnk = (p, cls, rv, inner) => p.href ? `<a class="${cls}" href="${esc(p.href)}"${rv ? ' data-rv' : ''}>${inner}</a>` : `<div class="${cls} no-link"${rv ? ' data-rv' : ''}>${inner}</div>`;   // a post without href is not a link
    const card = (p, rv) => lnk(p, 'ls-card', rv, `${img(p, 'ls-img')}${metaLine(p, keys)}<h3>${esc(p.title)}</h3>${o.excerpt !== false && p.excerpt ? `<p class="ls-ex">${esc(p.excerpt)}</p>` : ''}${p.go ? `<p class="ls-act">${esc(p.go)}${GO}</p>` : ''}`);
    const boxes = () => `<span class="ls-boxes" aria-hidden="true">${Array.from({ length: 64 }, () => `<i style="--d:${(Math.random() * .35).toFixed(2)}s"></i>`).join('')}</span>`;
    const thumb = p => o.thumb === 'logo' || o.thumb === 'mark' ? (p.logo ? `<span class="ls-thumb ls-logo${o.thumb === 'mark' ? ' ls-own' : ''}"><img src="${esc(p.logo)}" alt="" loading="lazy" decoding="async"></span>` : '')
      : o.thumb === 'date' ? (p.day || p.mon ? `<div class="ls-thumb ls-date"><p>${esc(p.day)}</p><p>${esc(p.mon)}</p></div>` : '') : img(p, 'ls-thumb');
    const row = (p, rv) => { const th = thumb(p), end = p.go ? `<span class="ls-end"><p class="ls-act">${esc(p.go)}</p>${p.href ? `<span class="ls-go">${GO}</span>` : ''}</span>` : p.href ? `<span class="ls-go">${GO}</span>` : '';
      return lnk(p, `ls-row${th ? '' : ' no-img'}${p.go ? ' has-act' : ''}${end ? '' : ' no-end'}`, rv, `${th}<span class="ls-txt"><h3>${esc(p.title)}</h3>${o.excerpt !== false && p.excerpt ? `<p class="ls-ex">${esc(p.excerpt)}</p>` : ''}${metaLine(p, keys)}</span>${end}${p.href ? boxes() : ''}`); };
    const cover = (p, rv) => lnk(p, 'ls-cover', rv, `<span class="ls-cv">${o.mark ? `<img class="ls-cv-mark" src="${esc(o.mark.src)}" alt="" decoding="async">` : ''}<span class="ls-cv-b"><h3>${esc(p.title)}</h3>${p.label ? `<p class="ls-cv-l">${esc(p.label)}</p>` : ''}</span></span>${p.go ? `<p class="ls-act">${esc(p.go)}${GO}</p>` : ''}`);
    const chart = (p, rv) => `<figure class="ls-chart"${rv ? ' data-rv' : ''}>${p.label ? `<p class="ls-chart-k">${esc(p.label)}</p>` : ''}<figcaption><h3>${esc(p.title)}</h3>${p.excerpt ? `<p class="ls-ex">${esc(p.excerpt)}</p>` : ''}</figcaption>
      ${p.image ? `<div class="ls-plot"><img src="${esc(p.image)}" alt="${esc(p.alt || p.title)}" loading="lazy" decoding="async"></div>` : ''}
      <div class="ls-chart-f">${p.source ? `<p class="ls-src">${p.from ? esc(p.from) + ' ' : ''}<a href="${esc(p.source.href)}">${esc(p.source.title)}</a></p>` : ''}${(p.actions || []).length ? `<div class="ls-acts">${p.actions.map(a => `<button type="button" class="ls-ctl ls-actb" data-act="${esc(a.action)}"${a.aria ? ` aria-label="${esc(a.aria)}"` : ''}>${esc(a.label)}</button>`).join('')}</div>` : ''}</div></figure>`;
    const item = (p, rv) => layout === 'rows' ? row(p, rv) : layout === 'covers' ? cover(p, rv) : layout === 'charts' ? chart(p, rv) : card(p, rv);
    const feat = f => `<article class="ls-feat" data-rv>${f.image ? `<a class="ls-fimg" href="${esc(f.href)}" tabindex="-1" aria-hidden="true"><img src="${esc(f.image)}" alt="" loading="lazy" decoding="async"></a>` : ''}
      <div class="ls-fbody">${metaLine(f, keys, 'ls-meta-lg')}<h2 class="ls-ftitle"><a href="${esc(f.href)}">${esc(f.title)}</a></h2>${f.excerpt ? `<p class="lead">${esc(f.excerpt)}</p>` : ''}${f.byline ? `<div class="ls-by"><p class="ls-by-n">${esc(f.byline.name)}</p>${f.byline.text ? `<p class="ls-by-t">${esc(f.byline.text)}</p>` : ''}</div>` : ''}</div></article>`;
    const side = s => `<aside class="ls-side" data-rv>${s.title ? `<h2 class="ls-side-h">${esc(s.title)}</h2>` : ''}<ul>${s.posts.map(p => `<li><a href="${esc(p.href)}"><p class="ls-side-t">${esc(p.title)}</p>${metaLine(p, ['category', 'read'])}</a></li>`).join('')}</ul></aside>`;
    const srOnly = (t, i) => t ? `<p class="ls-sr" id="${i}">${esc(t)}</p>` : '';
    const searchBox = s => { const i = 'lss' + n(); return `<div class="ls-search" role="search">${srOnly(s.label, i)}${LENS}<input type="search" autocomplete="off" spellcheck="false" placeholder="${esc(s.placeholder || '')}" aria-labelledby="${i}" role="combobox" aria-expanded="false" aria-controls="${i}r" aria-autocomplete="list"><div class="ls-results" id="${i}r" hidden><div class="ls-hits" role="listbox"></div>${s.empty ? `<p class="ls-none" hidden>${esc(s.empty)}</p>` : ''}</div></div>`; };
    const tabRow = t => `<nav class="ls-tabs"${o.tabsLabel ? ` aria-label="${esc(o.tabsLabel)}"` : ''}><div class="ls-tabs-in">${t.map(x => { const lab = `${x.image ? `<img src="${esc(x.image)}" alt="">` : esc(x.label)}${x.count != null ? `<span class="ls-tc">${esc(x.count)}</span>` : ''}`, al = x.image ? ` aria-label="${esc(x.label)}"` : '';
      return x.topic
      ? `<button type="button" class="ls-tab${x.current ? ' on' : ''}${x.count != null ? ' has-count' : ''}" data-topic="${esc(x.topic)}"${x.current ? ' aria-current="true"' : ''}>${lab}</button>`
      : `<a class="ls-tab${x.home ? ' ls-home' : ''}${x.image ? ' ls-tab-img' : ''}" href="${esc(x.href)}"${al}>${lab}</a>`; }).join('')}</div></nav>`;
    const menuBox = (y, data, cls) => { const i = 'lsy' + n(); return `<div class="ls-year ${cls || ''}">${srOnly(y.label, i)}<button type="button" class="ls-ctl ls-ybtn" aria-haspopup="listbox" aria-expanded="false"${y.label ? ` aria-labelledby="${i}"` : ''}><span class="ls-yv">${esc(y.all)}</span>${CHEV}</button>
      <div class="ls-ymenu" role="listbox" hidden>${y.allOption === false ? '' : `<button type="button" role="option" data-${data}="" aria-selected="true">${esc(y.all)}</button>`}${y.options.map(v => `<button type="button" role="option" data-${data}="${esc(v)}" aria-selected="false">${esc(v)}</button>`).join('')}</div></div>`; };
    const yearBox = y => y.style === 'buttons' ? `<div class="ls-ybtns" role="group"${y.label ? ` aria-label="${esc(y.label)}"` : ''}>${y.options.map(v => `<button type="button" class="ls-tab ls-yb" data-yb="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>` : menuBox(y, 'year');
    const lglyph = g => `<span class="ls-glyph">${esc(g)}</span>`;
    const queryBox = q => { const i = 'lsq' + n(); return `${srOnly(q.label, i)}<label class="ls-ctl ls-q">${LENS}<input type="search" placeholder="${esc(q.placeholder || '')}" aria-labelledby="${i}"></label>`; };
    const railBtns = () => `<div class="ls-rail-btns"><button type="button" class="ls-rb prev" aria-label="Previous">${arrow}</button><button type="button" class="ls-rb next" aria-label="Next">${arrow}</button></div>`;

    /* the events map: the live map drawing, a pin per location, each opening its card */
    const M = o.map, places = [];
    if (M) posts.forEach(p => { if (!p.location) return; let pl = places.find(x => x.name === p.location); if (!pl) places.push(pl = { name: p.location, x: p.x, y: p.y, posts: [] }); pl.posts.push(p); });
    const mapView = () => `<div class="ls-view ls-mapv" data-view="map"><div class="ls-mapf" role="region"${M.frame ? ` aria-label="${esc(M.frame)}"` : ''}><div class="ls-mapi">${M.image ? `<img class="ls-map-img" src="${esc(M.image)}" alt="" aria-hidden="true" decoding="async">` : ''}
      ${places.map((pl, k) => `<div class="ls-place" style="left:${pl.x}%;top:${pl.y}%" data-k="${k}"><button type="button" class="ls-pin" aria-expanded="false" aria-label="${esc(pl.name)}"><i></i></button></div>`).join('')}</div>
      ${places.map((pl, k) => `<div class="ls-pop${pl.x > 62 ? ' flip' : ''}" data-k="${k}" style="--x:${pl.x}%;--y:${pl.y}%" hidden><div class="ls-pop-h"><p>${esc(pl.name)}</p><button type="button" class="ls-pop-x" aria-label="${esc(pl.name)}">×</button></div>${pl.posts.map(p => `<div class="ls-pop-r"><p>${esc(p.date)}</p><p>${esc(p.title)}</p></div>`).join('')}</div>`).join('')}</div></div>`;   // the cards sit beside their pins (under the map on phones)
    const viewBtns = () => `<div class="ls-views">${[['map', M.label], ['list', M.list]].map(([v, l], i) => `<button type="button" class="ls-tab${i ? '' : ' on'}" data-view-btn="${v}" aria-pressed="${!i}">${esc(l)}</button>`).join('')}</div>`;

    /* the opener: the shared hero, with the search and the tabs in its copy column */
    if (o.hero) {
      const h = o.hero;
      const mark = h.mark ? ` <span class="ls-mark" aria-hidden="true"><img src="${esc(h.mark.src)}" alt=""></span> <span class="ls-sr">${esc(h.mark.text)}</span>` : '';
      Modules.hero(el, { eyebrow: h.eyebrow, title: [].concat(h.title).join('<br>') + mark, lead: h.lead, model: h.model, fit: h.fit, cta: h.cta });
      el.classList.add('ls-hero');
      const copy = el.querySelector('.mh-copy');
      if (h.logo) copy.insertAdjacentHTML('afterbegin', `<p class="ls-hlogo" data-rv><img src="${esc(h.logo.src)}" alt="${esc(h.logo.alt || '')}"></p>`);
      if (h.link) { let r = copy.querySelector('.mh-row'); if (!r) { copy.insertAdjacentHTML('beforeend', '<div class="mh-row" data-rv></div>'); r = copy.querySelector('.mh-row'); }
        r.insertAdjacentHTML('beforeend', `<a class="btn ghost" href="${esc(h.link.href)}"><span>${esc(h.link.label)}</span>${h.link.icon ? ` <span class="ls-glyph">${esc(h.link.icon)}</span>` : arrow}</a>`); }
      copy.insertAdjacentHTML('beforeend', (h.sr ? `<p class="ls-sr">${esc(h.sr)}</p>` : '') + (o.search ? `<div class="ls-hrow" data-rv>${searchBox(o.search)}</div>` : '') + (o.tabs ? tabRow(o.tabs) : ''));
    } else {
      const tools = o.all || o.year || o.query || layout === 'covers';
      const head = o.title ? (o.head === 'center'
        ? Modules.headline({ eyebrow: o.eyebrow, title: o.title, text: o.text })
        : `<div class="ls-top"><div>${o.eyebrow ? Parts.eyebrow(o.eyebrow) : ''}<h2 class="big" data-rv>${o.title}</h2>${o.text ? `<p class="lead" data-rv>${o.text}</p>` : ''}</div>
          ${tools ? `<div class="ls-tools">${o.year ? yearBox(o.year) : ''}${o.query ? queryBox(o.query) : ''}${o.all ? `<a class="btn ghost" href="${esc(o.all.href)}">${o.all.icon ? `<span>${esc(o.all.label)}</span> ${lglyph(o.all.icon)}` : esc(o.all.label) + arrow}</a>` : ''}${layout === 'covers' ? railBtns() : ''}</div>` : ''}</div>`) : '';
      const listCls = `ls-list ${o.group ? 'ls-grouped' : layout === 'rows' ? 'ls-rows' : layout === 'covers' ? 'ls-covers' : layout === 'charts' ? 'ls-charts' : 'ls-grid'}`;
      const list = posts.length ? `<div class="${listCls}" style="--cols:${o.cols || 3}"></div>` : '';
      const bar = M ? `<div class="ls-bar">${o.tabs ? tabRow(o.tabs) : ''}<div class="ls-bar-end">${M.locate ? menuBox({ all: M.locate.label, options: places.map(p => p.name), allOption: false }, 'place', 'ls-locate') : ''}${viewBtns()}</div></div>` : '';
      const body = M ? `${mapView()}<div class="ls-view" data-view="list" hidden>${list}</div>` : o.side ? `<div class="ls-split">${list}${side(o.side)}</div>` : list;
      el.innerHTML = `<div class="wrap">${o.search ? `<div class="ls-hrow">${searchBox(o.search)}</div>` : ''}${!M && o.tabs ? tabRow(o.tabs) : ''}${head}${bar}${o.featured ? feat(o.featured) : ''}
        ${body}${o.empty ? `<p class="ls-empty" hidden>${esc(o.empty)}</p>` : ''}
        ${o.more ? `<div class="ls-more"><button type="button" class="btn ghost">${esc(o.more.label)}${arrow}</button>${o.more.href ? `<a class="btn ghost${o.more.back ? ' ls-back' : ''}" href="${esc(o.more.href)}" hidden>${o.more.back ? (o.more.icon ? lglyph(o.more.icon) + ' ' : '') + `<span>${esc(o.more.label)}</span>` : esc(o.more.label) + arrow}</a>` : ''}</div>` : ''}${o.note ? `<p class="ls-note" data-rv>${esc(o.note)}</p>` : ''}</div>`;
      if (M) el.classList.add('ls-has-map');
    }

    /* the list: filtered by topic, year and query, then cut to what "more" has shown */
    const list = el.querySelector('.ls-list'), moreBtn = el.querySelector('.ls-more button.btn'), moreLink = el.querySelector('.ls-more a.btn'), emptyEl = el.querySelector('.ls-empty');
    const match = (p, s) => (s.topic === 'All' || !s.topic || p.category === s.topic) && (!s.year || p.year === s.year) &&
      (!s.query || [p.title, p.excerpt, p.category, p.author].join(' ').toLowerCase().includes(s.query.toLowerCase()));
    let first = true;
    const render = () => {
      if (!list) return;
      const hits = posts.filter(p => match(p, state)), show = hits.slice(0, state.shown);
      if (o.group) {   // a sub-heading per group, its rows beside it
        const gs = []; show.forEach(p => { const g = gs[gs.length - 1]; g && g.name === (p.group || '') ? g.posts.push(p) : gs.push({ name: p.group || '', posts: [p] }); });
        list.innerHTML = gs.map(g => `<div class="ls-grp">${g.name ? `<h3 class="ls-gh"${first ? ' data-rv' : ''}>${esc(g.name)}</h3>` : '<span></span>'}<div class="${layout === 'rows' ? 'ls-rows' : 'ls-grid'}" style="--cols:${o.cols || 3}">${g.posts.map(p => item(p, first)).join('')}</div></div>`).join('');
      } else list.innerHTML = show.map(p => item(p, first)).join('');   // only the first render reveals on scroll
      if (moreBtn) { const left = hits.length > show.length; moreBtn.parentElement.hidden = !left && !moreLink; moreBtn.hidden = !left; if (moreLink) moreLink.hidden = left; }   // at the end: the live archive link (a real link the router maps)
      if (emptyEl) emptyEl.hidden = !!hits.length;
      if (M) { el.querySelectorAll('.ls-place').forEach(d => { const on = places[+d.dataset.k].posts.some(p => match(p, state)); d.hidden = !on; if (!on) openPin(null, d); });
        if (!el.querySelector('.ls-place.open:not([hidden])')) openPin(el.querySelector('.ls-place:not([hidden])')); }   // one card stays open, as live keeps one (the first upcoming place in view)
      if (layout === 'charts') wireCharts();
      if (!first) { route(); Parts.titleize(list); }   // later rows get the same router and Title Case as the first render
      first = false;
    };

    /* the map's pins and cards (one card open at a time) */
    const openPin = (d, only) => el.querySelectorAll('.ls-place').forEach(x => { if (only && x !== only) return; const on = x === d; x.classList.toggle('open', on); el.querySelector(`.ls-pop[data-k="${x.dataset.k}"]`).hidden = !on; x.querySelector('.ls-pin').setAttribute('aria-expanded', String(on)); });
    if (M) {
      el.querySelectorAll('.ls-place').forEach(d => {
        d.querySelector('.ls-pin').addEventListener('click', () => openPin(d.classList.contains('open') ? null : d));
        el.querySelector(`.ls-pop[data-k="${d.dataset.k}"] .ls-pop-x`).addEventListener('click', () => openPin(null));
      });
      const showView = v => { el.querySelectorAll('[data-view]').forEach(x => { x.hidden = x.dataset.view !== v; }); el.querySelectorAll('[data-view-btn]').forEach(b => { const on = b.dataset.viewBtn === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); };
      el.querySelectorAll('[data-view-btn]').forEach(b => b.addEventListener('click', () => showView(b.dataset.viewBtn)));
      el.__showView = showView;
      if (M.start === 'list') showView('list');
    }

    /* the charts' actions: Embed copies the chart with its source link; PNG draws the chart file and saves it */
    function wireCharts() {
      list.querySelectorAll('.ls-chart').forEach((f, i) => { const p = posts.filter(x => match(x, state))[i]; if (!p) return;
        f.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', async () => {
          try {
            if (b.dataset.act === 'embed') {
              const svg = await (await fetch(p.image)).text();
              await navigator.clipboard.writeText(`<figure>${svg.trim()}${p.source ? `<figcaption><a href="${esc(p.source.href)}">${esc(p.source.title)}</a></figcaption>` : ''}</figure>`);
            } else {
              const im = new Image(); im.src = p.image; await im.decode();
              const k = 2, cv = document.createElement('canvas'); cv.width = (im.naturalWidth || 640) * k; cv.height = (im.naturalHeight || 400) * k;
              cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
              const a = document.createElement('a'); a.download = slug(p.title) + '.png'; a.href = cv.toDataURL('image/png'); a.click();
            }
            b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400);
          } catch (e) { b.classList.add('fail'); setTimeout(() => b.classList.remove('fail'), 1400); }
        }));
      });
    }
    if (moreBtn) moreBtn.addEventListener('click', () => { state.shown += step; render(); });
    el.querySelectorAll('.ls-yb').forEach(b => b.addEventListener('click', () => {   // year buttons: one pressed at a time; pressing it again clears
      const on = b.getAttribute('aria-pressed') !== 'true';
      el.querySelectorAll('.ls-yb').forEach(x => { x.setAttribute('aria-pressed', String(x === b && on)); x.classList.toggle('on', x === b && on); });
      ctl.set({ year: on ? b.dataset.yb : '' });
    }));
    const ctl = { posts, state, set(s) { Object.assign(state, s, { shown: step }); const qi = el.querySelector('.ls-q input'); if (qi && s.query != null && qi.value !== s.query) qi.value = s.query; render(); }, el };
    REG[id] = ctl;
    render();

    /* the controls */
    const tgt = () => REG[o.target] || ctl;
    const scrollTo = () => { const t = tgt().el; if (t && t !== el) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
    el.querySelectorAll('.ls-tab[data-topic]').forEach(b => b.addEventListener('click', () => {
      tgt().set({ topic: b.dataset.topic });
      el.querySelectorAll('.ls-tab[data-topic]').forEach(x => { const on = x === b; x.classList.toggle('on', on); on ? x.setAttribute('aria-current', 'true') : x.removeAttribute('aria-current'); });
      scrollTo();
    }));
    el.querySelectorAll('.ls-year').forEach(box => {   // the year menu and the map's location menu
      const yb = box.querySelector('.ls-ybtn'), ym = box.querySelector('.ls-ymenu');
      const close = () => { ym.hidden = true; yb.setAttribute('aria-expanded', 'false'); };
      yb.addEventListener('click', e => { e.stopPropagation(); ym.hidden = !ym.hidden; yb.setAttribute('aria-expanded', String(!ym.hidden)); });
      ym.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        ym.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b))); close();
        if (b.dataset.place != null) {   // locate: show the map, clear a filter that hides the place, open its card
          const k = places.findIndex(p => p.name === b.dataset.place), d = el.querySelector(`.ls-place[data-k="${k}"]`);
          el.__showView('map'); if (d.hidden) { const all = el.querySelector('.ls-tab[data-topic="All"]'); all ? all.click() : ctl.set({ topic: 'All' }); }
          openPin(d); d.querySelector('.ls-pin').focus({ preventScroll: true }); return;
        }
        box.querySelector('.ls-yv').textContent = b.textContent; ctl.set({ year: b.dataset.year });
      }));
      document.addEventListener('click', e => { if (!ym.hidden && !ym.contains(e.target)) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    });
    const rail = el.querySelector('.ls-covers');
    if (rail) el.querySelectorAll('.ls-rb').forEach(b => b.addEventListener('click', () => {
      const c = rail.querySelector('.ls-cover'), w = c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0) : 300;
      rail.scrollBy({ left: (b.classList.contains('prev') ? -1 : 1) * w * Math.max(1, Math.floor(rail.clientWidth / w)), behavior: reduce ? 'auto' : 'smooth' });
    }));
    const q = el.querySelector('.ls-q input');
    if (q) { let tm; q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => ctl.set({ query: q.value.trim() }), 120); }); }
    const sb = el.querySelector('.ls-search');
    if (sb) {
      const inp = sb.querySelector('input'), res = sb.querySelector('.ls-results'), hitsEl = res.querySelector('.ls-hits'), none = res.querySelector('.ls-none');
      const close = () => { res.hidden = true; inp.setAttribute('aria-expanded', 'false'); };
      const show = () => {
        const v = inp.value.trim(); if (!v) return close();
        const hits = tgt().posts.filter(p => match(p, { topic: 'All', year: '', query: v })).slice(0, 6);
        hitsEl.innerHTML = hits.map(p => `<a role="option" href="${esc(p.href)}"><b>${esc(p.title)}</b>${metaLine(p, ['category', 'author'])}</a>`).join('');
        if (none) none.hidden = !!hits.length;
        res.hidden = !hits.length && !none; inp.setAttribute('aria-expanded', String(!res.hidden)); route();
      };
      inp.addEventListener('input', show);
      inp.addEventListener('focus', show);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Escape') { close(); inp.blur(); }
        if (e.key === 'Enter') { e.preventDefault(); close(); tgt().set({ query: inp.value.trim() }); scrollTo(); }
      });
      document.addEventListener('click', e => { if (!sb.contains(e.target)) close(); });
      document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); } });
    }
  };
  window.Modules.listing.get = id => REG[id];

  /* ---------- Article: a long-form body ----------
     Modules.article(el, {
       back,      { label, href }: a small link back to the index, above the title.
       meta,      { category, date, read, author } (any subset, in that order) or an array of strings: the meta line.
       title,     the page h1 (the title block). Leave it out for a body-only section.
       lead,      the deck under the h1 (the shared lead part).
       cta,       { label, href }: one white button under the title and lead (a report's "Download Report").
       image,     { src, alt, caption }: the lead image under the title.
       body,      [{ type, ... }], in order:
                    'h2' | 'h3'  { text, id }      a heading; id (or one made from the text) is its anchor
                    'p'          { html } or { text }  a paragraph; html may hold links, <strong>, <em>, <code>
                    'ul' | 'ol'  { items: [html] }
                    'quote'      { html | text, cite }
                    'img'        { src, alt, caption }
       toc,       a title ("Table of Contents"): the contents beside the body, made from its h2s (in Title Case, as the
                  h2s render); the one you are reading is marked. Phones show it above the body.
       profile,   { label, name, text, rows: [{ key, value, href }] }: a fact card at the top of the contents column (a
                  case study's "About the Client": the client, its description, HQ and website). Works with or without toc.
       note,      true: small print (end matter such as "About BitGo", disclaimers, legal footers).
       --- added 2026-11-17 (status: review) ---
       back.icon  a live glyph ("←") set before the label as text, in place of the drawn arrow.
       body 'ul' | 'ol' items may also be { html, items, type }: an item with a nested list (type 'ul' by default). Only an
                  ol's own items are numbered; nested lists (also ones written inside an item's html) keep their own marks.
       toc,       may be { label, hidden: true }: the sticky contents column with no visible heading (label names the nav).
       aside,     { date, groups: [{ title, links: [{ label, href, icon }] }] }: a sidebar in the contents column (a press
                  release's date, Media Inquiries, Press Resources); icon is the link's live glyph ("↗", "→"), set as text.
       share,     { label, aria, url, title, items: [{ network: 'linkedin' | 'x' | 'email' | 'copy', aria }] }: a row of icon
                  links under the aside: LinkedIn and X share url, email sends title and url, copy puts url on the clipboard.
     })
     A page usually calls it twice: once for the title block (#hero) and once for the body, so the curtain can calm
     behind the reading column (gl.js looks). Inline links keep their place in the text; links the preview router
     can't open stay readable text. */
  const slug = t => String(t).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const list = (type, items) => `<${type} class="ar-list">${items.map(i => typeof i === 'string' ? `<li>${i}</li>` : `<li>${i.html || ''}${i.items ? list(i.type || 'ul', i.items) : ''}</li>`).join('')}</${type}>`;
  const SHARE = {
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-1.8 3.77-1.8 4.03 0 4.37 2.6 4.37 5.5v5.8h-4v-5.1c0-1.25-.02-2.85-1.74-2.85-1.74 0-2.26 1.36-2.26 2.76v5.19h-4v-11Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.09 14.5Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>'
  };
  const shareHref = (n, u, t) => { const U = encodeURIComponent(u), T = encodeURIComponent(t || '');
    return n === 'linkedin' ? `https://www.linkedin.com/sharing/share-offsite/?url=${U}` : n === 'x' ? `https://twitter.com/intent/tweet?text=${T}&url=${U}` : `mailto:?subject=${T}&body=${U}`; };
  const glyph = g => `<span class="ar-glyph">${esc(g)}</span>`;
  const block = b => {
    const inner = b.html != null ? b.html : esc(b.text);
    switch (b.type) {
      case 'h2': case 'h3': case 'h4': return `<${b.type} id="${esc(b.id || slug(b.text))}">${esc(b.text)}</${b.type}>`;
      case 'ul': case 'ol': return list(b.type, b.items);
      case 'quote': return `<blockquote class="ar-quote"><p>${inner}</p>${b.cite ? `<p class="ar-cite">${esc(b.cite)}</p>` : ''}</blockquote>`;
      case 'img': return `<figure class="ar-fig"><img src="${esc(b.src)}" alt="${esc(b.alt || '')}" loading="lazy" decoding="async">${b.caption ? `<figcaption><p>${esc(b.caption)}</p></figcaption>` : ''}</figure>`;
      default: return `<p>${inner}</p>`;
    }
  };
  window.Modules.article = function (el, o) {
    el.classList.add('m-article'); if (o.note) el.classList.add('ar-note');
    const m = o.meta, mline = !m ? '' : Array.isArray(m) ? `<p class="ar-meta">${m.map(x => `<span>${esc(x)}</span>`).join('')}</p>`
      : `<p class="ar-meta">${m.category ? `<b>${esc(m.category)}</b>` : ''}${['date', 'read', 'author'].filter(k => m[k]).map(k => `<span>${esc(m[k])}</span>`).join('')}</p>`;
    const head = o.title || o.back || o.meta || o.lead || o.cta ? `<header class="ar-head">${o.back ? `<a class="ar-back" href="${esc(o.back.href)}">${o.back.icon ? glyph(o.back.icon) + ' ' : arrow}<span>${esc(o.back.label)}</span></a>` : ''}${mline}${o.title ? `<h1 data-rv>${esc(o.title)}</h1>` : ''}${o.lead ? `<p class="lead ar-deck" data-rv>${esc(o.lead)}</p>` : ''}${o.cta ? `<div class="ar-cta" data-rv><a class="btn white" href="${esc(o.cta.href)}">${esc(o.cta.label)}${arrow}</a></div>` : ''}</header>` : '';
    const lead = o.image ? `<figure class="ar-lead" data-rv><img src="${esc(o.image.src)}" alt="${esc(o.image.alt || '')}" decoding="async">${o.image.caption ? `<figcaption><p>${esc(o.image.caption)}</p></figcaption>` : ''}</figure>` : '';
    const body = o.body || [], h2s = body.filter(b => b.type === 'h2');
    const pf = o.profile, prof = pf ? `<div class="ar-prof"><p class="ar-prof-l">${esc(pf.label)}</p><p class="ar-prof-n">${esc(pf.name)}</p>${pf.text ? `<p class="ar-prof-t">${esc(pf.text)}</p>` : ''}${pf.rows && pf.rows.length ? `<dl>${pf.rows.map(r => `<div><dt>${esc(r.key)}</dt><dd>${r.href ? `<a href="${esc(r.href)}">${esc(r.value)}</a>` : esc(r.value)}</dd></div>`).join('')}</dl>` : ''}</div>` : '';
    const tl = o.toc && typeof o.toc === 'object' ? o.toc : { label: o.toc };
    const nav = o.toc && h2s.length ? `<nav aria-label="${esc(tl.label)}"${tl.hidden ? ' class="ar-nav-bare"' : ''}>${tl.hidden ? '' : `<h2>${esc(tl.label)}</h2>`}<ul>${h2s.map(b => `<li><a href="#${esc(b.id || slug(b.text))}">${esc(Parts.titleCase(b.text))}</a></li>`).join('')}</ul></nav>` : '';
    const as = o.aside, side = as ? `<div class="ar-side">${as.date ? `<p class="ar-date">${esc(as.date)}</p>` : ''}${(as.groups || []).map(g => `<div class="ar-sgrp">${g.title ? `<h2>${esc(g.title)}</h2>` : ''}${g.links.map(l => `<a href="${esc(l.href)}"><span>${esc(l.label)}</span>${l.icon ? ' ' + glyph(l.icon) : ''}</a>`).join('')}</div>`).join('')}</div>` : '';
    const sh = o.share, share = sh ? `<div class="ar-share" role="group"${sh.aria ? ` aria-label="${esc(sh.aria)}"` : ''}>${sh.label ? `<p>${esc(sh.label)}</p>` : ''}${sh.items.map(i => i.network === 'copy'
      ? `<button type="button" class="ar-sh" data-copy="${esc(sh.url)}"${i.aria ? ` aria-label="${esc(i.aria)}"` : ''}>${SHARE.copy}</button>`
      : `<a class="ar-sh" href="${esc(shareHref(i.network, sh.url, sh.title))}"${i.aria ? ` aria-label="${esc(i.aria)}"` : ''}${i.network === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"'}>${SHARE[i.network] || ''}</a>`).join('')}</div>` : '';
    const toc = nav || prof || side || share ? `<aside class="ar-toc">${prof}${side}${share}${nav}</aside>` : '';
    const text = body.length ? `<div class="ar-text">${body.map(block).join('')}</div>` : '';
    if (head) el.classList.add('ar-top');   // a title block clears the nav
    el.innerHTML = `<div class="wrap"><div class="ar-in${toc ? ' has-toc' : ''}">${head}${lead}${text || toc ? `<div class="ar-body">${text}${toc}</div>` : ''}</div></div>`;
    el.querySelectorAll('.ar-sh[data-copy]').forEach(b => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1400); } catch (e) {} }));
    if (!nav) return;
    /* the contents follow the reading position: the last h2 above the upper third of the screen is marked */
    const links = [...el.querySelectorAll('.ar-toc nav a')], heads = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));   // by id: live anchors may start with a digit (not a valid selector)
    links.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); heads[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', a.getAttribute('href')); }));
    let tick = false;
    const mark = () => { tick = false; let k = 0; heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * .34) k = i; }); links.forEach((a, i) => { a.classList.toggle('on', i === k); i === k ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); }); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(mark); } }, { passive: true });
    mark();
  };
})();
