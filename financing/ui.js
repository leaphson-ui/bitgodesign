/* Financing (bitgo.com/products/financing/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module):
     hero       heroPrimary           Modules.hero          vault (collateral held behind a real door while you borrow)
     trust      logoCloud             Modules.logos         marquee
     access     headline              Modules.section
     loans      feature               Modules.split         UI fiLoan (6 BTC and 120 staked ETH pledged, 250,000 USDC drawn: the live figures)
     portfolio  feature               Modules.split         UI fiPortfolio (every holding in the account adds to one borrowing power)
     earn       feature               Modules.split         UI fiEarn (USDC lent earns interest, staked ETH earns rewards, in custody)
     needs      listWithImage         Modules.pinned scroll towers in the pinned spot, visual left as live and Home's Own (institutions: whole companies)
     control    headline+4 cards      Modules.lockup        the homepage Established rows, the feature name in the logo column
     markets    headline (with CTA)   Modules.section
     faq        headline+faq          Modules.faq
     cta        ctaBanner             Modules.banner { panel:false }
     news       newsletter            renderNewsModule
   The live features carry a short line under the title ("Liquidity without liquidation."): it leads the text, in live order. */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'vault', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#access'), P.access);
  // three different pictures: the loan as a product screen; a portfolio as linked holdings; earning as rewards that compound
  [['#loans', P.loans, 'left', { ui: 'fiLoan' }], ['#portfolio', P.portfolio, 'right', { scene: 'nodeMesh', opts: { nodes: 11 } }], ['#earn', P.earn, 'left', { scene: 'barsNodes', opts: { bars: 22 } }]].forEach(([sel, D, side, visual]) =>
    Modules.split($(sel), { title: D.title, text: [D.eyebrow, ...D.text], side, visual }));
  Modules.pinned($('#needs'), { mode: 'scroll', title: P.needs.title, text: P.needs.text, items: P.needs.items, expose: '__needs', visual: '<div class="slot" data-model="towers" data-fit="0.85" data-align="center" aria-hidden="true"></div>' });   // list with image = the approved pinned list
  Modules.lockup($('#control'), { title: P.control.title, text: P.control.text, rows: P.control.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.section($('#markets'), { title: P.markets.title, text: P.markets.text, cta: P.markets.cta });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
