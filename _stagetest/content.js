/* Self-Custody copy, captured word for word from https://www.bitgo.com/products/self-custody/ */
window.SC = {
 "hero": {
  "eyebrow": "Self-Custody",
  "h1": "Self-Custody Asset Infrastructure",
  "cta": "Connect With us"
 },
 "trustTitle": "Globally trusted since 2013",
 "wc": {
  "title": "WalletConnect Is Now Available With BitGo Hot Wallets",
  "cta": {
   "label": "Learn More",
   "href": "https://www.bitgo.com/solutions/walletconnect/"
  }
 },
 "why": {
  "label": "Why Self-Custody",
  "title": "BitGo's Self-Custody Wallets Ensure Your Crypto Will Always Remain Yours",
  "text": "Take complete control of your crypto strategy by keeping the keys with who you trust the most-your business.",
  "cards": [
   {
    "title": "Security and control",
    "text": "Protect your funds by owning your own keys while leveraging BitGo's industry-leading multi-sig technology combined with custom account policies, such as user permissions or transaction limits, for added control."
   },
   {
    "title": "Compliant wallet architecture",
    "text": "Comply with local regulations requiring specific custody locations while continuing to rely on BitGo's leading technology and procedures."
   },
   {
    "title": "Flexible configurations",
    "text": "Access wallets via BitGo's streamlined app or via API to customize your self-custody setup with hot and cold wallets for maximum operational efficiency."
   }
  ]
 },
 "keys": [
  {
   "label": "Key Management",
   "title": "Hot Wallets",
   "text": [
    "With self-custody hot wallets, you maintain the Client Key and the Backup Key, while BitGo keeps the Platform Key.",
    "To start a transaction, utilize your User Key. BitGo will only countersign if the transaction meets the policies you've set."
   ],
   "cta": {
    "label": "Hot Wallets",
    "href": "https://www.bitgo.com/products/hot-wallets/"
   }
  },
  {
   "label": "Key Management",
   "title": "Cold Wallets",
   "text": [
    "With self-custody cold wallets, BitGo customers control two of the three keys, but do so in an offline environment instead of online.",
    "Customers initiate and half-sign transactions offline, then upload them to BitGo for countersigning - without the user key ever being exposed."
   ],
   "cta": {
    "label": "Cold Wallets",
    "href": "https://www.bitgo.com/products/cold-wallets/"
   }
  }
 ],
 "guide": {
  "title": [
   "A Closer Look at Crypto Custody",
   "vs. Self-Custody for Institutions"
  ],
  "cta": {
   "label": "Read More",
   "href": "https://www.bitgo.com/resources/blog/qualified-custody-vs-self-custody/"
  }
 },
 "features": [
  {
   "label": "API Access",
   "title": "Simply Build Custom Wallet Infrastructure",
   "text": "Programmatically create and manage self-custody wallets for your business and receive addresses for your end users.",
   "cta": {
    "label": "Wallet-as-a-Service",
    "href": "https://www.bitgo.com/products/wallet-as-a-service/"
   }
  },
  {
   "label": "In-app",
   "title": "Easily Manage Your Assets From a Streamlined App",
   "text": "Access both hot and cold self-custody wallets directly in BitGo's app to configure funds for ultimate control.",
   "cta": {
    "label": "Sign In",
    "href": "https://app.bitgo.com/web/auth/login"
   }
  }
 ],
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
 "faqTitle": "Frequently Asked Questions",
 "faqs": [
  {
   "q": "What does a self-custody wallet genuinely mean here in terms of who can access our assets?",
   "a": "A BitGo self-custody wallet means your organization controls the majority of signing keys, and every asset movement requires your key participation. Access follows the 2-of-3 key structure and the user, role, and policy permissions you configure."
  },
  {
   "q": "How does key recovery work if signers leave or credentials are lost?",
   "a": "Key recovery uses your separately stored backup key plus documented signer-replacement and administrator-recovery procedures. Maintaining multiple authorized signers and regularly testing the recovery process protects continuity when personnel change."
  },
  {
   "q": "Can we still apply institutional policy controls while self-managing our own keys?",
   "a": "Yes. BitGo self-custody wallets support institutional policies such as address whitelists, transaction limits, velocity controls, user roles, and multi-user approvals while your team retains key control."
  },
  {
   "q": "How is the self-custody infrastructure secured against both external attack and insider risk?",
   "a": "BitGo secures self-custody infrastructure with multi-signature authorization, hardware-security-module protection for its platform key, offline cold-wallet options, role separation, policy enforcement, and monitored transaction workflows. Your majority-key control reduces dependence on any single insider or system."
  },
  {
   "q": "What is the operational burden on our team compared to a custodial model?",
   "a": "Your team owns key storage, signer governance, access reviews, transaction approvals, recovery testing, and operational monitoring. BitGo supplies the wallet platform, APIs, policy engine, and secure co-signing infrastructure."
  },
  {
   "q": "How quickly and safely can we execute large transfers when we need to?",
   "a": "Large transfers can move as soon as your required signers and policies approve them, with hot-wallet workflows supporting faster execution and cold-wallet workflows adding offline signing. Pre-approved destinations, defined thresholds, and tested procedures improve speed without weakening controls."
  }
 ],
 "cta": {
  "title": [
   "Build Your",
   "Digital Asset Strategy"
  ],
  "button": "Connect With us"
 }
};
window.PAGE = window.SC;
