/* Delivery vs. Payment (bitgo.com/products/go-network-dvp/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module):
     hero       heroPrimary            Modules.hero          bridge (settlement that crosses institutions without waiting)
     trust      logoCloud              Modules.logos         marquee
     built      headline+4 cards       Modules.lockup        the homepage Established rows, the card title in the name column, each row links as live
                                                               NEEDS: the live labels (Settlement, Custody, Scale, Efficiency) and link labels have no slot in a row
     design     feature                Modules.split         nodeMesh (two legs of a trade cross one link at the same moment and both ends settle
                                                               together; the section's own three parts, regulated custody, real-time settlement and
                                                               offchain transactions, label the first nodes), right
     realworld  list                   Modules.textlist      intro beside the five use-case rows, rows on the right as live (list--right)
     trusted    headline               Modules.section
     faq        headline+faq           Modules.faq
     cta        ctaBanner              Modules.banner { panel:false }
     news       newsletter             renderNewsModule
   Scene nodeMesh (scenes.js). No UI art on this page (dvpSettle in shared/arts/go-network-dvp.js is no longer placed).            */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { lead: P.hero.lead, eyebrow: P.hero.eyebrow, title: P.hero.title, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'bridge', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.lockup($('#built'), { title: P.built.title, text: P.built.text, rows: P.built.cards.map(c => ({ label: c.label, name: c.title, text: c.text, href: c.cta && c.cta.href, go: c.cta && c.cta.label })) });
  const parts = P.design.text[0].match(/combining (.+?), and (.+?), institutions/).slice(1).join(', ').split(', ').map(w => w.charAt(0).toUpperCase() + w.slice(1));   // regulated custody, real-time settlement, offchain transactions
  Modules.split($('#design'), { title: P.design.title, text: P.design.text, cta: P.design.cta, side: 'right', visual: { scene: 'nodeMesh', opts: { nodes: 11, labels: parts } } });
  Modules.textlist($('#realworld'), { title: P.realworld.title, text: P.realworld.text, items: P.realworld.items, side: 'right' });
  Modules.section($('#trusted'), P.trusted);
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
