/* OTC Trading (bitgo.com/products/otc-trading/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> picture, its kind):
     hero        heroPrimary                 Modules.hero          depth, 3D (deep liquidity on both sides: room to trade size)
     trust       logoCloud                   Modules.logos         marquee
     approach    headline+listWithImage(4)   Modules.textlist      intro beside the four offering rows (the page's second list with image; the one
                                                                     pinned list goes to why). NEEDS: a wrapping lockup lead, to make this lockup name rows
     liquidity   feature                     Modules.split         lineGlobe, line scene (aggregated liquidity across regions and counterparties), right
     confidence  feature                     Modules.split         no picture. NEEDS: the vault model (qualified custody behind the trade), outside the budget
     why         headline+listWithImage(3)   Modules.pinned scroll dotGlobe, dot scene, in the pinned spot (custody, execution and settlement through Go
                                                                     Network across markets; it replays per item)
     explore     headline+multicard(3)       Modules.multicard     3x: UI gmElectronic (an order over the API fills), gmFinancing (USDC against BTC,
                                                                     holdings not sold); the Research card has no picture (NEEDS)
     cta         ctaBanner                   Modules.banner { panel:false }
     news        newsletter                  renderNewsModule
   UI arts gmElectronic, gmFinancing: shared/system/ui-arts.js.            */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'depth', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.textlist($('#approach'), { title: P.approach.title, text: P.approach.text, items: P.approach.items, side: 'right' });   // the lockup's one-line lead cannot hold this paragraph (NEEDS)
  Modules.split($('#liquidity'), { title: P.liquidity.title, text: P.liquidity.text, cta: P.liquidity.cta, side: 'right', visual: { scene: 'lineGlobe', opts: { routes: 5, lead: true } } });
  Modules.split($('#confidence'), { title: P.confidence.title, text: P.confidence.text, cta: P.confidence.cta, side: 'left', visual: null });
  Modules.pinned($('#why'), { mode: 'scroll', title: P.why.title, items: P.why.items, side: 'right', expose: '__why', visual: Modules.scene('dotGlobe', { arcs: 17 }) });   // list with image = the approved pinned list
  Modules.multicard($('#explore'), { title: P.explore.title, text: P.explore.text, cards: P.explore.cards.map((c, i) => Object.assign({ title: c.label, text: c.title, href: c.href }, [{ art: 'gmElectronic' }, { art: 'gmFinancing' }, {}][i])) });   // href: the whole card links, as live
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
