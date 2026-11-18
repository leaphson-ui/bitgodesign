/* White papers index (bitgo.com/resources/white-papers/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      headline (centered): eyebrow "White Papers" + h1   Modules.hero { eyebrow, title }   the shared hero; no 3D (no library
                                                                  model means "white papers")
     library   multicard: 6 text cards (title, text,              Modules.listing { posts, layout: 'rows' }   the homepage Latest's
               "Read More")                                       ruled rows; each card's link label is post.go
     news      newsletter                                         renderNewsModule
   Live has no images on these cards, no filters and no closing CTA banner, so none are drawn.                              */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { eyebrow: P.hero.eyebrow, title: P.hero.title });
  Modules.listing($('#library'), { posts: P.library.posts, layout: 'rows' });
  renderNewsModule($('#news'));
  Page.finish();
})();
