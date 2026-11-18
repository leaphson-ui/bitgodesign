/* Stablecoins (bitgo.com/products/stablecoins/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE
   (content.js, built by _capture/stablecoins/build_content.py after capture_extra.py).
   Section map (live component -> module -> visual):
     hero          heroPrimary              Modules.hero           stablecoin (notes lift, turn to glass and land as tokens: every token one dollar)
     trust         logoCloud                Modules.logos          marquee
     issuers       multicard, 2 link cards  two mirrored Modules.split in #issuers-a / #issuers-b (no headline above them live, as defi's
                   (no headline)                                     vaults-a/-b); each card's "See Reports" link as the split's button:
                                                                     UI sc2Attest (USD1 reserves: 1:1, monthly attestation), right /
                                                                     UI sc2Settle (SoFiUSD settles on a Saturday: 24/7), left
     report        feature, media right     Modules.split          charter (the report: the paper), right
     infra         feature, media left      Modules.split          coin (launch a stablecoin: tokens struck from reserves), left; the live
                                                                     Stablecoin-as-a-Service button
     institutions  headline+multicard(6)    Modules.lockup         the homepage Established rows, the card title in the name column; Trading and
                                                                     24/7 Settlement are links as live (go: the link's live label)
     money         featureList2 (3 cards)   Modules.multicard      3x: label -> title, the sentence -> text: UI sc2Pay, sc2Hold, sc2Secure
     quote         quoteCarousel (2)        Modules.quote          the two quotes with their live credits
     faq           headline+faq             Modules.faq            the headline above it is the FAQ's title
     cta           ctaBanner                Modules.banner { panel:false }
     news          newsletter               renderNewsModule
   UI arts sc2Attest, sc2Settle, sc2Pay, sc2Hold, sc2Secure: shared/arts/stablecoins.js (+ .css), status review.            */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'stablecoin', fit: 1, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  P.issuers.forEach((c, i) => Modules.split($(`#issuers-${'ab'[i]}`), { title: c.title, text: [c.text], cta: c.cta, side: i ? 'left' : 'right', visual: { model: 'logo3d', partner: ['usd1', 'sofi'][i], fit: 0.9 } }));   // each issuer's own mark in BitGo glass (approved composition)
  Modules.report($('#report'), { eyebrow: P.report.eyebrow, title: P.report.title, text: P.report.text, cta: { label: P.report.cta.label, href: P.report.cta.href || Page.CONNECT }, side: 'right' });   // the report module: a typeset edition of this report (approved 2026-11-18), no live imagery
  Modules.split($('#infra'), { eyebrow: P.infra.eyebrow, title: P.infra.title, text: P.infra.text, cta: P.infra.cta, side: 'left', visual: { scene: 'flowLanes', opts: { ins: ['Reserve management', 'Smart contracts', 'Regulatory infrastructure'], hub: 'Stablecoin', outs: 3 }, frame: 'panel' } });   // the live line: what goes into launching one
  Modules.lockup($('#institutions'), { title: P.institutions.title, text: P.institutions.text, rows: P.institutions.cards.map(c => ({ name: c.title, text: c.text, href: c.href, go: c.linkLabel })) });
  Modules.multicard($('#money'), { title: P.money.title, cards: P.money.cards.map((c, i) => Object.assign({ title: c.title, text: c.text }, [{ scene: 'lineZigzag', opts: { hops: 4 } }, { scene: 'dotFlow', opts: { ins: 2, hub: 'Qualified custody', outs: ['Hold', 'Swap', 'Move'] } }, { scene: 'asciiMark', opts: { text: '$', theme: 'money' } }][i])) });   // payments go direct; hold, swap, move from custody; the safest dollars onchain
  Modules.quote($('#quote'), { quotes: P.quotes });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
