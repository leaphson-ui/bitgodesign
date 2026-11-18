/* Go Account (bitgo.com/products/go-account/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE
   (content.js, built by _capture/go-account/build_content.py after capture_hero.py).
   Section map (live component -> module -> picture):
     hero      heroPrimary (rotating first word)  Modules.hero        words + rest (rise; label = the live h1); wallet-2 (the most versatile
                                                                     multi-asset wallet: one slim case that holds everything)
     trust     logoCloud                          Modules.logos       marquee
     strategy  headline + multicard (6 cards)     Modules.lockup      the homepage Established rows: the card label in the name column, its
                                                                     sentence, the card link (go: the link's live label); Fiat has no link live
     trusted   headline + listWithImage (4)       Modules.pinned      scroll: the headline above the list is its title and lead; asciiMark with
                                                                     no text = the BitGo shield in glyphs (the live picture is the BitGo shield)
     more-a/b  multicard, 2 link cards            two mirrored        label -> title, sentence -> text, the card link as the button:
               (no headline)                      Modules.split       Trade: flowLanes (the Go Account mechanism: many chains into one
                                                                     Go Account, out to the page's own Hold / Stake / Settle / Trade /
                                                                     Finance), right; Go Network: dotGlobe (settlement arcs between
                                                                     markets; the live picture is a globe), left
     cta       ctaBanner                          Modules.banner { panel:false }
     news      newsletter                         renderNewsModule
   Pictures: 1 model (wallet-2), 3 scenes (asciiMark, flowLanes, dotGlobe), no product UI art. */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, words: P.hero.words, rest: P.hero.rest, label: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'wallet-2', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.lockup($('#strategy'), { eyebrow: P.strategy.eyebrow, title: P.strategy.title, text: P.strategy.text, rows: P.strategy.cards.map(c => ({ name: c.label, text: c.text, href: c.href, go: c.go })) });
  Modules.pinned($('#trusted'), { mode: 'scroll', title: P.trusted.title, text: P.trusted.text, items: P.trusted.items, expose: '__trusted', visual: Modules.scene('asciiMark', { cell: 12, density: 1, size: 0.8 }) });
  const outs = P.strategy.cards.filter(c => c.href).map(c => c.label);
  P.more.forEach((c, i) => Modules.split($(`#more-${'ab'[i]}`), { title: c.label, text: [c.text], cta: { label: c.go, href: c.href }, side: i ? 'left' : 'right',
    visual: [{ scene: 'flowLanes', opts: { ins: 4, hub: P.hero.eyebrow, outs } }, { scene: 'dotGlobe', opts: { arcs: 17 } }][i] }));
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
