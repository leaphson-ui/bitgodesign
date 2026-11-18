/* Singapore (bitgo.com/singapore/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/singapore/build_content.py after capture_hero.py and capture_extra.py).
   No imagery from bitgo.com (the user, 2026-11-18): models, scenes, existing UI arts and real marks only.
   Section map (live component -> module -> visual):
     hero      heroPrimary              Modules.hero           globe (custody that meets regional requirements, APAC among them)
     trust       logoCloud                 Modules.logos          marquee (client marks)
     licensed    headline (split)          Modules.section        the shared headline (MAS licence)
     security    feature, media right      Modules.split          model key (regulated cold storage: no single key opens it), right
     trading     feature, media left       Modules.split          UI etLiquidity (deep liquidity from top-tier providers: one connection fans out and the
                                                                    order fills), left
     quote       standaloneText (quote)    Modules.quote          the quote and its live credit, with the Neutronpay mark live shows above it
                                                                    (shared/assets/logos/singapore/01.svg, the live inline SVG)
     settlement  feature, media right      Modules.split          scene grid247 (automated, real-time, 24/7 settlement), right; the live note as its
                                                                    own line
     token       feature, media left       Modules.split          UI ecVesting (token vesting and unlocking, into cold storage), left
     local       standaloneText (2)        Modules.statement      the approved scroll-lit statement, one line per sentence. NEEDS: the Singapore flag live
                                                                    shows above it (saved as shared/assets/logos/singapore/02.svg; statement has no mark option)
     cta         ctaBanner                 Modules.banner { panel:false }
     fine        footer entity disclosure  Modules.fineprint      the live footer's BitGo Singapore Pte. Ltd. line (capture_extra.py), link in place
     news        newsletter                renderNewsModule
   The two product screens sit on the ink panel frame (visual.frame 'panel'), so they never float.
   Kinds: 3D model, UI art (2), scene, real mark. Arts etLiquidity (shared/arts/electronic-trading.js), ecVesting (shared/arts/ecosystem.js). */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  const feat = (sel, D, side, visual) => Modules.split($(sel), { title: D.title, text: D.text, cta: D.cta, side, visual });
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'globe', fit: 0.9, align: 'center' });   // custody that meets regional requirements, APAC among them
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#licensed'), P.licensed);
  feat('#security', P.security, 'right', { model: 'key', fit: 0.85 });
  feat('#trading', P.trading, 'left', { ui: 'etLiquidity', frame: 'panel' });
  Modules.quote($('#quote'), { quotes: [{ text: P.quote.text, cite: P.quote.cite, logo: P.quote.logo, logoAlt: 'Neutronpay' }] });
  feat('#settlement', P.settlement, 'right', { scene: 'grid247', opts: { cols: 24, rows: 7 } });
  feat('#token', P.token, 'left', { ui: 'ecVesting', frame: 'panel' });
  Modules.statement($('#local'), { lines: P.local.lines.map(text => ({ text })) });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  Modules.fineprint($('#fine'), P.fine);
  renderNewsModule($('#news'));
  Page.finish();
})();
