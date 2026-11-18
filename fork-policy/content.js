/* Fork Policy copy, captured word for word from https://www.bitgo.com/resources/fork-policy/
   (shared/system/capture.py + _capture/fork-policy/capture_extra.py; raw capture in _capture/fork-policy/). Data only: never edit the copy.
   Title Case is applied at render. */
window.PAGE = {
 "title": "Fork and Airdrop Policy | BitGo",
 "description": "How BitGo handles blockchain forks and airdrops.",
 "h1": "Fork Policy",
 "body": [
  {
   "type": "img",
   "src": "https://images.ctfassets.net/knkqyfncynw3/1riadXiOOUr0PzAUOxQ17Z/b90aa4be09679e7fb7ccc068c0893c38/Fork_Policy_Thumbnail.png?w=1500&q=60&fm=avif",
   "alt": "Blog Thumbnail - Fork Policy"
  },
  {
   "type": "h2",
   "text": "Airdrops vs Forks",
   "id": "airdrops-vs-forks"
  },
  {
   "type": "h3",
   "text": "Definitions"
  },
  {
   "type": "ul",
   "items": [
    "\"<strong>Airdrop</strong>\": An Airdrop is when a digital currency blockchain issues a new asset using known public keys or addresses from another blockchain, such that holders of private keys from the original blockchain may access value on the \"Airdropped\" blockchain.",
    "\"<strong>Fork</strong>\": A Fork is a new form of digital currency that emerges when a group of people decide to apply a new consensus layer to an existing blockchain. The result is the creation of a new blockchain, which can be very similar or very different from the original blockchain."
   ]
  },
  {
   "type": "p",
   "html": "For the purposes of this document, BitGo treats Airdrops and Forks similarly. BitGo customers generally desire to have access to all values which they may be able to access, and whether the new value is delivered via an Airdrop or a Fork, the evaluation and support of that new value by BitGo will be determined by the policy described in this document."
  },
  {
   "type": "p",
   "html": "The emergence of \"Forks\" and \"Airdrops\" has created a new vehicle for delivering perceived and real value to holders of existing digital currencies. The rapid deployment of new Forks and Airdrops has raised questions about how BitGo customers can expect to receive or not receive this value for themselves or for their customers. Each Fork or Airdrop faces unique technical, safety, liquidity, and timing challenges."
  },
  {
   "type": "p",
   "html": "This document outlines the framework and clarifies BitGo's policy on how to handle Forks for its customers."
  },
  {
   "type": "h2",
   "text": "Goals",
   "id": "goals"
  },
  {
   "type": "h3",
   "text": "Security"
  },
  {
   "type": "p",
   "html": "BitGo's primary goal is always security and safety. BitGo will never introduce support for any Fork where BitGo, at its sole discretion, believes it may be unsafe to do so. As Forks have emerged in the past year, many have been launched quickly, with rapidly changing technical implementations continuing right up to the launch of the new Fork."
  },
  {
   "type": "h3",
   "text": "Preservation of Value"
  },
  {
   "type": "p",
   "html": "BitGo also intends to preserve value for customers. When Forks occur with significant value, BitGo will work with customers to attempt to deliver that new value to customers. This may mean that BitGo can support the coin as a fully featured wallet with all the security principles that BitGo generally tries to maintain. It may mean that BitGo provides customers with tools such that they can access the coin and convert it to other forms of value."
  },
  {
   "type": "h2",
   "text": "Policy Considerations",
   "id": "policy-considerations"
  },
  {
   "type": "p",
   "html": "There are 5 considerations that factor into BitGo's decision to handle a Fork: technical stability, market capitalization, liquidity, cost, and timing."
  },
  {
   "type": "h3",
   "text": "Technical Stability"
  },
  {
   "type": "p",
   "html": "Because security is our most important goal, the technical evaluation of any new Fork or Airdrop is critical. In order for BitGo to support a Fork, BitGo must believe that the new Fork is technically stable, and safe. This determination will be made based on many factors, not limited to:"
  },
  {
   "type": "ul",
   "items": [
    "The technical team creating the Fork,",
    "Whether the Fork provides replay protection from the original chain,",
    "Whether the Fork provides wipeout-protection from the original Fork, and",
    "The strength of the new Fork's validator / mining capacity."
   ]
  },
  {
   "type": "h3",
   "text": "Market Capitalization"
  },
  {
   "type": "p",
   "html": "In order for BitGo to consider support for a new Fork or Airdrop, the value within the Fork or Airdrop must be significant. If it is not measurable on top-10 exchanges to be more than $100,000,000 of value globally, BitGo will likely not support the Fork. Note that in many cases, a new Fork or Airdrop may appear to have sufficient market capitalization to be supported, but it may not have sufficient liquidity (see below)."
  },
  {
   "type": "h3",
   "text": "Liquidity"
  },
  {
   "type": "p",
   "html": "In addition to having sufficient market value, the Forked coin must have sufficient liquidity. A Fork of Bitcoin, for example, with even a $10/coin valuation would have over a $160,000,000 market capitalization. However, if it is thinly traded, access to the value of the coin would be a mirage to BitGo customers."
  },
  {
   "type": "p",
   "html": "In order for BitGo to support the coin, there must be sufficient liquidity in the market on reputable exchanges for a sustained period of time. In general, BitGo would expect to find at least $25,000,000 of daily liquidity available on well-known, trustworthy exchanges for a period of 14 days for BitGo to consider the Forked coin having real value."
  },
  {
   "type": "h3",
   "text": "Cost"
  },
  {
   "type": "p",
   "html": "There is considerable overhead in supporting new coins. Once BitGo issues wallets for a coin, BitGo supports that coin and blockchain essentially forever. Some Forks are seemingly simple for BitGo to support. For example, if a Forked coin is technologically the same as the original, it may be relatively low cost to support the new coin."
  },
  {
   "type": "p",
   "html": "At the same time, some Forks or Airdrops may be technologically very different from existing supported coins. For example, new Airdrops or coins may be built upon different cryptographic algorithms (RSA instead of Elliptic Curve), may have new transaction formats, block formats, multi-signature features, or other changes."
  },
  {
   "type": "p",
   "html": "The larger the changes, the higher the cost to support and maintain. In general, if a new Fork is costly, but has sufficient value to BitGo customers, BitGo will use its best efforts to enable BitGo customers access to the new coin. However, it may affect the timing under which BitGo can do so."
  },
  {
   "type": "h3",
   "text": "Timing"
  },
  {
   "type": "p",
   "html": "New Airdrops and Forks usually are introduced with some notification before the Airdrop or Fork occurs. However, sometimes these notification periods can be very short - less than 8 weeks. Additionally, Airdrops can be done in such a way that the Airdrop later will \"expire\", giving implementers only short windows of time to claim the Airdrop before the value is lost."
  },
  {
   "type": "p",
   "html": "Unfortunately, BitGo cannot guarantee to support new Forks or Airdrops within any short timeframe. Business obligations, developer availability, and cost are all material factors, and safety, testing, quality, and service are our primary objectives. While BitGo will do its best to make value available to its customers, we cannot guarantee a specific timeframe when the exact considerations of future Forks can be so varied."
  },
  {
   "type": "p",
   "html": "Finally, should BitGo elect not to support a Fork at one point in time, it does not mean that BitGo will never support that Fork. For example, upon launch, a Fork may not meet the stability, market capitalization, or liquidity thresholds for BitGo to support. In the future, should the Fork become viable, BitGo may, at its sole discretion, elect to support the Fork or Airdrop."
  },
  {
   "type": "h3",
   "text": "Policy Statement"
  },
  {
   "type": "p",
   "html": "In the event of an upcoming modification to the Bitcoin Network or other applicable Network that could potentially result in a Digital Asset Network Fork or Airdrop, and BitGo determines that such a Fork or Airdrop is technically safe and has sufficient value and liquidity, BitGo will use commercially reasonable efforts to provide the value of the Forked Digital Asset to Customer at a timing determined by BitGo at its sole discretion."
  },
  {
   "type": "p",
   "html": "However, BitGo's first concern is always security of the Customer's existing Digital Assets. BitGo, at its sole discretion, may decide to make Digital Assets available to Customer. Additionally, it may take significant time for BitGo to implement or provide access to any Digital Asset created as a result of a Fork. Customer indemnifies BitGo against any direct, indirect, incidental, special or consequential losses due to inability to access any Digital Asset created as a result of a Fork or Airdrop."
  },
  {
   "type": "p",
   "html": "In the event that BitGo does consider a Fork to be technically safe with sufficient market value and liquidity, but Customer desires access to the Fork in advance of the timing that BitGo can provide due to cost or timing considerations, BitGo will, in good faith with Customer, determine a product plan at a reasonable fee to enable Customer to access the value of the Fork or Airdrop such that the Customer, at Customer's sole expense, could access the coin."
  },
  {
   "type": "p",
   "html": "BitGo reserves the right to update this policy and the criteria for measuring the viability of a Fork or Airdrop from time to time based on new technological, legal, or environmental factors that may emerge."
  }
 ],
 "meta": [
  "Last updated: April 9, 2026"
 ]
};
