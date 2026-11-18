/* BitGo Research (bitgo.com/research/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   The blog index's build (the live page is the same research-hub template), plus its covers, charts and month groups.
   Section map (live component -> module):
     hero          rh-hero (lockup, h1, deck, search) + rh-rnav     Modules.listing { hero (+ logo), search, tabs }   the shared hero, no 3D;
                   (brand, jumps, topic filters)                    the lockup is the live mark; topics filter #library in place, as live
     latest        rh-front: rh-lead (Latest, byline) + 2 cards     Modules.listing { featured (+ byline), posts, cols: 2, side }
                   + rh-most "Selected research" (4)
     reports       rh-reports: Flagship reports, 10 covers          Modules.listing { title, text, layout: 'covers', mark }   live's covers are
                                                                    drawn type on a gradient (no picture): glass covers, the lockup mark
     white-papers  rh-reports: White papers, 6 covers               Modules.listing { title, layout: 'covers', mark }
     library       rh-library: All research, filter, month groups,  Modules.listing { title, query, layout: 'rows', group: 'month', more }
                   rows, "Load older research"                      the live archive, 10 at a time as live
     charts        rh-charts: 3 charts (Embed, PNG), sources line   Modules.listing { title, text, layout: 'charts', note }   the live
                                                                    chart drawings (data, saved by capture_extra.py); Embed and PNG work
     close         rh-close: "Research, delivered to your inbox."   Modules.section (the live email form is the shared newsletter below)
     news          newsletter                                       renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.listing($('#hero'), { hero: { logo: P.hero.logo, title: P.hero.title.join(' '), lead: P.hero.lead }, search: P.hero.search, tabs: P.hero.tabs, tabsLabel: P.hero.tabsLabel, target: 'library' });
  Modules.listing($('#latest'), { featured: P.latest.featured, posts: P.latest.posts, cols: 2, side: P.latest.side, meta: ['label', 'category', 'date', 'read'] });
  Modules.listing($('#reports'), { title: P.reports.title, text: P.reports.text, posts: P.reports.posts, layout: 'covers', mark: P.reports.mark });
  Modules.listing($('#white-papers'), { title: P.papers.title, posts: P.papers.posts, layout: 'covers', mark: P.reports.mark });
  Modules.listing($('#library'), { title: P.library.title, query: P.library.query, posts: P.library.posts, layout: 'rows', group: 'month', more: P.library.more, meta: ['category', 'date', 'read'] });
  Modules.listing($('#charts'), { title: P.charts.title, text: P.charts.text, posts: P.charts.posts, layout: 'charts', note: P.charts.note });
  Modules.section($('#close'), { title: P.close.title, text: P.close.text });
  renderNewsModule($('#news'));
  Page.finish();
})();
