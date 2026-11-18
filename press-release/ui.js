/* Press release (bitgo.com/press/bitgo-brings-usdc-minting-and-redemption-into-go-accounts/, the newest on the newsroom).
   Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero       breadcrumb (← Newsroom) + header (h1)                 Modules.article { back (+ icon), title }
     body       press-release__body: the release; the sidebar         Modules.article { body, aside, share }   the sidebar (date, Media
                (date, Media Inquiries, Press Resources) and the      Inquiries, Press Resources, each link's live glyph) and the share
                share row (LinkedIn, X, email, copy link)             row in the contents column beside the release
     about      About BitGo, Forward-Looking Statement, Contacts,    Modules.article { body, note }   end matter as small print
                and the source line ("View original release")
     more       "More news from BitGo" + View all news → (6 rows),   Modules.listing { title, all (+ icon), posts, layout: 'rows', more
                "← Back to newsroom"                                 { href, back, icon } }   the back link is a real link at the list's end
     news       newsletter                                           renderNewsModule
   No closing CTA banner: live has none.                                  */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.article($('#hero'), { back: P.back, title: P.h1 });
  Modules.article($('#body'), { body: P.body, aside: P.aside, share: P.share });
  Modules.article($('#about'), { body: P.end, note: true });
  Modules.listing($('#more'), { title: P.more.title, all: P.more.all, posts: P.more.posts, layout: 'rows', meta: ['label', 'date'], more: { label: P.more.back.label, href: P.more.back.href, back: true, icon: P.more.back.icon, step: P.more.posts.length } });
  renderNewsModule($('#news'));
  Page.finish();
})();
