/* Hot Wallets copy, captured word for word from https://www.bitgo.com/products/hot-wallets/ (shared/system/capture.py;
   raw capture in _capture/hot-wallets/). Data only: never edit the copy. Title Case is applied at render. */
window.PAGE = {
 "title": "Crypto Hot Wallets | Self-Custody Hot Wallets | BitGo",
 "hero": {
  "eyebrow": "Self-custody hot",
  "h1": "Hot Wallets Built for Institutions",
  "cta": "Connect With Us"
 },
 "trustTitle": "Globally trusted since 2013",
 "wc": {
  "title": "WalletConnect Is Now Available With BitGo Hot Wallets",
  "cta": {
   "label": "Learn More",
   "href": "https://www.bitgo.com/solutions/walletconnect/"
  }
 },
 "bestFor": {
  "eyebrow": "Best for",
  "title": "Managing Your Operating Capital",
  "text": "BitGo customers often keep a portion of their digital assets in crypto hot wallets to handle transfers, staking, and DeFi with greater speed and flexibility."
 },
 "keys": {
  "eyebrow": "Key Management",
  "title": "Self-Custody Hot Wallets",
  "text": [
   "With self-custody crypto hot wallets, you maintain the Client Key and the Backup Key, while BitGo keeps the Platform Key.",
   "To start a transaction, use your User Key. BitGo will only countersign if the transaction meets the policies you've set."
  ]
 },
 "list": {
  "eyebrow": "Self-custody hot wallets",
  "title": "Crypto Hot Wallets Designed for Your Business",
  "text": "Optimize for liquidity without sacrificing safety in the process.",
  "items": [
   {
    "title": "Transfer assets with confidence",
    "text": "Keep some assets liquid so you can capitalize on market opportunities or handle time-sensitive transactions."
   },
   {
    "title": "Take control of your security",
    "text": "Set up wallet policies to limit who can initiate or approve transactions, how much can be sent, and where the assets can go."
   },
   {
    "title": "Maintain liquidity across your operations",
    "text": "Keep digital assets readily accessible within a crypto hot wallet environment to support ongoing operational needs."
   },
   {
    "title": "Integrate with your existing infrastructure",
    "text": "Connect crypto hot wallets to your payment systems, exchanges, and treasury workflows through flexible APIs and a unified platform experience."
   }
  ]
 },
 "stats": [
  {
   "value": "9.3M+",
   "label": "Wallets Created"
  },
  {
   "value": "1700+",
   "label": "Assets Supported"
  },
  {
   "value": "$3T",
   "label": "Lifetime Transactions"
  }
 ],
 "features": [
  {
   "title": "Transfer Assets With Confidence",
   "text": [
    "Keep some digital assets liquid so you can capitalize on market opportunities or handle time-sensitive transactions."
   ],
   "cta": {
    "label": "Trading",
    "href": "https://www.bitgo.com/products/trading/"
   }
  },
  {
   "title": "Take Control of Your Security",
   "text": [
    "Define wallet policies to control who can initiate or approve transactions, set transfer limits, and restrict destination addresses."
   ],
   "cta": {
    "label": "Policies",
    "href": "https://www.bitgo.com/resource-center/bitgo-policies/"
   }
  },
  {
   "title": "Build a Holistic Wallets Solution",
   "text": [
    "Pair self-custody hot, cold, and custody wallets to keep some assets liquid for access to DeFi and staking, or keep some assets secure in qualified custody."
   ],
   "cta": {
    "label": "Self-Custody",
    "href": "https://www.bitgo.com/products/self-custody/"
   }
  }
 ],
 "layers": {
  "title": "Keeping Your Assets Secure, One Layer at a Time",
  "cards": [
   {
    "label": "Backup key storage",
    "title": "Store your backup key with a third-party to support recovery and redundancy."
   },
   {
    "label": "UI Access",
    "title": "View or transfer digital assets directly via the BitGo app."
   },
   {
    "label": "API Access",
    "title": "Access and manage self-custody hot wallets programmatically."
   },
   {
    "label": "Whitelisting",
    "title": "Pre-approve the addresses where assets can be sent for crypto hot wallet transactions."
   },
   {
    "label": "Velocity Controls",
    "title": "Cap how much can be moved in a given timeframe to reduce risk."
   },
   {
    "label": "User Management",
    "title": "Set roles and permissions on an individual level."
   }
  ]
 },
 "clients": {
  "title": "Supporting Thousands of Businesses Around the World"
 },
 "faqTitle": "FAQs",
 "faqNote": "Note: Self-custody wallets are provided through BitGo, Inc., while cold custody wallets are provided by a BitGo regulated entity.",
 "faqs": [
  {
   "q": "How does BitGo prevent a single compromised credential or system from draining funds?",
   "a": "Crypto hot wallets at BitGo use multi-signature security and policy enforcement to require multiple approvals before transactions are executed. This reduces reliance on any single credential or system and limits the risk of unauthorized fund movement."
  },
  {
   "q": "What policy controls (approvals, limits, whitelisting) can we enforce to match our internal governance?",
   "a": "BitGo enables granular policy controls across crypto hot wallets, including multi-user approvals, transaction limits, and address whitelisting. These controls allow institutions to align wallet activity with internal governance and risk management frameworks."
  },
  {
   "q": "How do we monitor and respond to suspicious transactions in real time?",
   "a": "Crypto hot wallets provide real-time visibility into transactions, supported by monitoring tools and policy enforcement. Institutions can review activity, enforce controls, and respond quickly to potential risks."
  },
  {
   "q": "What is the blast radius if a hot wallet is compromised, and how is that risk contained?",
   "a": "Hot wallet crypto risk is mitigated through policy controls, transaction limits, and segmentation of assets. By limiting exposure within any single wallet and enforcing controls, institutions can contain potential impact and protect broader holdings."
  },
  {
   "q": "How easily can hot wallets integrate into our existing payment, treasury, or exchange infrastructure?",
   "a": "Crypto hot wallets integrate with existing systems through APIs and platform interfaces, enabling seamless connectivity with payment flows, treasury operations, and exchange activity. This supports efficient, end-to-end digital asset management."
  },
  {
   "q": "If a self-custody hot wallet is connected and online, what is actually protecting us from a breach?",
   "a": "Hot wallets use multi-signature security, which is designed to reduce reliance on any single credential or system. With BitGo’s self-custody structure, the client holds the Client Key and Backup Key while BitGo holds the Platform Key. In normal operation, transactions are signed with your Client Key and cosigned by BitGo’s Platform Key, and BitGo only cosigns after enforcing the policies you’ve set, which gives you multiple layers of defense. The wallet uses a 2-of-3 signing quorum, so your Client Key and Backup Key can also sign without BitGo’s involvement, a path intended for recovery scenarios. This applies to both multisig and MPC wallets, although the recovery mechanisms differ. Clients are responsible for securing their keys and credentials."
  },
  {
   "q": "What signing and approval policies can we enforce before a transaction goes out?",
   "a": "Clients can set granular wallet policies that govern who can initiate or approve a transaction, how much can be sent, and where funds are allowed to go. These controls include multi-user approvals and address whitelisting, giving institutions the ability to align wallet activity with their internal governance and risk frameworks before any transaction is countersigned."
  },
  {
   "q": "How are keys secured given the hot wallet needs to be online?",
   "a": "Even though hot wallets stay connected for speed and flexibility, key management is split across parties. Clients retain the Client Key and Backup Key, and BitGo holds the Platform Key, which is secured in physical, tamper-resistant HSMs. No single party has full signing authority. The Backup Key can also be stored with a third party to support recovery and add redundancy, separate from day-to-day wallet operations."
  },
  {
   "q": "What limits can we set to cap exposure in a hot environment?",
   "a": "Institutions can apply velocity controls to cap how much value moves within a given timeframe, set transaction limits, and use whitelisting to pre-approve destination addresses. Together, these policies help contain exposure in an online environment without limiting the liquidity a hot wallet is meant to provide."
  },
  {
   "q": "How does the hot wallet coordinate with our cold storage for a full treasury setup?",
   "a": "Hot and cold wallets are designed to work together as part of a broader treasury structure. Clients typically keep a portion of assets in hot wallets to support transfers, staking, and DeFi activity, while holding other assets in cold storage or qualified custody provided by a BitGo regulated custodian for long-term security. This pairing lets institutions manage liquidity needs alongside stronger protection for assets that don't require immediate access."
  },
  {
   "q": "What is the recovery path if a hot wallet key is compromised?",
   "a": "Because signing authority is distributed across the Client Key, Backup Key, and Platform Key, a single compromised key doesn't grant unauthorized access to funds on its own. Clients can also store their Backup Key with a third party to support recovery and redundancy. If you suspect a key or credential has been compromised, notify BitGo immediately and cooperate with BitGo's investigation."
  }
 ],
 "fine": {
  "text": "Self-custody hot wallets are provided through our BitGo Inc. entity. Learn more.",
  "link": {
   "label": "Learn more",
   "href": "https://www.bitgo.com/entities/overview"
  }
 },
 "latest": {
  "title": "The Latest",
  "all": {
   "label": "All News",
   "href": "https://www.bitgo.com/resources/blog/"
  },
  "posts": [
   {
    "title": "Unocoin Security Incident: What Happened and Why Wallet Controls Matter",
    "href": "https://www.bitgo.com/resources/blog/unocoin-security-incident/"
   },
   {
    "title": "Mint and Redeem USDC, Inside Your BitGo Account",
    "href": "https://www.bitgo.com/resources/blog/mint-and-redeem-usdc/"
   },
   {
    "title": "Stablecoin Smart Contracts: How They Work and What to Audit",
    "href": "https://www.bitgo.com/resources/blog/stablecoin-smart-contracts/"
   },
   {
    "title": "Release Notes",
    "href": "https://www.bitgo.com/resources/blog/product-release-notes/"
   }
  ]
 },
 "cta": {
  "title": [
   "Own Your Digital",
   "Asset Strategy"
  ],
  "button": "Connect With Us"
 }
};
