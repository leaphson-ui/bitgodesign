/* Staking (bitgo.com/products/staking/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero        heroPrimary (rotating end)    Modules.hero          head + words: the live trailing rotation (rise); validators (independent nodes secure
                                                                       the network, rewards flow back out from the core)
     trust       logoCloud                     Modules.logos         marquee
     simple      headline+listWithImage(4)     Modules.pinned scroll dotRibbon in the pinned spot, visual left as live (staking gone digital: one ribbon of
                                                                       thousands of stakes, replayed for each item)
     execution   feature                       Modules.split         UI skTimeline (the live timeline: admin approval, BitGo signs the 92 ETH delegation,
                                                                       activation, positions earning), right
     compliant   feature                       Modules.split         lineArches (true protocol staking, no pooling: every asset in its own bay), left
     validators  feature                       Modules.split         UI skValidators (the live validator partners pass due diligence in turn), right
     bitcoin     headline+multicard(3)         Modules.multicard     3x, each card's live label and link, each partner's live mark (Babylon, Core,
                                                                       EigenCloud; inline SVG from the live cards, shared/assets/logos/staking/)
     how         headline+multicard(3)         Modules.multicard     3x: no picture on Select Your Asset (NEEDS: the page's two UI arts are placed and no
                                                                       scene fits), staking (the homepage card art: rewards radiate from the delegated stake),
                                                                       lineSteps (View Rewards: rewards that climb epoch by epoch, the line retracing them)
     clients     headline + logo grid          Modules.logos { headline }   the shared section headline over the marquee
     deploy      standaloneText (1 sentence)   Modules.statement     the approved scroll-lit statement (one line, no figure)
     faq         faq                           Modules.faq           eyebrow, paragraph answers, the Terms link set in place (links)
     fine        entity disclosure             Modules.fineprint
     cta         ctaBanner                     Modules.banner { panel:false }
     news        newsletter                    renderNewsModule
   UI arts skTimeline, skValidators: shared/arts/staking.js (+ .css), status review (the other staking arts are not placed here).
   Scenes dotRibbon, lineArches, lineSteps (scenes.js), staking (modules.js ARTS). No live-site imagery (the user, 2026-11-17).       */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, head: P.hero.head, words: P.hero.words, label: P.hero.h1, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'validators', fit: 1, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.pinned($('#simple'), { mode: 'scroll', title: P.simple.title, items: P.simple.items, expose: '__simple', visual: Modules.scene('dotRibbon') });   // list with image = the approved pinned list
  Modules.split($('#execution'), { title: P.execution.title, text: P.execution.text, side: 'right', visual: { ui: 'skTimeline' } });
  Modules.split($('#compliant'), { title: P.compliant.title, text: P.compliant.text, side: 'left', visual: { scene: 'lineArches', opts: { count: 6 } } });
  Modules.split($('#validators'), { title: P.validators.title, text: P.validators.text, side: 'right', visual: { ui: 'skValidators' } });
  Modules.multicard($('#bitcoin'), { title: P.bitcoin.title, cards: P.bitcoin.cards.map((c, i) => ({ label: c.label, title: c.title, text: c.text, cta: c.cta, image: `../shared/assets/logos/staking/${['babylon', 'core', 'eigencloud'][i]}.svg`, alt: c.title })) });   // each partner's live mark
  Modules.multicard($('#how'), { title: P.how.title, cards: P.how.cards.map((c, i) => Object.assign({ title: c.title, text: c.text, cta: c.cta }, [{}, { art: 'staking' }, { scene: 'lineSteps', opts: { steps: 6, lead: false } }][i])) });
  Modules.logos($('#clients'), { headline: true, title: P.clients.title, logos: B.trust.logos });
  Modules.statement($('#deploy'), { lines: P.deploy.text.map(text => ({ text })) });   // a one-sentence standaloneText is the approved scroll-lit statement
  Modules.faq($('#faq'), { eyebrow: P.faqEyebrow, title: P.faqTitle, items: P.faqs, links: P.faqLinks });
  Modules.fineprint($('#fine'), P.fine);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
