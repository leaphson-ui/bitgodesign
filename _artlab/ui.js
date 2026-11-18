/* Scratch lab for the multicard UI arts in shared/system/ui-arts.js. Three real Modules.multicard sections, wired the
   same way as cold-wallets/ui.js and prime/ui.js. Copy is the live copy from cold-wallets/content.js and prime/content.js. */
(function () {
  const $ = s => document.querySelector(s);
  Page.start();
  const cw = [
    ['YOUR HARDWARE', 'Reduce supply chain risk by sourcing hardware through multiple trusted distributors.'],
    ['OUR SOFTWARE', 'Use purpose-built software to securely initiate and sign transactions within your cold crypto wallet environment.'],
    ['HSM PROTECTION', 'Rely on hardware security modules (HSMs) to enforce wallet policies and protect transaction integrity.']
  ];
  Modules.multicard($('#cw'), { title: 'Keeping Your Assets Safe, One Feature at a Time', cards: cw.map(([label, title], i) => ({ title: label, text: title, art: ['cwHardware', 'cwSoftware', 'cwHsm'][i] })) });
  Modules.multicard($('#access'), {
    eyebrow: 'ACCESS', title: 'Global Liquidity Layer',
    text: 'BitGo’s Global Liquidity Layer connects institutions to liquidity across exchanges, market makers, and OTC counterparties, with execution methods designed to support different trading needs and workflows.',
    cards: [
      { title: 'Electronic Execution', text: 'Trade the way you operate through BitGo’s web platform, REST, FIX, or WebSocket APIs, and Order and Execution Management System (OEMS) integrations.', art: 'gmElectronic' },
      { title: 'Voice or Chat Execution', text: 'For block trades and complex transactions, BitGo’s OTC desk provides institutional liquidity, execution expertise, and dedicated trader support.', art: 'gmVoice' },
      { title: 'Advanced Tools', text: 'Advanced order types, transaction cost analysis, and reporting tools provide greater control and visibility into trading activity.', art: 'gmTools' }
    ]
  });
  Modules.multicard($('#manage'), {
    eyebrow: 'MANAGE', title: 'Financing, Derivatives, & Structured Solutions',
    text: 'Access liquidity, manage market exposure, and pursue defined financial objectives through BitGo Global Markets’ financing, derivatives, and collateral management capabilities.',
    cards: [
      { title: 'Prime Financing', text: 'Access financing against eligible digital assets to support trading activity and liquidity needs without selling existing holdings.', cta: { label: 'Financing', href: 'https://www.bitgo.com/products/financing/' }, art: 'gmFinancing' },
      { title: 'Derivatives & Structured Solutions', text: 'Access options, swaps, and structured products to hedge exposure, express market views, and pursue defined outcomes.', cta: { label: 'Download Report', href: 'https://www.bitgo.com/report/how-institutions-are-using-crypto-derivatives/' }, art: 'gmDerivatives' },
      { title: 'Collateral Management', text: 'Support secured financing arrangements through qualified custody, margin monitoring, and collateral servicing capabilities.', cta: { label: 'Collateral Management', href: 'https://www.bitgo.com/products/collateral-management/' }, art: 'gmCollateral' }
    ]
  });
  Page.finish();
})();
