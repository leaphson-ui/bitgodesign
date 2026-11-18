/* Link (bitgo.com/products/link/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero        heroPrimary (rotating word)  Modules.hero          words + rest, rise rotation; globe (capital seen across every exchange, worldwide)
     trust       logoCloud                    Modules.logos         marquee
     teams       headline (2 buttons)         Modules.section       both live buttons (cta, cta2)
     visibility  feature, media left          Modules.split         nodeMesh (every account linked into one view; the section's own BitGo and non-BitGo
                                                                      label the first nodes), left
     move        feature, media right         Modules.split         UI lkMove (10.0000 BTC from Kraken OTC to OKX in one click, tracked), right
     controls    feature, media left          Modules.split         lock (nothing moves without approval: the Policy Engine), left
     governance  feature, media right         Modules.split         UI lkRoles (one role created once, applied to every connected exchange), right
     stack       headline+multicard(3)        Modules.multicard     3x, whole-card links (card href): no picture (NEEDS: nothing in this page's budget fits qualified custody),
                                                                      gonetwork (Home's Go Network art: secure and instant settlement), lineGlobe (a
                                                                      global liquidity layer whose routes never sleep)
     cta         (no live ctaBanner)          Modules.banner { panel:false }  the page's own title (capture "title") over the shared button
     news        newsletter                   renderNewsModule
   UI arts lkMove, lkRoles: shared/arts/link.js (+ .css), status review (lkPortfolio there is no longer placed). Scenes nodeMesh, lineGlobe
   (scenes.js), gonetwork (modules.js ARTS); no live-site imagery (the user, 2026-11-17).                                                     ui-max: 3. Link is a software product; its three screens sit in three different compositions (panel, wide stage, glass).
*/
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, words: P.hero.words, rest: P.hero.rest, label: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'globe', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#teams'), { eyebrow: P.teams.eyebrow, title: P.teams.title, text: P.teams.text, cta: P.teams.ctas[0], cta2: P.teams.ctas[1] });
  Modules.split($('#visibility'), { title: P.visibility.title, text: P.visibility.text, side: 'left', visual: { ui: 'lkPortfolio', frame: 'panel', backdrop: { scene: 'nodeMesh', opts: { nodes: 12 } } } });   // the portfolio screen on an ink panel, the accounts it reads as a live mesh behind (approved composition)
  Modules.split($('#move'), { title: P.move.title, text: P.move.text, layout: 'wide', visual: { ui: 'lkMove', frame: 'glass', backdrop: { scene: 'dotRibbon' } } });   // the wide stage: one click moves capital across the whole width
  Modules.split($('#controls'), { title: P.controls.title, text: P.controls.text, side: 'left', visual: { model: 'lock', fit: 0.85 } });
  Modules.split($('#governance'), { title: P.governance.title, text: P.governance.text, side: 'right', visual: { ui: 'lkRoles', frame: 'glass' } });   // the roles screen on glass
  Modules.multicard($('#stack'), { eyebrow: P.stack.eyebrow, title: P.stack.title, cards: P.stack.cards.map((c, i) => Object.assign({ title: c.label, text: c.title, href: c.href }, [{ scene: 'dotRings', opts: { rings: 6 } }, { scene: 'grid247', opts: { cols: 24, rows: 7 } }, { scene: 'lineGlobe', opts: { routes: 6, lead: false } }][i])) });   // href: the whole card links, as live
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
