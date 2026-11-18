/* Legal index (bitgo.com/legal/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   A reading page: no decoration, no 3D.
   Section map (live component -> module):
     hero      headline--heading: the h1 "Legal"                     Modules.article { title }   the title block (the reading pages' opener;
                                                                     the full-height hero would leave one word on an empty screen)
     docs      multicard (30 cards, title only, each a link)         Modules.listing { posts, layout: 'rows', excerpt: false }   the homepage
                                                                     Latest's ruled rows (no images, no meta: live cards carry the title only)
     news      newsletter                                            renderNewsModule
   No closing CTA banner: live has none.                                                                                        */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { title: P.h1 });
  Modules.listing($('#docs'), { posts: P.docs, layout: 'rows', excerpt: false, meta: [] });
  renderNewsModule($('#news'));
  Page.finish();
})();
