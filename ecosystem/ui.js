/* Ecosystem (bitgo.com/products/ecosystem/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero      heroPrimary (rotating end)  Modules.hero          head + words: the live trailing rotation (rise); coin-2 (tokens are minted: a token
                                                                   launch; the live hero is a ring of glass token coins)
     trust     logoCloud                   Modules.logos         marquee
     report    feature                     Modules.report (the custom report module: a typeset edition of the report from its title, dot ribbon behind), right
     partner   headline                    Modules.section       (the live headline is set in a <p>)
     security  headline+2 cards            Modules.section + two mirrored Modules.split (the Self-Custody key-management pair), each card's live link
                                                                   as its button: scene dotRings (the treasury held in orbit round one guarded core) /
                                                                   scene lineArches (a regulated, certified custodian: a colonnade read arch by arch,
                                                                   nothing hidden; the live image is a bank)
     grow      headline+multicard(3)       Modules.multicard     3x, each card's live link as its button, the card label as the title:
                                                                   UI ecVesting (a vesting schedule unlocks and distributes to stakeholders' cold storage wallets),
                                                                   ecListings (an asset is reviewed, activated and goes live with exchange partners),
                                                                   scene barsNodes (secure the network and accumulate rewards: rewards fall into the stakes).
                                                                   The third live card has no label: its sentence (the live h3) is the card title
     platform  list (eyebrow, lead, 4 rows) Modules.textlist     intro beside the four rows, rows on the right as live (the rows have no text, so the
                                                                   pinned list has nothing to hold in each step, and it has no eyebrow slot)
     trusted   headline + logo grid        Modules.logos { headline }   the shared section headline over the eight live partner marks (inline SVG
                                                                   on live, saved by capture.py to shared/assets/logos/ecosystem/)
     word      headline                    Modules.section
     quote     quoteCarousel               Modules.quote         three quotes with their live credits (cite), stepper; the EigenCloud mark on the second, as live
     cta       ctaBanner                   Modules.banner { panel:false }
     news      newsletter                  renderNewsModule
   UI arts: ecVesting, ecListings (shared/arts/ecosystem.js + .css). Kinds: 3D model, dot and line scenes, UI, real mark.  */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, head: P.hero.head, words: P.hero.words, label: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'coin-2', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the custom report module
  Modules.section($('#partner'), P.partner);
  Modules.section($('#security'), { title: P.security.title, text: P.security.text });
  P.security.cards.forEach((c, i) => Modules.split($(`#security-${'ab'[i]}`), { title: c.title, text: [c.text], cta: c.cta, side: i ? 'left' : 'right', visual: [{ scene: 'dotRings', opts: { rings: 6, beam: false } }, { scene: 'lineArches', opts: { count: 7 } }][i] }));   // custody: the treasury in orbit round one core; regulated: every arch read
  Modules.multicard($('#grow'), { title: P.grow.title, text: P.grow.text, cards: P.grow.cards.map((c, i) => Object.assign({ title: c.label || c.title, text: c.label ? c.title : '', cta: c.cta }, [{ art: 'ecVesting' }, { art: 'ecListings' }, { scene: 'barsNodes', opts: { bars: 22 } }][i])) });
  Modules.textlist($('#platform'), { eyebrow: P.platform.eyebrow, title: P.platform.title, text: P.platform.text, items: P.platform.items, side: 'right' });
  Modules.logos($('#trusted'), { headline: true, title: P.trusted.title, logos: P.trusted.logos });   // the shared section headline over the live partner marks
  Modules.section($('#word'), P.word);
  Modules.quote($('#quote'), { quotes: P.quotes });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
