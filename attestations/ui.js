/* Stablecoin Reserves (bitgo.com/stablecoin-reserves/). Approved modules only (shared/system/PLAYBOOK.md).
   Copy word for word from window.PAGE (content.js, built by _capture/attestations/build_content.py).
   Section map (live component -> module -> visual):
     hero      heroPrimary (no button)  Modules.hero           bank (the reserves: US dollars held at a bank, behind every token)
     usd1      multicard card 1 (USD1)  Modules.split          the live stablecoin cards have no headline, so each is a 50/50 of the mirrored pair
                                                               (as prime/settle without its headline): name, sentence, its live "See Reports" link;
                                                               the USD1 mark in BitGo glass (logo3d, partner usd1), right
     sofiusd   multicard card 2         Modules.split          the SoFi mark in BitGo glass (logo3d, partner sofi), left
     backing   standaloneText (2)       Modules.statement      the approved scroll-lit statement, one line per sentence; the figure (100%) in
                                                               blue; "AICPA criteria for stablecoin reporting" linked in place as live (statement link)
     cta       (no live ctaBanner)      Modules.banner { panel:false }  the page's own title over the shared button (as link/)
     news      newsletter               renderNewsModule
   No UI arts. Kinds: 3D models (hero, issuer marks in glass).                                                        */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.h1, lead: P.hero.lead, model: 'bank', fit: 0.85, align: 'center' });
  const coin = (sel, c, side, visual) => Modules.split($(sel), { title: c.name, text: [c.text], cta: c.cta, side, visual });
  coin('#usd1', P.coins[0], 'right', { model: 'logo3d', partner: 'usd1', fit: 0.9 });   // the issuer's mark in BitGo glass
  coin('#sofiusd', P.coins[1], 'left', { model: 'logo3d', partner: 'sofi', fit: 0.9 });
  Modules.statement($('#backing'), { lines: P.backing.lines.map((text, i) => ({ text, em: i ? '' : '100%', link: { text: P.backing.link.label, href: P.backing.link.href } })) });   // a two-sentence standaloneText is the approved statement
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: B.navActions.connect, href: Page.CONNECT }, panel: false });   // the shared nav button's label (no live banner)
  renderNewsModule($('#news'));
  Page.finish();
})();
