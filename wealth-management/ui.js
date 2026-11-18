/* Wealth Management (bitgo.com/products/wealth-management/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/wealth-management/build_content.py).
   Section map (live component -> module -> visual):
     hero      heroPrimary            Modules.hero           bank (provided through BitGo Bank & Trust: a chartered institution)
     trust     logoCloud              Modules.logos          marquee
     why       headline+listWithImage Modules.pinned scroll  { title, text } from the live headline above the list; lineSkyline, line scene, in the
                                                             pinned spot, visual left as live (the platform of choice, built layer on layer)
     trade     feature                Modules.split          dotFlow, dot scene: venues flow into 'Custody', out to 'Trade' and 'Settle' (the live line:
                                                             trade and settle within custody, aggregated liquidity)
     custody   feature                Modules.split          no picture. NEEDS: the vault model (bank grade vaults), outside this page's budget
     inkind    feature                Modules.split          flowLanes, line scene: 'Retail crypto accounts' and 'Self custody wallets' flow into 'BitGo'
                                                             (held-away assets transferred in kind to your platform)
     billing   headline+multicard(3)  Modules.multicard      3x: UI wmBilling; lineSteps, line scene (profit-and-loss reporting: a line that climbs in steps);
                                                             UI wmIntegrations
     tamp      standaloneText         Modules.statement   one sentence: the scroll-lit statement (approved), not prose
     faq       headline+faq           Modules.faq
     fine      entity line            Modules.fineprint
     cta       ctaBanner              Modules.banner { panel:false }
     news      newsletter             renderNewsModule
   The live list has no title of its own: the headline directly above it is its title and lead (as OTC Trading). Its items are
   titles only (live).
   UI arts wmBilling, wmIntegrations: shared/arts/wealth-management.js (review). Scene labels are live words from the section's own copy.                              */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'bank', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.pinned($('#why'), { mode: 'scroll', title: P.intro.title, text: P.intro.text, items: P.why.items, expose: '__why', visual: Modules.scene('lineSkyline', { lead: true }) });   // list with image = the approved pinned list
  [['#trade', P.trade, 'right', { scene: 'dotFlow', opts: { ins: 3, hub: 'Custody', outs: ['Trade', 'Settle'] } }], ['#custody', P.custody, 'left', null], ['#inkind', P.inkind, 'right', { scene: 'flowLanes', opts: { ins: ['Retail crypto accounts', 'Self custody wallets'], hub: 'BitGo', outs: 1 } }]]
    .forEach(([sel, D, side, visual]) => Modules.split($(sel), { eyebrow: D.eyebrow, title: D.title, text: D.text, cta: D.cta, side, visual }));
  Modules.multicard($('#billing'), { title: P.billing.title, cards: P.billing.cards.map((c, i) => Object.assign({ title: c.label, text: c.title }, [{ art: 'wmBilling' }, { scene: 'lineSteps', opts: { steps: 7 } }, { art: 'wmIntegrations' }][i])) });
  Modules.statement($('#tamp'), { lines: [].concat(P.tamp.text).map(t => ({ text: t })) });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.fineprint($('#fine'), P.fine);
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
