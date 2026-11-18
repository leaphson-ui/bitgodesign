/* Token Management (bitgo.com/products/token-management/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/token-management/build_content.py).
   Section map (live component -> module -> visual):
     hero        heroPrimary (rotating)  Modules.hero { words, rest }  coin-2 (tokens are minted: a token launch; the live hero is glass
                                                                       token discs); the live rotating word in the rise style, as Settlement
     trust       logoCloud               Modules.logos          marquee
     report      feature                 Modules.report (the custom report module: a typeset edition of the report from its title, dot ribbon behind), right
     designed    headline+accordion      Modules.pinned swap    the homepage Core Services interaction: the live headline is the opener
                                                                (eyebrow, two lines, the 2nd in serif italic, lead); vesting, unlocking and
                                                                distribution are the items (title, short, long); scene lineSteps in the pinned
                                                                spot (the supply releases step by step against a fixed cap: a vesting schedule)
     case        feature (case study)    Modules.split          the Berachain mark the live banner shows (shared/assets/logos/token-management/
                                                                berachain.svg, the live inline SVG) over scene nodeMesh (a mainnet: linked nodes), left
     benefits    list (rows right)       Modules.textlist       intro beside the four rows, rows on the right as live
     simplified  headline+6 cards        Modules.lockup         the homepage Established rows: the card label in the name column, the sentence,
                                                                the whole row a link with the card's live link label as its go label (four rows;
                                                                Safeguarded assets and Grants & warrants have no link on live)
     trusted     headline + logo grid    Modules.logos { headline }  the shared section headline over the eight live partner marks (inline SVG
                                                                on live, saved by capture.py), as Ecosystem
     faq         headline+faq            Modules.faq
     cta         ctaBanner               Modules.banner { panel:false }
     news        newsletter              renderNewsModule
   No UI arts. Kinds: 3D model, line scenes, real mark.                                                                                   */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, words: P.hero.words, rest: P.hero.rest, label: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'coin-2', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the custom report module
  Modules.pinned($('#designed'), { mode: 'swap', eyebrow: P.designed.eyebrow, title: P.designed.lines, text: P.designed.text, items: P.designed.items, expose: '__designed', trackId: 'designedTrack', visual: Modules.scene('lineSteps', { steps: 7 }) });   // accordion = the approved swap pinned list; the release schedule climbs step by step
  Modules.split($('#case'), { eyebrow: P.case.eyebrow, title: P.case.title, text: P.case.text, cta: P.case.cta, side: 'left', visual: { logo: '../shared/assets/logos/token-management/berachain.svg', alt: 'Berachain', scene: 'nodeMesh', opts: { nodes: 11 }, logoAt: 'top' } });   // the live case study's mark over its mainnet
  Modules.textlist($('#benefits'), P.benefits);
  Modules.lockup($('#simplified'), { title: P.simplified.title, text: P.simplified.text, wrap: true, rows: P.simplified.cards.map(c => ({ name: c.label, text: c.title, href: c.cta && c.cta.href, go: c.cta && c.cta.label })) });
  Modules.logos($('#trusted'), { headline: true, title: P.trusted.title, logos: P.trusted.logos });   // the shared section headline over the live partner marks
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
