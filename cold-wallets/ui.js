/* Cold Wallets. Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE (content.js).
   Section map (live component -> module):
     hero     heroSecondary        Modules.hero          custody-safe (all three keys held offline, behind bank-grade hardware)
     trust    logoCloud            Modules.logos         marquee
     best     headline             Modules.section
     keys     feature              Modules.split         hsm, 3D (keys made and used inside tamper-proof hardware, never exposed)
     list     list                 Modules.textlist
     stats    statistics           Modules.statement     the stats design (Custody Wallets): one lit line per figure, the figure in blue
     layers   headline+multicard   Modules.multicard     3x: lineArches, line scene (hardware through multiple trusted distributors, each read in
                                                           turn); UI cwSoftware (sign offline); UI cwHsm (HSMs enforce the policies)
     clients  headline+logos       Modules.logos { headline }   the shared section headline over the marquee
     fine     small print          Modules.fineprint
     latest   post-list            Modules.latest
     faq      faq                  Modules.faq
     cta      ctaBanner            Modules.banner { panel:false }
     news     newsletter           renderNewsModule                                                                    */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.h1, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'custody-safe', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#best'), P.bestFor);
  Modules.split($('#keys'), { eyebrow: P.keys.eyebrow, title: P.keys.title, text: P.keys.text, side: 'right', visual: { model: 'hsm', fit: 0.85 } });
  Modules.textlist($('#list'), P.list);
  Modules.statement($('#stats'), { lines: P.stats.map(s => ({ text: `${s.value} ${s.label}`, em: s.value })) });
  Modules.multicard($('#layers'), { title: P.layers.title, cards: P.layers.cards.map((c, i) => Object.assign({ title: c.label, text: c.title }, [{ scene: 'lineArches', opts: { count: 5 } }, { art: 'cwSoftware' }, { art: 'cwHsm' }][i])) });
  Modules.logos($('#clients'), { headline: true, title: P.clients.title, logos: B.trust.logos });
  Modules.fineprint($('#fine'), P.fine);
  Modules.latest($('#latest'), P.latest);
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
