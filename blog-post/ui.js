/* Blog post (bitgo.com/resources/blog/unocoin-security-incident/, the newest post on the blog index). Shared modules only
   (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      post-header: back link, meta, h1, hero image         Modules.article { back, meta, title, image }
     body      post-text + PostOutline (Table of Contents)          Modules.article { body, toc }
     cta       the outline's sidebar card (line + Connect With Us)  Modules.banner { panel: false }
     latest    post-list "The Latest" + All News (4 posts)          Modules.listing { title, all, posts, layout: 'grid', cols: 4 }
     about     post-text__legal "About BitGo"                       Modules.article { body, note }
     news      newsletter                                           renderNewsModule
   Live shows no share links or tags, so none are drawn.                                                                       */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { back: P.back, meta: P.meta, title: P.h1, image: P.image });
  Modules.article($('#body'), { body: P.body, toc: P.toc });
  Modules.banner($('#cta'), { title: [P.cta.title], cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  Modules.listing($('#latest'), { title: P.latest.title, all: P.latest.all, posts: P.latest.posts, layout: 'grid', cols: 4 });
  Modules.article($('#about'), { body: [{ type: 'h4', text: P.about.title }, { type: 'p', text: P.about.text }], note: true });
  renderNewsModule($('#news'));
  Page.finish();
})();
