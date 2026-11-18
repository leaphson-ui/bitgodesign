/* Events (bitgo.com/events). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroSecondary: Events / 2026, h1, deck, Request a    Modules.listing { hero (+ link) }   the shared hero; Request a Meeting
               Meeting (a form modal), View Events ↓; the globe     (a form on live) opens the shared Connect page; View Events jumps to
               canvas with its region and location selects           the explorer. No 3D: the explorer below is the map
     explorer  eventsPage__explorer: region filters with counts,     Modules.listing { tabs (+ count), map, layout: 'rows', thumb: 'date',
               Map / List, the world map with a marker per place     group: 'month', meta: ['place'], empty }   map view: a plain
               (a card per place), the list by month                graticule (no live map drawing: NEEDS), a pin per place and its card,
                                                                     the location menu; list view (the start): date tiles by month
     news      newsletter                                            renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, E = P.explorer, $ = s => document.querySelector(s);
  Page.start();
  Modules.listing($('#hero'), { hero: { eyebrow: P.hero.eyebrow, title: P.hero.title.join(' '), lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, link: P.hero.link } });
  Modules.listing($('#explorer'), { tabs: E.tabs, tabsLabel: E.tabsLabel, posts: E.posts, map: E.map, layout: 'rows', thumb: 'date', group: 'month', meta: ['place'], empty: E.empty });
  renderNewsModule($('#news'));
  Page.finish();
})();
