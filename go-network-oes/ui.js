/* Off-Exchange Settlement (bitgo.com/products/go-network-oes/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroPrimary            Modules.hero          lock-2 (locked by default: assets stay in custody while you trade; the live hero is a padlock)
     trust     logoCloud              Modules.logos         marquee
     standard  headline+multicard(3)  Modules.multicard     3x: UI oesCustody (Mitigate risk), oesAllocate (Increase capital efficiency),
                                                              lineZigzag (Optimize operations: the hops between venues fade and settlement runs
                                                              direct, automated and offchain)
     yours     feature                Modules.split         lineArches (Your Assets, Your Control: every asset in its own bay, in your name, read in
                                                              turn: never transferred or rehypothecated), right
     easy      headline+4 cards       Modules.lockup        the homepage Established rows, the card title in the name column, linked rows where live links,
                                                              the live step label over each name (label), each link's live label as its name (go)
     partners  headline + logo grid   Modules.logos { headline }  the shared section headline over the eight live partner marks (captured by capture.py)
     more      headline               Modules.section
     faq       headline+faq           Modules.faq
     cta       ctaBanner              Modules.banner { panel:false }
     news      newsletter             renderNewsModule
   UI arts oesCustody, oesAllocate: shared/arts/go-network-oes.js (+ .css), status review. Scenes lineZigzag, lineArches (scenes.js). */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { lead: P.hero.lead, eyebrow: P.hero.eyebrow, title: P.hero.title, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'lock-2', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.multicard($('#standard'), { eyebrow: P.standard.eyebrow, title: P.standard.title, text: P.standard.text, cards: P.standard.cards.map((c, i) => Object.assign({ title: c.title, text: c.text, cta: c.cta }, [{ art: 'oesCustody' }, { art: 'oesAllocate' }, { scene: 'lineZigzag', opts: { hops: 4 } }][i])) });
  Modules.split($('#yours'), { eyebrow: P.yours.eyebrow, title: P.yours.title, text: P.yours.text, cta: P.yours.cta, side: 'right', visual: { scene: 'lineArches', opts: { count: 7 } } });
  Modules.lockup($('#easy'), { title: P.easy.title, text: P.easy.text, rows: P.easy.cards.map(c => ({ label: c.label, name: c.title, text: c.text, href: c.cta && c.cta.href, go: c.cta && c.cta.label })) });
  Modules.logos($('#partners'), { headline: true, eyebrow: P.partners.eyebrow, title: P.partners.title, text: P.partners.text, logos: P.partners.logos });   // the shared section headline over the live partner marks
  Modules.section($('#more'), P.more);
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
