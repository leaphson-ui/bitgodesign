/* Insurance (bitgo.com/solutions/insurance/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/insurance/build_content.py after capture_hero.py).
   No imagery from bitgo.com (the user, 2026-11-18): models, scenes, existing UI arts and real marks only.
   The live page is light (theme-light); it is built on the shared dark stage like every other page.
   Section map (live component -> module -> visual):
     hero      heroPrimary              Modules.hero           custody-safe (insured custody: keys offline behind bank-grade hardware)
     trust     logoCloud                    Modules.logos          marquee (client marks)
     coverage  headline                     Modules.section        the shared headline
     help      feature, media right         Modules.split          none: no allowed model, scene or existing art says "BitGo pays the deductibles"
                                                                     (NEEDS), right as live
     deep      feature, media left          Modules.split          scene flowLanes (a syndicate of insurers in the Lloyd's of London and European
                                                                     Marketplace, merging into BitGo's insurance policy: the live names), left
     cta       headline + 2 buttons         Modules.section        the live closing headline with its two buttons (cta, cta2 ghost) in the closing
               (no live ctaBanner)                                   slot (the stage's cta look)
     news      newsletter                   renderNewsModule
   Kinds: scene only (one picture on the page): see NEEDS.                                                                                */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'custody-safe', fit: 0.9, align: 'center' });   // insured custody: keys offline behind bank-grade hardware
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#coverage'), P.coverage);
  Modules.split($('#help'), { title: P.help.title, text: P.help.text, side: 'right' });
  Modules.split($('#deep'), { title: P.deep.title, text: P.deep.text, cta: P.deep.cta, side: 'left', visual: { scene: 'flowLanes', opts: { ins: ["Lloyd's of London", 'European Marketplace'], hub: "BitGo's insurance policy", outs: 3 } } });
  Modules.section($('#cta'), P.learn);
  renderNewsModule($('#news'));
  Page.finish();
})();
