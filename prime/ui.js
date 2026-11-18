/* Global Markets (bitgo.com/products/prime/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> picture, its kind):
     hero      heroPrimary            Modules.hero          orbit-globe, 3D (global markets, one instrument)
     trust     logoCloud              Modules.logos         marquee
     access    headline+multicard(3)  Modules.multicard     3x: no picture; UI gmVoice (OTC chat RFQ to a block trade); no picture
     report    feature                Modules.split         no picture (NEEDS: the depth model, fee-inclusive execution, is outside the budget)
     manage    headline+multicard(3)  Modules.multicard     3x: no pictures (NEEDS)
     research  headline+2 cards       Modules.section + two mirrored Modules.split (the Self-Custody key-management pair)
                                        dotRibbon, dot scene (research on digital asset trends: finance gone digital) / towers, 3D (asset
                                        management for institutional investors)
     settle    headline+2 cards       Modules.section + two mirrored Modules.split: UI goNetwork (a DvP clearing between two counterparties
                                        over Go Network) / no picture (NEEDS: the bridge model, off-exchange, is outside the budget)
     serve     headline+8 cards       Modules.lockup        the homepage Established rows, a segment name in place of a logo
     why       listWithImage          Modules.pinned scroll  lineGlobe, line scene, in the pinned spot (Global Markets: routes across a globe
                                                              that never sleeps; it replays per item)
     cta       ctaBanner              Modules.banner { panel:false }
     news      newsletter             renderNewsModule
   UI arts gmVoice, goNetwork (shared/system/ui-arts.js, modules.js). 13 picture slots against 2 models, 2 UI arts and 2 scenes: the rest
   stay without a picture (NEEDS).                         */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'orbit-globe', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.multicard($('#access'), { eyebrow: P.access.eyebrow, title: P.access.title, text: P.access.text, cards: P.access.cards.map((c, i) => Object.assign({}, c, i === 1 ? { art: 'gmVoice' } : {})) });
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, text: P.report.text, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the report module: a typeset edition of this report (approved 2026-11-18), no live imagery
  Modules.multicard($('#manage'), { eyebrow: P.manage.eyebrow, title: P.manage.title, text: P.manage.text, cards: P.manage.cards });
  // two-card sections: a section headline over a mirrored pair of 50/50s (as Self-Custody's key management)
  const pair = (sel, D, visuals) => {   // the headline section, then a section per card (#<id>-a, #<id>-b)
    Modules.section($(sel), { eyebrow: D.eyebrow, title: D.title, text: D.text });
    D.cards.forEach((c, i) => Modules.split($(`${sel}-${'ab'[i]}`), { title: c.title, text: [c.text], cta: c.cta, side: i ? 'left' : 'right', visual: visuals[i] }));
  };
  pair('#research', P.research, [{ scene: 'dotRibbon', opts: { grid: 230 } }, { model: 'towers', fit: 0.8 }]);
  pair('#settle', P.settle, [{ ui: 'goNetwork' }, null]);
  Modules.lockup($('#serve'), { title: P.serve.title, rows: P.serve.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.pinned($('#why'), { mode: 'scroll', title: P.why.title, items: P.why.items, side: 'right', expose: '__why', visual: Modules.scene('lineGlobe', { routes: 5, lead: false }) });   // list with image = the approved pinned list
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
