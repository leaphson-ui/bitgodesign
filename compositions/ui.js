/* Compositions: the review page for the composition library (2026-11-18). Each section is one composition, built with
   real copy from built pages (Link, Stablecoins, Transfer Agent, Crypto-as-a-Service), so it can be judged in context
   before any page adopts it. Eyebrows name the composition; everything else is the pages' live copy. */
(function () {
  const L = window.C_LINK, S = window.C_SC, T = window.C_TA, C = window.C_CAAS, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: 'Design system', title: 'Compositions', lead: 'Each section below is one composition, set with real copy from a built page. Before → after where a page has one now.', align: 'center' });

  // 1. before: Link "Full Visibility" as it is now (the visual floats beside the copy)
  Modules.split($('#c-before'), { eyebrow: 'Before · plain 50/50', title: L.visibility.title, text: L.visibility.text, side: 'left', visual: { ui: 'lkPortfolio' } });
  // 2. panel + backdrop: the same section; the product screen sits on an ink panel with a live node mesh behind it
  Modules.split($('#c-panel'), { eyebrow: 'Panel + backdrop', title: L.visibility.title, text: L.visibility.text, side: 'left', visual: { ui: 'lkPortfolio', frame: 'panel', backdrop: { scene: 'nodeMesh', opts: { nodes: 12 } } } });
  // 3. wide stage: the copy centred over a full-width stage (Link "Move in One Click")
  Modules.split($('#c-wide'), { eyebrow: 'Wide stage', title: L.move.title, text: L.move.text, layout: 'wide', visual: { ui: 'lkMove', frame: 'glass', backdrop: { scene: 'flowLanes', opts: { ins: 3, hub: '', outs: 3 } } } });
  // 5. the report module (Stablecoins "How to Launch a Stablecoin")
  Modules.report($('#c-report'), { eyebrow: S.report.eyebrow, title: S.report.title, text: S.report.text, cta: { label: S.report.cta.label, href: Page.CONNECT } });
  // 6–7. issuer marks in BitGo glass (the 3D logo model), never flat logos over other art
  Modules.split($('#c-usd1'), { eyebrow: 'Issuer mark in glass', title: S.issuers[0].title, text: [S.issuers[0].text], cta: S.issuers[0].cta, side: 'right', visual: { model: 'logo3d', partner: 'usd1', fit: 0.9 } });
  Modules.split($('#c-sofi'), { eyebrow: 'Issuer mark in glass', title: S.issuers[1].title, text: [S.issuers[1].text], cta: S.issuers[1].cta, side: 'left', visual: { model: 'logo3d', partner: 'sofi', fit: 0.9 } });
  // 8. the pinned story: Transfer Agent's accordion; the ledger grows block by block as the list advances
  Modules.pinned($('#c-story'), { mode: 'swap', eyebrow: T.designed.eyebrow, text: T.designed.text, title: T.designed.lines, items: T.designed.items, expose: '__story', trackId: 'storyTrack', visual: '<div class="slot" data-model="ledger" data-fit="0.85" data-align="center" aria-hidden="true"></div>' });
  // 9. mechanism stage: one big scene for the page's key idea (Crypto-as-a-Service: onboard, then offer)
  Modules.split($('#c-stage'), { eyebrow: 'Mechanism stage', title: C.front.items[2].title, text: [C.front.items[2].short], layout: 'wide', visual: { scene: 'caasPlatform', opts: { ins: C.front.items[1].points.map(x => x.label), offers: C.front.items[2].points.map(x => x.label), guards: C.front.items[3].points.map(x => x.label) } } });
  renderNewsModule($('#news'));
  Page.finish();
})();
