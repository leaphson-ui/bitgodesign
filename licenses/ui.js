/* Licenses (bitgo.com/company/licenses/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      headline (centred): h1 + the security line               Modules.hero { title, lead }   no 3D: the one allowed (key) is
                                                                       already on 2 other pages (security, singapore; the cap is 2)
     entities  multicard: 8 entity cards (flag, region, title, text,    Modules.listing { posts, layout: 'rows', thumb: 'mark', clamp:
               link label; Denmark has no link)                        false, meta: ['label'] }   the reports page's ruled rows: each
                                                                       entity's flag in its own colours, its region, the full licence
                                                                       text (never cut), the live link label; Denmark is a plain row
     news      newsletter                                               renderNewsModule
   Live has no closing CTA banner, so none is drawn.                                                                            */
(function () {
  const P = window.PAGE, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title, lead: P.hero.lead });
  Modules.listing($('#entities'), { posts: P.entities.posts, layout: 'rows', thumb: 'mark', clamp: false, meta: ['label'] });
  renderNewsModule($('#news'));
  Page.finish();
})();
