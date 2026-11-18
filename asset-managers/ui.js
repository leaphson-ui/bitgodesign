/* Asset Managers (bitgo.com/solutions/asset-managers/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/asset-managers/build_content.py after capture_hero.py).
   No imagery from bitgo.com (the user, 2026-11-18): models, scenes, existing UI arts and real marks only.
   Section map (live component -> module -> visual):
     hero      heroPrimary              Modules.hero           towers (institutions held on one platform)
     trust     logoCloud                Modules.logos          marquee (client marks)
     report    feature (report)         Modules.report         the custom report module (approved 2026-11-18): the copy on an ink panel beside a typeset
                                                                 edition set from the report's own title, dot ribbon behind; right as live
     intro     standaloneText (1)       Modules.statement      the approved scroll-lit statement, one sentence
     designed  headline+multicard(3)    Modules.multicard      3x: label -> label, h3 -> title, sentence -> text.
                                                                 scene dotFlow (trade via OTC, electronic platform or API, straight out of regulated
                                                                 custody: the card's own words as labels);
                                                                 UI dvpSettle (settlement workflows: both legs settle together, for ETF/ETP issuers);
                                                                 UI fiPortfolio (bespoke financing on the whole portfolio: liquidity without selling)
     diff      headline+listWithImage   Modules.pinned scroll  the headline is the pinned list's title and lead; scene lineGlobe in the pinned spot
                                                                 (registered in key jurisdictions around the world; it redraws for each item), visual left as live
     unified   headline+multicard(6)    Modules.lockup         the homepage Established rows, the card title in the name column; five rows link
                                                                 as live (go: the card link's live label), Reporting has no link
     cta       ctaBanner                Modules.banner { panel:false }
     news      newsletter               renderNewsModule
   Kinds: report edition, scene (2), UI art (2), real marks. Arts dvpSettle (shared/arts/go-network-dvp.js), fiPortfolio (shared/arts/financing.js).        */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'towers', fit: 0.9, align: 'center' });   // institutions held on one platform
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, text: P.report.text, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the approved report module: a typeset edition from the title
  Modules.statement($('#intro'), { lines: [{ text: P.intro }] });
  Modules.multicard($('#designed'), { eyebrow: P.designed.eyebrow, title: P.designed.title, cards: P.designed.cards.map((c, i) => Object.assign({ label: c.label, title: c.title, text: c.text },
    [{ scene: 'dotFlow', opts: { ins: 2, hub: 'Regulated custody', outs: ['OTC', 'Electronic platform', 'API'] } }, { art: 'dvpSettle' }, { art: 'fiPortfolio' }][i])) });
  Modules.pinned($('#diff'), { mode: 'scroll', title: P.diff.title, text: P.diff.text, items: P.diff.items, expose: '__diff', visual: Modules.scene('lineGlobe', { routes: 5 }) });
  Modules.lockup($('#unified'), { eyebrow: P.unified.eyebrow, title: P.unified.title, text: P.unified.text, rows: P.unified.cards.map(c => ({ name: c.title, text: c.text, href: c.href, go: c.linkLabel })) });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
