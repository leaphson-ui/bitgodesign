/* Restaking (bitgo.com/products/restaking/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero     heroPrimary            Modules.hero          shield (restake with secure, qualified custody: the assets stay protected while they work)
     trust    logoCloud              Modules.logos         marquee
     why      list (3 rows)          Modules.pinned scroll dotRings in the pinned spot (stakes in orbit that keep growing, funnelled into one beam:
                                                             continually collect rewards; replayed for each row); list on the right as live. The playbook maps a bare list to
                                                             textlist; the pinned list is used here because the rows are title + text, as Home's Own
     safe     headline+multicard(4)  Modules.lockup        the homepage Established rows, the card's live label as the row name, its sentence as the text
     eigen    announcementsBanner    Modules.split         UI skRestake (shared/arts/staking.js: native ETH restaking and EIGEN staking switch on in
                                                             self-custody cold, hot and custody wallets), visual left as live
     quote    quote                  Modules.quote         the live quote and its credit (cite)
     latest   post-list              Modules.latest
     faq      headline+faq           Modules.faq
     cta      ctaBanner              Modules.banner { panel:false }
     news     newsletter             renderNewsModule
   UI art reused: skRestake (shared/arts/staking.js + .css, status review). Scene dotRings (scenes.js).                         */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'shield', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.pinned($('#why'), { mode: 'scroll', title: P.why.title, items: P.why.items, expose: '__why', visual: Modules.scene('dotRings', { rings: 6 }) });   // list = the approved pinned list
  Modules.lockup($('#safe'), { title: P.safe.title, rows: P.safe.cards.map(c => ({ name: c.label, text: c.text })) });
  Modules.split($('#eigen'), { title: P.eigen.title, text: P.eigen.text, cta: P.eigen.cta, side: 'left', visual: { ui: 'skRestake' } });
  Modules.quote($('#quote'), { quotes: P.quotes });
  Modules.latest($('#latest'), P.latest);
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs, links: P.faqLinks });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
