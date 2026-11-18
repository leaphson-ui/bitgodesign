/* Stablecoin-as-a-Service (bitgo.com/products/stablecoin-as-a-service/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for
   word from window.PAGE (content.js, built by _capture/stablecoin-as-a-service/build_content.py after capture_extra.py).
   Section map (live component -> module -> visual):
     hero          heroPrimary              Modules.hero           stablecoin (notes lift, turn to glass and land as tokens: launch your stablecoin)
     trust         logoCloud                Modules.logos          marquee
     issuers       multicard, 2 link cards  two mirrored Modules.split in #issuers-a / #issuers-b (no headline live), as on Stablecoins: each
                   (no headline)                                     card's "See Reports" link as the button; the issuer's own mark in BitGo glass (logo3d,
                                                                     partner usd1, right / partner sofi, left)
     launch        headline                 Modules.section        the shared headline over the three features below it
     reserve       feature, media right     Modules.split          UI saasReserve (allocation rebalanced to target, daily reconciliation), right
     regulatory    feature, media left      Modules.split          scene lineSkyline (built on a foundation: one outline climbing layer on layer), left
     contracts     feature, media right     Modules.split          UI saasDeploy (functions audited, deployed cross-chain), right
     report        feature, media right     Modules.report (the custom report module: a typeset edition of the report from its title, dot ribbon behind), left so the 50/50s keep alternating
                   The three features' points are live "- " paragraphs, carried verbatim as the split's text (NEEDS: a bullet-list option).
     issue         list (rows right)        Modules.textlist       the intro beside the five live rows
     institutions  headline+multicard(6)    Modules.lockup         the homepage Established rows; Trading and 24/7 Settlement link as live (go: live label)
     quote         quoteCarousel (2)        Modules.quote          the two quotes with their live credits and company marks (SoFi, WLFI)
     faq           faq (title "FAQs")       Modules.faq
     cta           ctaBanner                Modules.banner { panel:false }
     news          newsletter               renderNewsModule
   UI arts saasReserve, saasDeploy: shared/arts/stablecoin-as-a-service.js (+ .css). Kinds: 3D models (hero, issuer marks in glass), line scene, report module,
   UI.                                                                                              */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'stablecoin', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  P.issuers.forEach((c, i) => Modules.split($(`#issuers-${'ab'[i]}`), { title: c.title, text: [c.text], cta: c.cta, side: i ? 'left' : 'right', visual: { model: 'logo3d', partner: ['usd1', 'sofi'][i], fit: 0.9 } }));   // the issuer's own mark in BitGo glass
  Modules.section($('#launch'), { title: P.launch.title, text: P.launch.text });
  [['#reserve', P.reserve, 'right', { ui: 'saasReserve' }], ['#regulatory', P.regulatory, 'left', { scene: 'lineSkyline', opts: { lead: true } }], ['#contracts', P.contracts, 'right', { ui: 'saasDeploy' }]]
    .forEach(([sel, D, side, visual]) => Modules.split($(sel), { eyebrow: D.eyebrow, title: D.title, text: D.text, side, visual }));
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, text: P.report.text, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'left' });   // the custom report module
  Modules.textlist($('#issue'), { title: P.issue.title, text: P.issue.text, items: P.issue.items });
  Modules.lockup($('#institutions'), { title: P.institutions.title, text: P.institutions.text, rows: P.institutions.cards.map(c => ({ name: c.title, text: c.text, href: c.href, go: c.linkLabel })) });
  Modules.quote($('#quote'), { quotes: P.quotes });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
