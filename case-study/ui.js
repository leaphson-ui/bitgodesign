/* Case study (bitgo.com/resources/case-studies/lantern-finance/, the newest case study on the index). Shared modules only
   (shared/system/PLAYBOOK.md); copy word for word from window.PAGE. The blog post's build.
   Section map (live component -> module):
     hero      caseStudy-header: back link, meta, h1, banner          Modules.article { back, meta, title, image }
     body      caseStudy-text (pull quote + body) + caseStudy-outline Modules.article { body, toc, profile }   the pull quote is the
               (About the Client, Table of Contents)                  body's first block (quote + cite); the client card heads the
                                                                      contents column
     cta       the outline's card (line + Connect With Us)            Modules.banner { panel: false }
     about     caseStudy-text__legal "About BitGo"                    Modules.article { body, note }
     news      newsletter                                             renderNewsModule
   Live shows no "The Latest", share links or tags on a case study, so none are drawn.                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { back: P.back, meta: P.meta, title: P.h1, image: P.image });
  Modules.article($('#body'), { body: P.body, toc: P.toc, profile: P.profile });
  Modules.banner($('#cta'), { title: [P.cta.title], cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  Modules.article($('#about'), { body: [{ type: 'h4', text: P.about.title }, { type: 'p', text: P.about.text }], note: true });
  renderNewsModule($('#news'));
  Page.finish();
})();
