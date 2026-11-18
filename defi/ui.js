/* DeFi (bitgo.com/products/defi/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero       heroPrimary                 Modules.hero           ledger (onchain: every asset on one chain of records)
     trust      logoCloud                   Modules.logos          marquee
     paths      headline+accordion(3)       Modules.pinned swap    the homepage Core Services interaction: the headline opens it (title in two
                                                                     lines, the second in serif italic, its lead under it); items title/short/long;
                                                                     lineZigzag in the pinned spot (from vault strategies to direct protocol access: the
                                                                     middle hops fade and the line runs direct)
     controls   headline+multicard(3)       Modules.multicard      3x: springStrings (the Policy Engine's own four controls as the tiers: approved
                                                                     protocols, addresses, spending thresholds, asset restrictions), lineSkyline (secure
                                                                     wallet architecture, built layer on layer), UI dfAudit (each interaction with full
                                                                     context; protocol exposure from one dashboard)
     vaults     headline+featureList3(3)    Modules.multicard      3x headed by the live headline: no picture on Select your strategy (NEEDS: the page's
                                                                     two UI arts are placed and its scene share is spent),
                                                                     UI dfDeposit (assets in, receipt tokens issued, secured in qualified custody),
                                                                     barsNodes (allocations and rewards that grow, compound and harvest). featureList3 maps to the swap, and the page's one swap is paths: see the report
     vaults-a   multicard card (Concrete)   Modules.split          the live Concrete mark over dotRings (earn while the principal stays at the core, in
                                                                     qualified custody), right
     vaults-b   multicard card (Morpho)     Modules.split          the live Morpho mark over dotGlobe (onchain credit markets with global liquidity),
                                                                     left. NEEDS: the live card links with no label (a split has no whole-section link)
     dapps      headline+listWithImage(3)   Modules.pinned scroll  logo3d WalletConnect mark in the pinned spot, visual left as live; eyebrow, headline and lead on top.
     cta        ctaBanner                   Modules.banner { panel:false }
     news       newsletter                  renderNewsModule
   UI arts dfAudit, dfDeposit: shared/arts/defi.js (+ .css), status review (dfPolicy, dfStrategy there are no longer placed).
   Scenes lineZigzag, springStrings, lineSkyline, barsNodes, dotRings, dotGlobe (scenes.js); no live-site imagery (the user, 2026-11-17). Marks: shared/assets/logos/defi/
   (concrete.svg, morpho.svg, from the live cards' inline SVG).                                                                                          */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'ledger', fit: 1, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.pinned($('#paths'), { mode: 'swap', title: P.paths.title, text: P.paths.text, items: P.paths.items, expose: '__paths', trackId: 'pathsTrack', visual: Modules.scene('lineZigzag', { hops: 3 }) });   // accordion = the approved swap
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1), policy = P.controls.cards[0].text.match(/define (.+?) and (.+?), set (.+?) and (.+?) that/).slice(1).map(cap);   // the Policy Engine's four controls
  Modules.multicard($('#controls'), { title: P.controls.title, text: P.controls.text, cards: P.controls.cards.map((c, i) => Object.assign({}, c, [{ scene: 'springStrings', opts: { labels: policy } }, { scene: 'lineSkyline', opts: { lead: true } }, { art: 'dfAudit' }][i])) });
  Modules.multicard($('#vaults'), { eyebrow: P.vaults.eyebrow, title: P.vaults.title, text: P.vaults.text, cards: P.vaults.cards.map((c, i) => Object.assign({ title: c.title, text: c.text }, [{}, { art: 'dfDeposit' }, { scene: 'barsNodes', opts: { bars: 18 } }][i])) });
  P.partners.forEach((c, i) => Modules.split($(`#vaults-${'ab'[i]}`), { title: c.title, text: c.text, cta: c.cta || undefined, side: i ? 'left' : 'right', visual: [{ logo: '../shared/assets/logos/defi/concrete.svg', alt: c.title, scene: 'dotRings', opts: { rings: 5, beam: false }, logoAt: 'top' }, { logo: '../shared/assets/logos/defi/morpho.svg', alt: c.title, scene: 'dotGlobe', opts: { arcs: 12, beam: false }, logoAt: 'top' }][i] }));   // each partner's live mark over its idea
  Modules.pinned($('#dapps'), { mode: 'scroll', eyebrow: P.dapps.eyebrow, title: P.dapps.title, text: P.dapps.text, items: P.dapps.items, expose: '__dapps', visual: '<div class="slot" data-model="logo3d" data-partner="walletconnect" data-fit="0.78" data-align="center" aria-hidden="true"></div>' });   // list with image = the approved pinned list
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
