/* Transfer Agent (bitgo.com/products/transfer-agent/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroPrimary            Modules.hero          ledger (the transfer agent's job: every owner on one chain of records)
     trust     logoCloud              Modules.logos         marquee
     report    feature                Modules.split         charter (the paper: a report, as Global Markets' research split), right
     designed  headline+accordion     Modules.pinned swap   the homepage Core Services interaction: the live headline is the opener's two lines (the 2nd in
                                                              serif italic), the four accordion rows are the items (title, short, long); dotRibbon in the pinned
                                                              spot (traditional securities gone digital: one ribbon of thousands of holdings)
                                                              NEEDS: the headline's eyebrow ("Secure transfer agent") and lead have no slot in swap mode
     compare   feature                Modules.split         UI taCompare (the live comparison table: the BitGo column ticks down every row), right
     features  headline+4 cards       Modules.lockup        the homepage Established rows, the card title in the name column
     fine      headline (disclosure)  Modules.fineprint     the entity line
     cta       ctaBanner              Modules.banner { panel:false }
     news      newsletter             renderNewsModule
   UI art taCompare: shared/arts/transfer-agent.js (+ .css), status review. Scene dotRibbon (scenes.js).                                                      */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { lead: P.hero.lead, eyebrow: P.hero.eyebrow, title: P.hero.title, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'charter', fit: 0.9, align: 'center' });   // the regulated transfer agent: the charter seals
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, text: P.report.text, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the report module: a typeset edition of this report (approved 2026-11-18), no live imagery
  Modules.pinned($('#designed'), { mode: 'swap', eyebrow: P.designed.eyebrow, text: P.designed.text, title: P.designed.lines, items: P.designed.items, expose: '__designed', trackId: 'designedTrack', visual: '<div class="slot" data-model="ledger" data-fit="0.85" data-align="center" aria-hidden="true"></div>' });   // the pinned story: the ledger grows block by block as the list advances (approved composition)   // accordion = the approved swap pinned list
  Modules.split($('#compare'), { title: P.compare.title, text: P.compare.text, side: 'right', visual: { ui: 'taCompare', frame: 'panel' } });   // the comparison on an ink panel
  Modules.lockup($('#features'), { title: P.features.title, text: P.features.text, rows: P.features.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.fineprint($('#fine'), P.fine);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
