/* GENIUS Act (bitgo.com/genius-act/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/genius-act/build_content.py).
   Section map (live component -> module -> visual):
     hero       heroPrimary (rotating word)  Modules.hero { words, rest }  the live rotating word (Regulation, Transparency, Protection) in the rise
                                                                     style, the lead, the button; charter (the paper: legislation, chartered and attested)
     wait       headline+4 cards             Modules.lockup         the homepage Established rows, the card title in the name column; the headline's
                                                                    long lead wraps; the live eyebrow over the headline (lockup eyebrow)
     launch     heroPrimary (2nd, centred)   Modules.split          a second hero mid-page has no row in the playbook table; a 50/50 carries its h2,
                                                                    lead and button; scene dotRibbon (live: a waving flag of light; launching your own
                                                                    dollar stablecoin), right
     compliant  headline+accordion(4)        Modules.pinned swap    the homepage Core Services interaction: the live headline is the opener (eyebrow, two
                                                                    lines, the 2nd in serif italic, its lead); each item's one live paragraph is its
                                                                    body; scene springStrings in the pinned spot, its tiers the four item titles (each
                                                                    rings as the pulse passes: one framework, four guarantees)
     blueprint  multicard card 1 (USD1)      Modules.split          the live cards have no headline, so each is a 50/50 of a mirrored pair: label as
                                                                    eyebrow, title, sentence, its live "Read more" link; UI gaBlueprint (your stablecoin
                                                                    set up on the USD1 blueprint: custody, contracts, banking rails; launched within weeks), right
     future     multicard card 2             Modules.split          scene lineGlobe (the future of global finance: routes that never sleep), left
     faq        faq                          Modules.faq
     cta        ctaBanner                    Modules.banner { panel:false }
     news       newsletter                   renderNewsModule
   UI art gaBlueprint: shared/arts/genius-act.js (+ .css). Kinds: 3D model, dot and line scenes, UI.                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { words: P.hero.words, rest: P.hero.rest, label: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'charter', fit: 0.8, align: 'center' });
  Modules.lockup($('#wait'), { eyebrow: P.wait.eyebrow, title: P.wait.title, text: P.wait.text, wrap: true, rows: P.wait.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.split($('#launch'), { title: P.launch.title, text: P.launch.text, cta: { label: P.launch.cta, href: Page.CONNECT }, side: 'right', visual: { scene: 'dotRibbon', opts: { grid: 230 } } });   // live: a flag waving in light
  Modules.pinned($('#compliant'), { mode: 'swap', eyebrow: P.compliant.eyebrow, title: P.compliant.lines, text: P.compliant.text, items: P.compliant.items, expose: '__compliant', trackId: 'compliantTrack', visual: Modules.scene('springStrings', { labels: P.compliant.items.map(x => x.title) }) });   // accordion = the approved swap pinned list; the four guarantees as tiers
  const story = (sel, c, side, visual) => Modules.split($(sel), { eyebrow: c.label, title: c.title, text: [c.text], cta: c.cta, side, visual });
  story('#blueprint', P.stories[0], 'right', { ui: 'gaBlueprint' });
  story('#future', P.stories[1], 'left', { scene: 'lineGlobe', opts: { routes: 5 } });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
