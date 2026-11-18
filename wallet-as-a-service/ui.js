/* Wallet-as-a-Service. Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE (content.js).
   Section map (live component -> module):
     hero      heroSecondary        Modules.hero          wallet (a wallet your platform hands out)
     trust     logoCloud            Modules.logos         marquee
     best      headline             Modules.section
     keys      feature              Modules.split         UI scHot (key management works as a self-custody hot wallet; the live image is that diagram)
     list      list                 Modules.textlist
     stats     statistics           Modules.statement     the stats design: one lit line per figure, the figure in blue
     layers    headline+multicard(6) Modules.lockup       name rows: the card label in the name column, its sentence beside it
     clients   headline+logos       Modules.logos { headline }   the shared section headline over the marquee
     faq       headline+faq         Modules.faq { links } (the SLA link inside the last answer)
     fine      small print          Modules.fineprint
     cta       ctaBanner            Modules.banner { panel:false }
     news      newsletter           renderNewsModule                                                                    */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.h1, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'wallet', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#best'), P.bestFor);
  Modules.split($('#keys'), { eyebrow: P.keys.eyebrow, title: P.keys.title, text: P.keys.text, side: 'right', visual: { ui: 'scHot' } });
  Modules.textlist($('#list'), P.list);
  Modules.statement($('#stats'), { lines: P.stats.map(s => ({ text: `${s.value} ${s.label}`, em: s.value })) });
  Modules.lockup($('#layers'), { title: P.layers.title, rows: P.layers.cards.map(c => ({ name: c.label, text: c.title })) });
  Modules.logos($('#clients'), { headline: true, title: P.clients.title, logos: B.trust.logos });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs, links: [P.faqLink] });
  Modules.fineprint($('#fine'), P.fine);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
