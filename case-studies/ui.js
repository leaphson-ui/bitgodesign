/* Case studies index (bitgo.com/resources/case-studies/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word
   from window.PAGE. The blog index's build: the live page is the same template.
   Section map (live component -> module):
     hero      blogHero: brand, h1 "Built with" + the BitGo shield,   Modules.listing { hero (+ mark, sr), search, tabs }   the shared
               the hidden companies line, deck, search + rh-rnav      hero (no 3D); search and tabs drive #library. Live's network of
               (category bar)                                         client logos around the shield is not carried (NEEDS)
     latest    rh-front: rh-lead (Featured) + 3 cards                 Modules.listing { featured, posts, layout: 'grid' }
     library   blogLibrary: All case studies, year + text filter,     Modules.listing { title, year, query, layout: 'rows', thumb: 'logo' }
               rows with client logos                                 every case study (live shows all 18; no "Load more" left)
     news      newsletter                                             renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.listing($('#hero'), { hero: { eyebrow: P.hero.eyebrow, title: P.hero.title, mark: P.hero.mark, sr: P.hero.sr, lead: P.hero.lead }, search: P.hero.search, tabs: P.hero.tabs, tabsLabel: P.hero.eyebrow, target: 'library' });
  Modules.listing($('#latest'), { featured: P.latest.featured, posts: P.latest.posts, layout: 'grid', meta: ['label', 'category', 'date', 'read'] });
  Modules.listing($('#library'), { title: P.library.title, year: P.library.year, query: P.library.query, posts: P.library.posts, layout: 'rows', thumb: 'logo', meta: ['category', 'date', 'read'] });
  renderNewsModule($('#news'));
  Page.finish();
})();
