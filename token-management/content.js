/* Token Management copy, captured word for word from https://www.bitgo.com/products/token-management/
   (shared/system/capture.py, plus the hero's rotating title read from the live HTML; raw capture in _capture/token-management/).
   Data only: never edit the copy. Title Case is applied at render. */
window.PAGE = {
 "title": "Token Management | Vesting | BitGo",
 "hero": {
  "eyebrow": "Token Management",
  "h1": "Manage Your Token Operations",
  "words": [
   "Manage",
   "Simplify",
   "Customize",
   "Consolidate"
  ],
  "rest": "Your Token Operations",
  "lead": "From pre-mainnet to launch and beyond.",
  "cta": "Connect With Us"
 },
 "trustTitle": "Globally trusted since 2013",
 "report": {
  "eyebrow": "Report",
  "title": "Designing, Launching, and Sustaining a Crypto Network",
  "cta": {
   "label": "Download Report",
   "href": ""
  }
 },
 "designed": {
  "eyebrow": "Token Management",
  "lines": [
   "Streamlined,",
   "Automated Processes"
  ],
  "text": "Oversee every stage of the token lifecycle from a single platform.",
  "items": [
   {
    "title": "Token Vesting",
    "short": "Control the scheduled release of tokens.",
    "long": "Proper management of token vesting schedules ensures that stakeholders receive their tokens in a controlled and predictable manner"
   },
   {
    "title": "Token Unlocking",
    "short": "Automate secure access to vested tokens.",
    "long": "Manage and automate the process of making vested tokens available to stakeholders with smart contracts."
   },
   {
    "title": "Token Distribution",
    "short": "Ensure tokens reach intended recipients securely.",
    "long": "Tailor distribution schedules and process tokens in large batches to streamline operations for all stakeholders."
   }
  ]
 },
 "case": {
  "eyebrow": "Case Study",
  "title": "Launching a Secure Mainnet",
  "text": [
   "Berachain partners with BitGo to enable institutional access from day one."
  ],
  "cta": {
   "label": "Read more",
   "href": "https://landing.bitgo.com/rs/552-OGK-141/images/Berachain_Case%20Studies_2025APR%20%281%29.pdf?version=0"
  }
 },
 "benefits": {
  "title": "Key Benefits of Choosing BitGo",
  "text": "Built on a foundation of security, compliance, and flexibility, our platform offers institutions the tools to optimize their digital asset management with complete confidence.",
  "items": [
   {
    "title": "Regulated and secure custody",
    "text": "As a qualified custodian, BitGo provides the highest level of security, with segregated, bankruptcy-remote accounts."
   },
   {
    "title": "On-chain verifiable custody",
    "text": "Unlike other platforms that operate primarily off-chain, BitGo combines on-chain verifiable wallets with off-chain flexibility, ensuring transparency without compromising privacy."
   },
   {
    "title": "Investor verifiable solutions",
    "text": "The only token management solution that offers an investor-verifiable custody solution, setting a new benchmark for trust and transparency in the industry."
   },
   {
    "title": "Scalable for institutions",
    "text": "Specifically designed to meet the needs of large-scale institutional clients, providing the depth and expertise necessary for complex operations."
   }
  ]
 },
 "simplified": {
  "title": "Token Management, Simplified",
  "text": "From pre-mainnet to launch and beyond, streamline the management of token vesting, unlocking, and distribution effortlessly.",
  "cards": [
   {
    "label": "Secure custody",
    "title": "Deploy, store, and stake foundation treasury assets in regulated custody.",
    "cta": {
     "label": "Qualified Custody",
     "href": "https://www.bitgo.com/products/qualified-custody/"
    }
   },
   {
    "label": "Staking",
    "title": "Stake to earn rewards on your treasury assets in regulated custody.",
    "cta": {
     "label": "Staking",
     "href": "https://www.bitgo.com/products/staking/"
    }
   },
   {
    "label": "Safeguarded keys",
    "title": "Guarded by bank-grade vaults, redundant security processes, and customizable wallet policies.",
    "cta": {
     "label": "Insurance",
     "href": "https://www.bitgo.com/solutions/insurance/"
    }
   },
   {
    "label": "Safeguarded assets",
    "title": "Institutional-grade security with bankruptcy remote, segregated accounts."
   },
   {
    "label": "Grants & warrants",
    "title": "Administer grants and warrants to investors and employees, on and off-chain at scale."
   },
   {
    "label": "Vesting management",
    "title": "Token distribution to stakeholders on custom schedules in cold storage wallets.",
    "cta": {
     "label": "Token Management",
     "href": "https://www.bitgo.com/products/token-management/"
    }
   }
  ]
 },
 "trusted": {
  "title": "Discover Why the Leading Institutions Trust BitGo",
  "logos": [
   "../shared/assets/logos/token-management/00.svg",
   "../shared/assets/logos/token-management/01.svg",
   "../shared/assets/logos/token-management/02.svg",
   "../shared/assets/logos/token-management/03.svg",
   "../shared/assets/logos/token-management/04.svg",
   "../shared/assets/logos/token-management/05.svg",
   "../shared/assets/logos/token-management/06.svg",
   "../shared/assets/logos/token-management/07.svg"
  ]
 },
 "faqTitle": "Frequently Asked Questions",
 "faqs": [
  {
   "q": "In your token management setup, how are vesting schedules enforced on-chain and can they be altered after the fact?",
   "a": "Vesting and unlock schedules are configured in the Token Management platform when a grant is created (allocation, vesting, cliff, unlocking, and timezone), and the platform enforces them on BitGo custodial wallets. For fully funded grants (RTA), the platform places a lock on the grantee’s wallet and reduces it on each unlock date, so only the unlocked portion is spendable. Where the foundation funds grantees on the schedule (RTU), the tokens stay with the foundation until each release.<br>\nWallets and transfers are real onchain addresses and transactions, so balances and releases can be verified onchain. Only authorized foundation admins can amend a schedule, either event by event or in bulk by CSV, and grantees cannot change it."
  },
  {
   "q": "Who controls the tokens during the vesting lock-up, and what prevents early release?",
   "a": "Tokens are held in the grantee’s BitGo custodial wallet under a platform lock for RTA grants. BitGo’s wallet platform will not allow spending beyond the unlocked amount, and normal wallet policies and multi-key approvals still apply. For RTU grants, tokens remain in the foundation’s wallets and are sent to the grantee only on the schedule. Foundations control withdrawal permissions, terminations, and locks through the platform."
  },
  {
   "q": "How do we handle cliffs, revocations, and departures of grant recipients?",
   "a": "Cliffs can be set on both vesting and unlocking. Admins can pause, resume, or terminate a grant, and termination stops further vesting and unlocking as of the effective date. Tokens that have already been delivered can be recovered only where the foundation retains control of the wallet (for example, FBO setups), and this is a manual process."
  },
  {
   "q": "What reporting do we get for token allocations, vested amounts, and remaining locks?",
   "a": "Foundations can export grant and schedule reports showing grant total, start date, schedule time (UTC), total vested, and total unlocked. Detailed exports list each vest, unlock, and status per event. Admins also get a schedule preview chart, and wallets show locked versus available-to-spend balances. Wallet activity is also visible onchain."
  },
  {
   "q": "How are these tokens custodied and secured throughout the vesting period?",
   "a": "Tokens are held in BitGo’s regulated, segregated custody, under the BitGo entity that applies to your jurisdiction. Every movement goes through BitGo’s multi-key signing and your wallet policies and approvals. Locks and schedules are enforced at the platform level, and distributions run only as scheduled and authorized."
  },
  {
   "q": "Can recipients see and track their own vesting without touching the controls?",
   "a": "Yes. Foundations can switch on a read-only grantee dashboard that shows the vesting schedule. It is off by default and controlled from the Manage Grants settings. Grantees need a BitGo account and accept an email invitation. Only foundation admins can create or manage grants."
  }
 ],
 "cta": {
  "title": [
   "Own Your",
   "Financial Future"
  ],
  "button": "Connect With Us"
 }
};
