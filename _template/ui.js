/* PAGE NAME. Built from shared modules only (see shared/system/PLAYBOOK.md). Copy word for word from window.PAGE (content.js).
   Section map (live component -> module):
     hero        heroSecondary   Modules.hero
     ...                                                                                                         */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();

  // ...one Modules.* call per section, in live order...

  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });   // closing CTA
  renderNewsModule($('#news'));
  Page.finish();
})();
