/* Platform (bitgo.com/products/platform/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE
   (content.js, built by _capture/platform/build_content.py after capture_extra.py).
   Section map (live component -> module -> visual):
     hero      heroPrimary              Modules.hero           shield (one security perimeter: the platform; the live hero is the shield over the
                                                                 product). The live text-free dashboard image after the logos is not built
     trust     logoCloud                Modules.logos          marquee
     speed     headline + 2 features    Modules.section + two mirrored Modules.split (the Self-Custody key-management pair, as prime/research);
     admin                                                       no visual (NEEDS: no bitgo.com imagery, UI cap reached), left /
     policy                                                      UI pfPolicy (the live Multi-Signature for Cold Wallets policy), right
     operate   headline + 2 features    Modules.section + two mirrored Modules.split:
     wallets                                                     UI pfPortfolio (the live Portfolio panel, $45,006.56), right /
     link                                                        no visual (NEEDS: as admin), left, live Link button
     intel     headline                 Modules.section        over the BitGo Assist feature
     assist    feature, media right     Modules.split          UI pfAssist (the live prompt completes; insight, then action), right
     workflow  headline+multicard(3)    Modules.multicard      3x, the headline's eyebrow and title as the head: scenes lineZigzag (ask, and go
                                                                 straight to the right place), springStrings with BTC and USD from the card's own
                                                                 sentence (orders in asset units or quote currency), lineSkyline (build your foundation)
     fine      headline (disclosure)    Modules.fineprint      the AI Legal Disclosure link (as transfer-agent's entity line)
     cta       (no live ctaBanner)      Modules.banner { panel:false }  the page's own title (capture "title") over the shared button, as link/
     news      newsletter               renderNewsModule
   UI arts pfPolicy, pfPortfolio, pfAssist (shared/arts/platform.js + .css): three, each the exact live product screen its section
   describes. Kinds: 3D model, line scenes, UI.                                                                                       */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'shield', fit: 0.85, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  // headline over two features: a section headline, then a mirrored pair of 50/50s (as Self-Custody's key management)
  const pair = (sel, D, ids, sides, visuals) => {
    Modules.section($(sel), { title: D.title });
    D.cards.forEach((c, i) => Modules.split($(ids[i]), { eyebrow: c.eyebrow, title: c.title, text: c.text, cta: c.cta, side: sides[i], visual: visuals[i] }));
  };
  pair('#speed', P.speed, ['#admin', '#policy'], ['left', 'right'], [null, { ui: 'pfPolicy' }]);   // admin: NEEDS a visual
  pair('#operate', P.operate, ['#wallets', '#link'], ['right', 'left'], [{ ui: 'pfPortfolio' }, null]);   // link: NEEDS a visual
  Modules.section($('#intel'), { title: P.intel.title });
  Modules.split($('#assist'), { eyebrow: P.assist.eyebrow, title: P.assist.title, text: P.assist.text, side: 'right', visual: { ui: 'pfAssist' } });
  Modules.multicard($('#workflow'), { eyebrow: P.workflow.eyebrow, title: P.workflow.title, cards: P.workflow.cards.map((c, i) => Object.assign({ title: c.title, text: c.text }, [{ scene: 'lineZigzag', opts: { hops: 4 } }, { scene: 'springStrings', opts: { labels: ['BTC', 'USD'] } }, { scene: 'lineSkyline', opts: { lead: true } }][i])) });   // straight to the right place; asset units or currency; a foundation built layer on layer
  Modules.fineprint($('#fine'), P.fine);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
