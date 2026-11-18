/* Careers (bitgo.com/company/careers/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroPrimary (centred): h1, subtitle, View Open Roles     Modules.hero { title, lead, cta }   no 3D (no library model
                                                                       means "careers"); live's background picture is not carried
     join      standaloneText: one sentence, "Future of Finance" in     Modules.statement { lines: [{ text, em }] }   the sentence lit
               blue                                                    as it scrolls, its live blue words in blue
     values    headline "Our Values" + multicard: 5 flip cards (name    Modules.lockup name rows { title, rows: [{ name, text }] }   4+
               on the front, one sentence on the back)                 cards = the Established rows; the back sentence is the row text
     benefits  list (list--right): Employee Benefits, intro, 4 rows     Modules.textlist { title, text, items }
     cta       ctaBanner: Join the BitGo Team + View Open Roles         Modules.banner { panel: false }
     news      newsletter                                               renderNewsModule                                          */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead, cta: P.hero.cta });
  Modules.statement($('#join'), { lines: [{ text: P.join.text, em: P.join.em }] });
  Modules.lockup($('#values'), { title: P.values.title, rows: P.values.rows });
  Modules.textlist($('#benefits'), { title: P.benefits.title, text: P.benefits.text, items: P.benefits.items });
  Modules.banner($('#cta'), { title: P.cta.title, cta: P.cta.cta, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
