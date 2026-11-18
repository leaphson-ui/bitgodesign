/* Listing Services: Asset Listings (bitgo.com/products/listing-services/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/listing-services/build_content.py).
   Section map (live component -> module -> visual):
     hero       heroPrimary           Modules.hero          coin (your asset as a token; the live hero is glass token discs)
     trust      logoCloud             Modules.logos         marquee
     grow       headline+multicard(3) Modules.multicard     3x, the card label as the title, the sentence as the text:
                                                              UI ecListings (reused, shared/arts/ecosystem.js: an asset passes review and is activated on BitGo),
                                                              scene nodeMesh (share your asset in more places: a network of linked venues),
                                                              UI lsManage (three operations run in turn and land in the activity log)
     home       list (eyebrow, rows)  Modules.textlist      intro beside the three rows, rows on the right as live
     worldwide  feature (media right) Modules.split         scene dotGlobe (live: a dotted globe; the asset made available across the world), right
     solutions  headline+multicard(3) Modules.multicard     3x, each card's live link as its button: asciiMark (the BitGo shield in glyphs: the
                                                              asset in qualified custody), barsNodes (protocol-level staking: rewards fall into the
                                                              stakes), lineZigzag (trade from cold storage straight to the exchanges, no middle hops)
     assets     announcementsBanner   Modules.split         no visual (no bitgo.com imagery, UI budget used: NEEDS), left as live
     trusted    headline + logo grid  Modules.logos { headline }  the shared section headline over the eight live foundation and protocol
                                                              marks (inline SVG on live, saved by capture.py), as Ecosystem
     faq        headline+faq          Modules.faq           the live disclaimer as the note, the Fork Policy link set in place (links)
     cta        ctaBanner             Modules.banner { panel:false }
     news       newsletter            renderNewsModule
   UI arts: ecListings (shared/arts/ecosystem.js), lsManage (shared/arts/listing-services.js). Kinds: model, UI, line/dot scenes, ASCII. */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'coin', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.multicard($('#grow'), { title: P.grow.title, cards: P.grow.cards.map((c, i) => Object.assign({ title: c.label, text: c.title }, [{ art: 'ecListings' }, { scene: 'nodeMesh', opts: { nodes: 10 } }, { art: 'lsManage' }][i])) });
  Modules.textlist($('#home'), P.home);
  Modules.split($('#worldwide'), { eyebrow: P.worldwide.eyebrow, title: P.worldwide.title, text: P.worldwide.text, cta: P.worldwide.cta, side: 'right', visual: { scene: 'dotGlobe', opts: { arcs: 17 } } });   // live: a dotted globe
  Modules.multicard($('#solutions'), { title: P.solutions.title, cards: P.solutions.cards.map((c, i) => Object.assign({ title: c.label, text: c.title, cta: c.cta }, [{ scene: 'asciiMark', opts: { theme: 'blue' } }, { scene: 'barsNodes', opts: { bars: 20 } }, { scene: 'lineZigzag', opts: { hops: 4, ends: ['Cold storage', 'Exchanges'] } }][i])) });   // custody under the BitGo shield; staking rewards; cold storage straight to the exchanges
  Modules.split($('#assets'), { title: P.assets.title, cta: P.assets.cta, side: 'left' });   // NEEDS: a visual for the supported-assets list
  Modules.logos($('#trusted'), { headline: true, title: P.trusted.title, logos: P.trusted.logos });   // the shared section headline over the live partner marks
  Modules.faq($('#faq'), { title: P.faqTitle, note: P.faqNote, items: P.faqs, links: P.faqLinks });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
