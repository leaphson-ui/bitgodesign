/* Blog index (bitgo.com/resources/blog/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      blogHero (h1, deck, search) + rh-rnav (category bar)   Modules.listing { hero, search, tabs }   the shared hero (no 3D: no
                                                                     library model means "blog"); search and tabs drive #library
     latest    rh-front: rh-lead (Featured) + blogHighlights (3)     Modules.listing { featured, posts, layout: 'grid' }
     library   blogLibrary: All articles, year + text filter,        Modules.listing { title, year, query, layout: 'rows', more }   the live
               rows, "Load more articles"                                         archive (every post), 18 at a time as live
     research  rh-close: "Research, delivered to your inbox."        Modules.section (title + text; the live email form is the shared
                                                                     newsletter just below)
     news      newsletter                                            renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.listing($('#hero'), { hero: { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead }, search: P.hero.search, tabs: P.hero.tabs, tabsLabel: P.hero.eyebrow, target: 'library' });
  Modules.listing($('#latest'), { featured: P.latest.featured, posts: P.latest.posts, layout: 'grid', meta: ['label', 'category', 'date', 'read'] });
  Modules.listing($('#library'), { title: P.library.title, year: P.library.year, query: P.library.query, posts: P.library.posts, layout: 'rows', more: P.library.more });
  Modules.section($('#research'), { title: P.research.title, text: P.research.text });
  renderNewsModule($('#news'));
  Page.finish();
})();
