/* Legal document (bitgo.com/legal/bitgo-terms-of-use/, the first terms page on the legal index). Shared modules only
   (shared/system/PLAYBOOK.md); copy word for word from window.PAGE. A reading page: no decoration, no 3D.
   Section map (live component -> module):
     hero      simplePage__header: the h1                            Modules.article { title }
     body      simplePage__text: the full terms (headings,           Modules.article { body, toc { hidden } }   live section headings -> h2 (ids kept);
               clauses, lists)                                       clauses keep their bold run-in titles
     news      newsletter                                            renderNewsModule
   Live shows no back link, date or closing CTA, so none are drawn. The contents column (toc { hidden }: no visible heading,
   live has none) lists the live section headings beside the ~18,000px terms.                                                  */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { title: P.h1 });
  Modules.article($('#body'), { body: P.body, toc: { label: P.h1, hidden: true } });   // the sections beside the long terms, no visible heading
  renderNewsModule($('#news'));
  Page.finish();
})();
