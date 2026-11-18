/* About Us (bitgo.com/company/about-us/). Shared modules only (shared/system/PLAYBOOK.md); copy word for word from window.PAGE.
   Section map (live component -> module):
     hero      heroPrimary (centred): h1 over the shield video loop     Modules.hero { title }   no 3D and no live video (the user,
                                                                       2026-11-17: no existing bitgo.com imagery); the curtain holds it
     trust     logoCloud marquee: "Globally trusted since 2013"         Modules.logos { title, logos: BITGO.trust.logos }   marquee
     about     standaloneText (left): About BitGo, 5 paragraphs         Modules.article { body }   the blog post's reading column (left, as
                                                                       live sets it); prose centred five long paragraphs and read worse
     cta       ctaBanner (large): 2 lines + Connect With Us             Modules.banner { panel: false }, the shared Connect link
     news      newsletter                                               renderNewsModule                                          */
(function () {
  const P = window.PAGE, B = window.BITGO, $ = s => document.querySelector(s);
  Page.start();
  Modules.hero($('#hero'), { title: P.hero.title });
  Modules.logos($('#trust'), { title: P.trust.title, logos: B.trust.logos });
  Modules.article($('#about'), { body: [{ type: 'h2', text: P.about.title }, ...P.about.text.map(t => ({ type: 'p', text: t }))] });
  Modules.banner($('#cta'), { title: P.cta.title, cta: { label: P.cta.button, href: Page.CONNECT }, panel: false });
  renderNewsModule($('#news'));
  Page.finish();
})();
