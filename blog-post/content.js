/* Blog post copy, captured word for word from https://www.bitgo.com/resources/blog/unocoin-security-incident/
   (shared/system/capture.py + _capture/blog-post/capture_extra.py; raw capture in _capture/blog-post/). Data only: never edit the copy.
   Title Case is applied at render. */
window.PAGE = {
 "title": "Unocoin Security Incident: What Happened and Why Wallet Controls Matter | BitGo",
 "description": "We are supporting the Unocoin team as they respond to the security incident affecting its operations and customers. With recent security incidents across the industry, customers deserve clear answers about what happened, which keys were involved, and...",
 "back": {
  "label": "Blog",
  "href": "https://www.bitgo.com/resources/blog/"
 },
 "meta": {
  "category": "Industry",
  "date": "Nov 13, 2026",
  "read": "3 min",
  "author": "BitGo Staff"
 },
 "h1": "Unocoin Security Incident: What Happened and Why Wallet Controls Matter",
 "image": {
  "src": "https://images.ctfassets.net/knkqyfncynw3/64oYdqC02Rncdy7yiw6QXb/862dfe56aeffc03fce4948165fed20d5/unocoin-image2.png?w=1500&q=60&fm=avif",
  "alt": ""
 },
 "body": [
  {
   "type": "p",
   "html": "We are supporting the Unocoin team as they respond to the security incident affecting its operations and customers. With recent security incidents across the industry, customers deserve clear answers about what happened, which keys were involved, and how funds were moved."
  },
  {
   "type": "p",
   "html": "Our review identified transfers involving ERC-20 tokens on Ethereum, XRP on the XRP Ledger, HBAR on Hedera and EOS. The detailed signing analysis below focuses on the affected Ethereum wallet."
  },
  {
   "type": "p",
   "html": "Unocoin’s affected wallet used a two-of-three multisignature setup, meaning any two of three signing keys could authorize a transfer. This was a self-custody arrangement in which Unocoin controlled the user and backup keys, while BitGo controlled the third key."
  },
  {
   "type": "img",
   "src": "https://images.ctfassets.net/knkqyfncynw3/6CguyrlpNagDrtLevUxONB/477ee07fdb0314a661b216a8cec1f86b/image__34_.png?w=1500&q=60&fm=avif",
   "alt": "Unocoin Security Incident: What Happened and Why Wallet Controls Matter - inline image 1",
   "caption": ""
  },
  {
   "type": "h2",
   "text": "Who Signed The Self-Custody Transactions",
   "id": "who-signed-the-self-custody-transactions"
  },
  {
   "type": "p",
   "html": "In the case of the Unocoin transactions, the signing addresses were:"
  },
  {
   "type": "ul",
   "items": [
    "<strong>Backup key:</strong><a href=\"https://etherscan.io/address/0x11b1EEa54D57D9a5B9303A951dB90A50f1F8D48F\"> 0x11b1EEa54D57D9a5B9303A951dB90A50f1F8D48F</a>. This address appears in the transaction’s <strong>From</strong> field and signed the transaction submitted to Ethereum.",
    "<strong>User key: </strong><a href=\"https://etherscan.io/address/0xb078a77a0a31d062c130809f73d25569b019db6a\">0xB078a77a0A31d062c130809F73D25569b019DB6A</a>. This address is recovered from the additional signature supplied in the sendMultiSigToken transaction input."
   ]
  },
  {
   "type": "p",
   "html": "The transaction and its input data are publicly available for independent examination. We matched the signing addresses to the wallet’s key records to identify their roles as Unocoin’s user and backup keys, and Unocoin has confirmed this as well."
  },
  {
   "type": "p",
   "html": "Normal withdrawals from this wallet through BitGo use the user key and BitGo’s key, with security checks and any configured policies applied before BitGo signs. The user and backup keys also allow the customer to move funds independently. This is an intentional configuration in any self-custody arrangement: customers can access their funds independently. In any self-custody arrangement, the backup key must be protected and stored separately from day-to-day signing systems."
  },
  {
   "type": "p",
   "html": "Our review found that the Ethereum transactions were signed using Unocoin’s user and backup keys and broadcast directly to the blockchain outside of BitGo’s platform. BitGo’s key was not used in any of the reviewed Ethereum transactions, and we found no corresponding transaction initiation records on BitGo’s platform."
  },
  {
   "type": "h2",
   "text": "Multisig Accountability Onchain",
   "id": "multisig-accountability-onchain"
  },
  {
   "type": "p",
   "html": "We believe this event highlights one of the key differentiators and advantages of multisig security: for this wallet, the onchain transaction data shows which keys authorized the transfers. MPC wallets typically produce a single onchain signature, so determining which signing parties participated generally requires reviewing offchain signing records."
  },
  {
   "type": "p",
   "html": "Multisig helped us establish which keys participated. In this wallet, the transaction data and signatures provide evidence that investigators can examine. Public records include a <a href=\"https://etherscan.io/tx/0x741f7d75f42bad2dce0de70f3b17672f779ad6fec1020ac48977c650245ae3dd\">November 9 multisig transaction</a> and a <a href=\"https://etherscan.io/tx/0x5ab41be4b11f17b70857e5055af71b38153d36cb7ae60594754933829e233abe\">token transfer from the affected wallet that same day</a>."
  },
  {
   "type": "p",
   "html": "Multisig’s protection, like those of other approaches, depends on security controls and separation of keys. Its visibility is a major benefit: identifying which keys signed helps investigators establish what happened and gives customers evidence they can assess independently."
  },
  {
   "type": "p",
   "html": "Accountability and transparency matter, especially after a breach. Customers should understand the wallet arrangement, what the evidence establishes, and which questions remain open. We have shared our findings and transaction reports with Unocoin."
  },
  {
   "type": "p",
   "html": "In a security event, clients concerned that their systems may have suffered a broader breach can freeze their BitGo enterprise account as a precautionary measure. Unocoin took this step through the BitGo client portal on November 6, 2026, at 11:29 UTC, while investigating the extent of the compromise of its systems."
  },
  {
   "type": "h2",
   "text": "Account Freezing",
   "id": "account-freezing"
  },
  {
   "type": "p",
   "html": "Unocoin’s blog post stated that they had “frozen” the account with BitGo. This led to some confusion about the features of self-custody wallets."
  },
  {
   "type": "p",
   "html": "When a client identifies a security event with their wallets, they often may not immediately know how severe the event could be. BitGo offers an account freeze option, which BitGo uses as an instruction to no longer sign any transactions for the wallet. This is a good precautionary measure, and Unocoin invoked it. However, freezing your account at BitGo does not undo the compromised user-held keys or transactions that had already occurred."
  },
  {
   "type": "p",
   "html": "An enterprise freeze stops outgoing transaction requests through BitGo’s platform and prevents BitGo from signing them with its key. In this incident, transaction-building requests submitted through BitGo on November 9 were blocked by the enterprise freeze. The freeze does not lock funds at the blockchain level. Someone able to use both the user and backup keys can still meet the wallet’s two-key requirement and submit a transaction independently."
  },
  {
   "type": "p",
   "html": "A platform freeze also does not revoke compromised customer-held keys. If both the user and backup keys are compromised, changing a password or adding platform withdrawal policies does not invalidate their ability to authorize transfers. BitGo has advised Unocoin to move its remaining funds to new wallets backed by newly generated keys."
  },
  {
   "type": "p",
   "html": "Wallet arrangements should reflect a customer’s security and operational needs, including who holds each key and how these keys are protected. Customers should understand which controls apply through the platform and how funds can be moved independently. Some clients prefer to hold one or multiple keys in a self-custody configuration. Others prefer BitGo Bank &amp; Trust, N.A., our OCC-regulated digital asset trust bank, to hold all three keys. Assets are held in segregated accounts structured to be insured and bankruptcy-remote."
  },
  {
   "type": "p",
   "html": "Explore BitGo’s wallet and custody services to find an arrangement that fits your institution’s security and operational needs."
  },
  {
   "type": "p",
   "html": "Learn more about <a href=\"https://www.bitgo.com/products/qualified-custody/?utm_source=blog&utm_medium=custody\">BitGo’s qualified custody services</a>."
  }
 ],
 "toc": "Table of Contents",
 "cta": {
  "title": "The digital asset infrastructure company.",
  "button": "Connect With Us"
 },
 "latest": {
  "title": "The Latest",
  "all": {
   "label": "All News",
   "href": "https://www.bitgo.com/resources/blog/"
  },
  "posts": [
   {
    "title": "Mint and Redeem USDC, Inside Your BitGo Account",
    "href": "https://www.bitgo.com/resources/blog/mint-and-redeem-usdc/",
    "image": "https://images.ctfassets.net/knkqyfncynw3/KRC2nqt2piDGrcJpQ0BGS/da40507b11c1085be85f0addd2538818/mint-and-redeem-usdc.png?w=400&q=60&fm=avif"
   },
   {
    "title": "Stablecoin Smart Contracts: How They Work and What to Audit",
    "href": "https://www.bitgo.com/resources/blog/stablecoin-smart-contracts/",
    "image": "https://images.ctfassets.net/knkqyfncynw3/75XiEWlnFol498DM07zxpS/060109f8c8201e0f8f1fbe4828f0d46a/mwrk740-banner-220122.png?w=400&q=60&fm=avif"
   },
   {
    "title": "Release Notes",
    "href": "https://www.bitgo.com/resources/blog/product-release-notes/",
    "image": "https://images.ctfassets.net/knkqyfncynw3/67IGUMxureGYZbNUyOfjFe/63ad42efab3dcfa99dfdea22d9fbaa9d/BitGo_Points.png?w=400&q=60&fm=avif"
   },
   {
    "title": "BitGo Link: Bringing More of Your Exchange Accounts Into One Platform",
    "href": "https://www.bitgo.com/resources/blog/bitgo-link-new-exchange-support/",
    "image": "https://images.ctfassets.net/knkqyfncynw3/xt0v43nvIWMuiXZOU519H/b077b6b7218c2bd975291a4187e5b7dc/bitgo-link-new-exchange-support.webp?w=400&q=60&fm=avif"
   }
  ]
 },
 "about": {
  "title": "About BitGo",
  "text": "BitGo is the digital asset infrastructure company, delivering custody, wallets, staking, trading, financing, and settlement services from regulated cold storage. Since our founding in 2013, we have been focused on accelerating the transition of the financial system to a digital asset economy. With a global presence and multiple regulated entities, BitGo serves thousands of institutions, including many of the industry's top brands, exchanges, and platforms, and millions of retail investors worldwide."
 }
};
