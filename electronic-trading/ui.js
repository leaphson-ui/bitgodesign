/* Electronic Trading (bitgo.com/products/electronic-trading/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> picture, its kind):
     hero       heroPrimary              Modules.hero          depth, 3D (deep liquidity on both sides: aggregated liquidity, one instrument)
     trust      logoCloud                Modules.logos         marquee
     better     headline                 Modules.section
     liquidity  feature                  Modules.split         UI etLiquidity (one connection, filled across LPs, OTC desks, market makers, exchanges), left
     connect    feature                  Modules.split         dotFlow, dot scene: 'REST', 'FIX', 'WebSocket' flow in, out to the markets, right
     access     feature                  Modules.split         globe, 3D (regulated infrastructure across regions), left
     tools      feature                  Modules.split         no picture (NEEDS), right
     funding    feature                  Modules.split         UI etFunding (a buy against collateral in custody: no pre-funding, nothing sold), left
     custody    headline                 Modules.section
     more       headline+multicard(3)    Modules.multicard     3x, headed by the live "Explore BitGo Global Markets" headline and its button:
                                           no pictures (NEEDS)
     cta        ctaBanner                Modules.banner { panel:false }
     news       newsletter               renderNewsModule
   UI arts etLiquidity, etFunding: shared/arts/electronic-trading.js (review). The page has 9 picture slots and a budget of 2 models, 2 UI
   arts and 1 scene, so tools and the three cards stay without a picture (NEEDS). */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'depth', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#better'), P.better);
  Modules.split($('#liquidity'), { title: P.liquidity.title, text: P.liquidity.text, side: 'left', visual: { ui: 'etLiquidity' } });
  Modules.split($('#connect'), { title: P.connect.title, text: P.connect.text, side: 'right', visual: { scene: 'dotFlow', opts: { ins: ['REST', 'FIX', 'WebSocket'], hub: '', outs: 4 } } });
  Modules.split($('#access'), { title: P.access.title, text: P.access.text, side: 'left', visual: { model: 'globe', fit: 0.85 } });
  Modules.split($('#tools'), { title: P.tools.title, text: P.tools.text, side: 'right', visual: null });
  Modules.split($('#funding'), { title: P.funding.title, text: P.funding.text, side: 'left', visual: { ui: 'etFunding' } });
  Modules.section($('#custody'), P.custody);
  Modules.multicard($('#more'), { title: P.markets.title, text: P.markets.text, cta: P.markets.cta, cards: P.more.map((c, i) => ({ title: c.label, text: c.text, cta: c.cta })) });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
