/* Bitcoin Staking (bitgo.com/products/bitcoin-staking/). Approved modules only (shared/system/PLAYBOOK.md). Copy word for word from window.PAGE.
   Section map (live component -> module -> visual):
     hero       heroPrimary (rotating end)  Modules.hero          head + words: the live trailing rotation (rise); validators (bitcoin put to work:
                                                                    independent nodes secure the network, rewards flow back out from the core)
     trust      logoCloud                   Modules.logos         marquee
     rewards    headline+2 cards            Modules.section + two mirrored Modules.split (the Self-Custody key-management pair), each card's live
                                                                    label as the eyebrow and its live link as the button:
                                                                    the live Babylon mark over lineSkyline (a Bitcoin-native staking layer, built on
                                                                    Bitcoin) / the live Core mark (inline SVG from the live cards,
                                                                    shared/assets/logos/bitcoin-staking/); NEEDS: no scene left in this page's share for Core
     manage     headline+6 cards            Modules.lockup        the homepage Established rows, the card title in the name column, linked rows where live links
                                                                    NEEDS: the rows' live link labels ("Qualified Custody", "Self-Custody") have no slot in a row
     faq        headline+faq                Modules.faq           the Terms link set in place (links)
     cta        ctaBanner                   Modules.banner { panel:false }
     news       newsletter                  renderNewsModule
   No UI arts on this page. Scene lineSkyline (scenes.js); marks babylon.svg, core.svg.                   */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, head: P.hero.head, words: P.hero.words, label: P.hero.title, lead: P.hero.lead, cta: { label: P.hero.cta, href: Page.CONNECT }, model: 'validators', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#rewards'), { title: P.rewards.title, text: P.rewards.text });
  P.rewards.cards.forEach((c, i) => Modules.split($(`#rewards-${'ab'[i]}`), { eyebrow: c.label, title: c.title, text: c.text, cta: c.cta, side: i ? 'left' : 'right', visual: [{ logo: '../shared/assets/logos/bitcoin-staking/babylon.svg', alt: c.title, scene: 'lineSkyline', opts: { lead: true }, logoAt: 'top' }, { logo: '../shared/assets/logos/bitcoin-staking/core.svg', alt: c.title }][i] }));   // each partner's live mark
  Modules.lockup($('#manage'), { title: P.manage.title, rows: P.manage.cards.map(c => ({ name: c.title, text: c.text.join(' '), href: c.cta && c.cta.href, go: c.cta && c.cta.label })) });
  Modules.faq($('#faq'), { title: P.faqTitle, items: P.faqs, links: P.faqLinks });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
