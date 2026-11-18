/* Settlement (bitgo.com/products/settlement/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/settlement/build_content.py).
   Section map (live component -> module -> visual):
     hero     heroPrimary (rotating)  Modules.hero { words, rest }  bridge (settlement that crosses institutions without waiting); the
                                                                    live rotating word set in the rise style, as Qualified Custody
     network  headline+2 cards        Modules.section + two mirrored Modules.split in #network-a / #network-b (the Self-Custody key-management pair, as prime/settle)
                                        UI stDvp (both sides execute simultaneously, in custody) / dotGlobe (settlement arcs between
                                        trading venues around the world: off-exchange settlement with the partners)
     uses     list                    Modules.textlist      the rows on the right, as live
     rules    headline+multicard(3)   Modules.multicard     3x: UI stSecure (bankruptcy-remote, insured); springStrings (risk at every layer: the
                                                                    card's own Counterparty, exchange, operational as the tiers); gonetwork (Home's Go
                                                                    Network art: capital moves through Go Network's infrastructure)
     faq      headline+faq            Modules.faq
     cta      ctaBanner               Modules.banner { panel:false }
     news     newsletter              renderNewsModule
   The live hero carries a logo strip with no title; it is not in the capture, so it is not built (no #trust).
   UI arts stDvp, stSecure: shared/arts/settlement.js (review). Scenes dotGlobe, springStrings (scenes.js); gonetwork (modules.js ARTS).                                                     */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, words: P.hero.words, rest: P.hero.rest, label: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'bridge', fit: 0.75, align: 'center' });
  // two-card section: a section headline over a mirrored pair of 50/50s (as Self-Custody's key management and prime's settle)
  const pair = (sel, D, visuals) => {   // the headline section, then a section per card (#<id>-a, #<id>-b)
    Modules.section($(sel), { eyebrow: D.eyebrow, title: D.title, text: D.text });
    D.cards.forEach((c, i) => Modules.split($(`${sel}-${'ab'[i]}`), { title: c.title, text: [c.text], cta: c.cta, side: i ? 'left' : 'right', visual: visuals[i] }));
  };
  pair('#network', P.network, [{ ui: 'stDvp' }, { scene: 'dotGlobe', opts: { arcs: 14 } }]);
  Modules.textlist($('#uses'), P.uses);
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1), layers = P.rules.cards[1].title.split('-')[0].split(', ').map(cap);   // "Counterparty, exchange, operational"
  Modules.multicard($('#rules'), { title: P.rules.title, text: P.rules.text, cards: P.rules.cards.map((c, i) => Object.assign({ title: c.label, text: c.title }, [{ art: 'stSecure' }, { scene: 'springStrings', opts: { labels: layers } }, { art: 'gonetwork' }][i])) });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
