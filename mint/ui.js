/* Mint (bitgo.com/products/mint/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/mint/build_content.py).
   Section map (live component -> module -> visual):
     hero       heroPrimary            Modules.hero           coin (tokens are minted, not drawn: struck from reserves)
     trust      logoCloud              Modules.logos          marquee
     intro      headline               Modules.section
     universal  feature (media right)  Modules.split          UI mnMint (mint and redeem in one panel: a deposit is minted one for one), right
     capital    feature (media left)   Modules.split          no visual (no bitgo.com imagery, no free scene or model: NEEDS), left
     controls   feature (media right)  Modules.split          UI mnControls (a mint request passes the controls and both approvals), right.
                                                              The live section repeats Capital Efficiency's sentence word for word; kept as live
     genius     feature (media left)   Modules.split          scene lineArches (live: a bank; KYB, monitoring and full audit: every arch read), left
     fiat       headline+listWithImage Modules.pinned scroll  the live headline is the list's title, the three items are titles only (live);
                                                              scene dotRibbon in the pinned spot (fiat to stablecoins: money made of points of
                                                              light), visual left as live
     channels   headline               Modules.section
     faq        headline+faq           Modules.faq
     cta        ctaBanner              Modules.banner { panel:false }
     news       newsletter             renderNewsModule
   UI arts mnMint, mnControls: shared/arts/mint.js (+ .css). Kinds: 3D model, UI, line and dot scenes.                                                           */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'coin', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#intro'), P.intro);
  [['#universal', 'right', { ui: 'mnMint' }], ['#capital', 'left', null], ['#controls', 'right', { ui: 'mnControls' }], ['#genius', 'left', { scene: 'lineArches', opts: { count: 7 } }]]
    .forEach(([sel, side, visual], i) => Modules.split($(sel), { title: P.features[i].title, text: P.features[i].text, side, visual }));
  Modules.pinned($('#fiat'), { mode: 'scroll', title: P.fiat.title, items: P.fiat.items, expose: '__fiat', visual: Modules.scene('dotRibbon', { grid: 230 }) });   // list with image = the approved pinned list; fiat turned to points of light
  Modules.section($('#channels'), P.channels);
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
