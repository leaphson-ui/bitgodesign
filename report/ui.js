/* Report landing page (bitgo.com/report/australia-digital-asset-transition/, the newest report on bitgo.com/reports/).
   Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroPrimary__hub-breadcrumb + heroPrimary: back link   Modules.article { back, meta, title, lead, cta, image }   the
               "Research", label "Report", h1, deck, Download Report  article's title block (the blog post's opener). Not
               (the PDF), the live background picture                 Modules.hero: it has no back link and no live image, and
                                                                      the picture is the report's own cover
     news      newsletter                                             renderNewsModule
   Live shows nothing else on this page (no body, no closing CTA banner), so nothing else is drawn.                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { back: P.back, meta: { category: P.label }, title: P.h1, lead: P.lead, cta: P.cta, image: P.image });
  renderNewsModule($('#news'));
  Page.finish();
})();
