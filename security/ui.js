/* Security (bitgo.com/company/security/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/security/build_content.py after capture_hero.py).
   No imagery from bitgo.com (the user, 2026-11-18): models, scenes, existing UI arts and real marks only.
   Section map (live component -> module -> visual):
     hero          heroPrimary (no eyebrow,     Modules.hero           model key (multi-signature: no single key opens it, so no insider can move funds
                   no button)                                           alone; the lead's insider threats). NEEDS: the live shield loop is bitgo.com imagery
     trust         logoCloud                    Modules.logos          marquee (client marks)
     foundation    headline                     Modules.section        the shared headline
     architecture  headline+multicard(3)        Modules.multicard      3x: label -> title, the sentence -> text.
                                                                         scene lineSteps (self-custody wallets: activity climbs and rests against a fixed
                                                                         cap, the transaction limit policy);
                                                                         UI scSecurity (M-of-N: the withdrawal collects user key, backup key and BitGo co-sign,
                                                                         3 of 3, before it moves);
                                                                         UI sc2Secure (role-based approvals: a Treasury Operator initiates, two Wallet Admins
                                                                         approve, the policy passes)
     controls      list (rows right)            Modules.textlist       intro beside the three rows, rows on the right as live
     transparent   headline+multicard(4)        Modules.lockup         the homepage Established rows, the card title in the name column. NEEDS: the four
                                                                         live card pictures are bitgo.com imagery (and lockup has no picture slot)
     bounty        headline+multicard(3 links)  Modules.lockup         name rows that link out as live (the cards are names and links only, so no
                                                                         three pictures could say them)
     cta           headline (no live ctaBanner) Modules.section        the live closing headline in the closing slot (the stage's cta look)
     news          newsletter                   renderNewsModule
   Kinds: 3D model, scene, UI art (2). Arts scSecurity (modules.js), sc2Secure (shared/arts/stablecoins.js).                                                            */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, model: 'key', fit: 0.9, align: 'center' });
  Modules.logos($('#trust'), { title: P.trustTitle, logos: B.trust.logos });
  Modules.section($('#foundation'), P.foundation);
  Modules.multicard($('#architecture'), { title: P.architecture.title, cards: P.architecture.cards.map((c, i) => Object.assign({ title: c.title, text: c.text },
    [{ scene: 'lineSteps', opts: { steps: 7 } }, { art: 'scSecurity' }, { art: 'sc2Secure' }][i])) });
  Modules.textlist($('#controls'), P.controls);
  Modules.lockup($('#transparent'), { title: P.transparent.title, text: P.transparent.text, wrap: true, rows: P.transparent.cards.map(c => ({ name: c.title, text: c.text })) });
  Modules.lockup($('#bounty'), { title: P.bounty.title, text: P.bounty.text, wrap: true, rows: P.bounty.links.map(l => ({ name: l.name, text: '', href: l.href })) });
  Modules.section($('#cta'), P.contact);
  renderNewsModule($('#news'));
  Page.finish();
})();
