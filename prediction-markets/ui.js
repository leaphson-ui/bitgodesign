/* Prediction Markets (bitgo.com/products/prediction-markets/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> picture, its kind):
     hero        heroPrimary           Modules.hero          orbit-globe, 3D (if the world is watching: events everywhere, one instrument)
     trust       logoCloud             Modules.logos         marquee
     first       headline              Modules.section
     view        feature               Modules.split         UI pmView (pick a market, take the Yes side, filled through the OTC desk)
     collateral  feature               Modules.split         barsNodes, line scene (put existing holdings to work: stakes that grow and compound; no labels)
     platform    feature               Modules.split         UI pmPlatform (one BitGo relationship lights each product in turn)
     partners    headline+2 cards      Modules.section + two mirrored Modules.split (the Self-Custody key-management pair)
       partners-a                        asciiMark, ASCII: '$' in green money glyphs ($100B+ digital assets on platform)
       partners-b                        no picture. NEEDS: a fitting visual (Susquehanna Crypto's mark, or the depth model, is outside this page's budget)
     markets     headline+4 cards      Modules.lockup        the homepage Established rows, the market name in the logo column
     cta         ctaBanner             Modules.banner { panel:false }
     news        newsletter            renderNewsModule
   UI arts pmView, pmPlatform: shared/arts/prediction-markets.js (review). Scene labels are live words from the section's own copy. */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { lead: P.hero.lead, eyebrow: P.hero.eyebrow, title: P.hero.title, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'orbit-globe', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#first'), P.first);
  Modules.split($('#view'), { title: P.view.title, text: P.view.text, side: 'right', visual: { ui: 'pmView' } });
  Modules.split($('#collateral'), { title: P.collateral.title, text: P.collateral.text, side: 'left', visual: { scene: 'barsNodes', opts: { bars: 22 } } });
  Modules.split($('#platform'), { title: P.platform.title, text: P.platform.text, side: 'right', visual: { ui: 'pmPlatform' } });
  // two-card section: a section headline over a mirrored pair of 50/50s (as Self-Custody's key management)
  Modules.section($('#partners'), { title: P.partners.title, text: P.partners.text });
  [['#partners-a', 'left', { scene: 'asciiMark', opts: { text: '$', theme: 'money' } }], ['#partners-b', 'right', null]].forEach(([sel, side, visual], i) => {
    const c = P.partners.cards[i];
    Modules.split($(sel), { eyebrow: c.label, title: c.title, text: [c.text], side, visual });
  });
  // four cards: the lockup name rows. The live labels are set in capitals; the name column takes them in Title Case (letter case only)
  Modules.lockup($('#markets'), { title: P.markets.title, rows: P.markets.cards.map(c => ({ name: Parts.titleCase(c.label.toLowerCase()), text: c.title })) });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
