/* Policy page (bitgo.com/resources/fork-policy/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word
   from window.PAGE. A reading page: no decoration, no 3D; the one image is live's own.
   Section map (live component -> module):
     hero      simplePage__header: h1; the "Last updated" line       Modules.article { meta, title }   the date line is the meta line
               (the first line of the text on live)
     body      simplePage__text: the live image, the policy          Modules.article { body }   the image in the reading column as live;
                                                                     live h3s -> h2; run-in bold subheads -> h3
     news      newsletter                                            renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { meta: P.meta, title: P.h1 });
  Modules.article($('#body'), { body: P.body });
  renderNewsModule($('#news'));
  Page.finish();
})();
