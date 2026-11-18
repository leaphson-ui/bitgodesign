/* Newsroom (bitgo.com/press). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero       rh-hero (h1, deck, search) + rh-rnav (section bar)   Modules.listing { hero, search, tabs }   the shared hero, no 3D (no library
                                                                     model means "newsroom"; live's split-flap headline board is not a module);
                                                                     search and tabs drive #library
     library    rh-library: "All news", year buttons, text filter,   Modules.listing { title, year (style: 'buttons'), query, posts, layout: 'rows',
                month groups of rows, "Load older news"              group: 'month', more }   every row live ships (165), 10 at a time as live
     press-resources  rh-close: Contact us + Press Kit (2 cards)           Modules.article { body }   each card's title over its text, the live links in
                                                                     place (Modules.textlist would hide them: its rows give links no style)
     news       newsletter                                           renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.listing($('#hero'), { hero: { title: P.hero.title, lead: P.hero.lead }, search: P.hero.search, tabs: P.hero.tabs, target: 'library' });
  Modules.listing($('#library'), { title: P.library.title, year: P.library.year, query: P.library.query, posts: P.library.posts, layout: 'rows', group: 'month', more: P.library.more, meta: ['label', 'date'] });
  Modules.article($('#press-resources'), { body: P.resources });
  renderNewsModule($('#news'));
  Page.finish();
})();
