/* Collateral Management (bitgo.com/products/collateral-management/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/collateral-management/build_content.py).
   Section map (live component -> module -> visual):
     hero         heroPrimary           Modules.hero          vault (collateral behind a real door, opened only by the right hands)
     trust        logoCloud             Modules.logos         marquee
     intro        headline              Modules.section
     triparty     feature (media left)  Modules.split         UI cmTriParty (both parties sign the ACA; the collateral moves into a tri-party account)
     monitoring   feature (media right) Modules.split         grid247, 24/7 grid (ongoing monitoring: every hour of every day, lit; no labels)
     margin       feature (media left)  Modules.split         UI gmCollateral (ui-arts.js: a margin call and a top-up from custody)
     liquidation  feature (media right) Modules.split         no picture. NEEDS: a fitting visual (a third UI art, cmLiquidate, is over the page's limit of 2)
     strength     headline+4 cards      Modules.lockup        the homepage Established rows, the card title in the name column
     markets      headline (with CTA)   Modules.section
     faq          headline+faq          Modules.faq
     cta          ctaBanner             Modules.banner { panel:false }
     news         newsletter            renderNewsModule
   UI arts cmTriParty (shared/arts/collateral-management.js, review) and gmCollateral (ui-arts.js).                                        */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'vault', fit: 0.8, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#intro'), P.intro);
  const F = P.features;   // the tri-party account, the 24/7 grid, the margin call; liquidation has no picture yet (NEEDS)
  [['#triparty', 'left', { ui: 'cmTriParty' }], ['#monitoring', 'right', { scene: 'grid247', opts: { cols: 24, rows: 7 } }], ['#margin', 'left', { ui: 'gmCollateral' }], ['#liquidation', 'right', null]]
    .forEach(([sel, side, visual], i) => Modules.split($(sel), { title: F[i].title, text: F[i].text, side, visual }));
  Modules.lockup($('#strength'), { title: P.strength.title, rows: P.strength.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.section($('#markets'), { title: P.markets.title, text: P.markets.text, cta: P.markets.cta });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
