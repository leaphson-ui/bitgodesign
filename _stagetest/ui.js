(function () {
  const $ = s => document.querySelector(s); Page.start();
  Modules.section($('#hero'), { title: 'Pinned swap test' });
  Modules.pinned($('#acc'), { mode: 'swap', title: ['Transfer Agent', 'accordion test'], items: [{"title": "A unified solution", "short": "Powered by an API-forward integration.", "long": "Embed transfer agent capabilities directly into your platform, integrating seamlessly with existing UI/UX so issuers and investors stay fully within your native system."}, {"title": "Purpose-built", "short": "Designed for alternative investments.", "long": "Built with Reg CF, Reg A+, Reg D, and other regulatory exemptions from SEC registration in mind."}, {"title": "Real-time visibility", "short": "Access live records.", "long": "Receive real-time updates via webhooks and intuitive dashboards-enabling up-to-the-minute access to activity for holdings and transfer records."}, {"title": "Cost-efficient & scalable", "short": "Optimized for growth and value.", "long": "Built for scalable, cost-effective support of large volumes of issuers and investors, while enabling in-platform secondary liquidity to unlock new value."}], side: 'left', expose: '__acc', trackId: 'accTrack',
    visual: '<div class="slot" data-model="ledger" data-fit="0.85" data-align="center" aria-hidden="true"></div>' });
  Modules.banner($('#cta'), { title: ['End'], cta: { label: 'x', href: '#' }, panel: false });
  Page.finish();
})();
