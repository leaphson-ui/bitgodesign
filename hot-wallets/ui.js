/* Hot Wallets. Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE (content.js).
   Section map (live component -> module):
     hero      heroSecondary        Modules.hero          bolt-2 (hot: always on, moves fast)
     trust     logoCloud            Modules.logos         marquee
     wc        feature              Modules.split         logo3d WalletConnect (as on Self-Custody)
     best      headline             Modules.section
     keys      feature              Modules.split         UI scHot (who holds which key, online)
     list      list                 Modules.textlist
     stats     statistics           Modules.statement     the stats design: one lit line per figure, the figure in blue
     transfer  feature              Modules.split         wallet-2 (the wallet opens, value slides out)
     security  feature              Modules.split         lineSteps, line scene: a line climbs and rests against a fixed cap (transfer limits)
     holistic  feature              Modules.split         UI scApp (hot and cold wallets side by side, funds moved between them)
   Pictures: 3D (bolt-2, logo3d, wallet-2), UI (scHot, scApp), line scene (lineSteps).
     layers    headline+multicard(6) Modules.lockup       name rows: the card label in the name column, its sentence beside it
     clients   headline+logos       Modules.logos { headline }   the shared section headline over the marquee
     faq       faq                  Modules.faq { note }
     fine      small print          Modules.fineprint
     latest    post-list            Modules.latest
     cta       ctaBanner            Modules.banner { panel:false }
     news      newsletter           renderNewsModule                                                                    */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.h1, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'bolt-2', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.split($('#wc'), { title: P.wc.title, cta: P.wc.cta, side: 'right', visual: { model: 'logo3d', partner: 'walletconnect', fit: 0.78 } });
  Modules.section($('#best'), P.bestFor);
  Modules.split($('#keys'), { eyebrow: P.keys.eyebrow, title: P.keys.title, text: P.keys.text, side: 'left', visual: { ui: 'scHot' } });
  Modules.textlist($('#list'), P.list);
  Modules.statement($('#stats'), { lines: P.stats.map(s => ({ text: `${s.value} ${s.label}`, em: s.value })) });
  [['#transfer', 'right', { model: 'wallet-2', fit: 0.8 }], ['#security', 'left', { scene: 'lineSteps', opts: { steps: 7 } }], ['#holistic', 'right', { ui: 'scApp' }]]
    .forEach(([sel, side, visual], i) => { const F = P.features[i]; Modules.split($(sel), { title: F.title, text: F.text, cta: F.cta, side, visual }); });
  Modules.lockup($('#layers'), { title: P.layers.title, rows: P.layers.cards.map(c => ({ name: c.label, text: c.title })) });
  Modules.logos($('#clients'), { headline: true, title: P.clients.title, logos: B.trust.logos });
  Modules.faq($('#faq'), { title: P.faqTitle, note: P.faqNote, items: P.faqs });
  Modules.fineprint($('#fine'), P.fine);
  Modules.latest($('#latest'), P.latest);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
