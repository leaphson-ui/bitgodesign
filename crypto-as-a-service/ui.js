/* Crypto-as-a-Service (bitgo.com/products/crypto-as-a-service/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/crypto-as-a-service/build_content.py).
   Section map (live component -> module -> visual):
     hero        heroPrimary               Modules.hero           wallet (crypto wallets your platform hands its users: trading, staking, transfers)
     trust       logoCloud                 Modules.logos          marquee
     guide       feature (guide download)  Modules.split          charter (the paper: a guide, as Global Markets' research split), right as live
     front       headline+accordion(4)     Modules.pinned swap    the homepage Core Services interaction: the live headline is the opener (two
                                                                  lines, the 2nd in serif italic, its lead); items title/short/long; bank in the
                                                                  pinned spot (BitGo Bank and Trust, N.A.'s OCC charter: licensing out of the box).
                                                                  each item's live sub-points (label + sentence) as the swap's points list
     calculator  headline+calculator       Modules.section        the calculator's live headline (eyebrow, title, lead). NEEDS: the revenue
                                                                  calculator itself (four inputs: Number of Active Users, Average Account Balance ($),
                                                                  Average Monthly Transaction Volume ($), Percent of Assets Staked (%); output
                                                                  "Potential Crypto Revenue Streams") has no approved module, so it is not built
     fastest     headline+multicard(3)     Modules.multicard      3x: UI caasRevenue (trading, staking and transfers switch on; each opens a revenue
                                                                  line), caasPolicy (an end user's withdrawal passes user management and the policy
                                                                  engine, released by BitGo Bank and Trust, N.A.), goaccount (the homepage Go Accounts
                                                                  art: fiat and crypto layers snap into one stack)
     modular     list (rows right)         Modules.textlist       eyebrow, intro beside the three rows, rows on the right as live
     quote       quoteCarousel (1 quote)   Modules.quote          the quote and its live credit. NEEDS: the Fold logo above the quote
     businesses  headline+6 cards          Modules.lockup         the homepage Established rows, the segment name in the name column (the live cards
                                                                  are names only, so the rows carry no sentence and no link)
     faq         headline+faq              Modules.faq
     cta         ctaBanner                 Modules.banner { panel:false }
     news        newsletter                renderNewsModule
   UI arts caasRevenue, caasPolicy new in shared/arts/crypto-as-a-service.js (+ .css), status review; goaccount (modules.js) reused. */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.h1, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'wallet', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.report($('#guide'), { eyebrow: P.guide.eyebrow, title: P.guide.title, text: P.guide.text, cta: { label: P.guide.cta.label, href: P.guide.cta.href || Page.CONNECT }, side: 'right' });   // the report module: a typeset edition of this report (approved 2026-11-18), no live imagery
  Modules.pinned($('#front'), { mode: 'swap', title: P.front.lines, text: P.front.text, items: P.front.items, expose: '__front', trackId: 'frontTrack', visual: Modules.scene('caasPlatform', { ins: P.front.items[1].points.map(x => x.label), offers: P.front.items[2].points.map(x => x.label), guards: P.front.items[3].points.map(x => x.label) }) });   // the signature scene: users onboard through your platform, BitGo's custody, policy and insurance run underneath; each item lights its layer
  Modules.section($('#calculator'), P.calculator);   // the calculator's headline only (NEEDS: the calculator)
  Modules.multicard($('#fastest'), { title: P.fastest.title, cards: P.fastest.cards.map((c, i) => Object.assign({ title: c.title, text: c.text }, [{ scene: 'springStrings', opts: { labels: ['Trading', 'Staking', 'Transfers', 'Wallets'] } }, { art: 'caasPolicy' }, { scene: 'dotFlow', opts: { ins: ['Fiat', 'Crypto', 'Stablecoins'], hub: 'Wallets', outs: 3 } }][i])) });   // new revenue lines (the hero's own list); security as the policy screen; one wallet for fiat, crypto and stablecoins
  Modules.textlist($('#modular'), P.modular);
  Modules.quote($('#quote'), { quotes: P.quotes });
  Modules.lockup($('#businesses'), { title: P.businesses.title, rows: P.businesses.names.map(name => ({ name, text: '' })) });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
