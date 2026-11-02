import type { Post } from "./types";

export const x402Posts: Post[] = [
  {
    slug: "what-is-x402",
    title: "x402: How a Crypto Payment Agent Pays for a Request",
    seoTitle: "What Is x402 for Payment Agents | FindBuyAgent",
    description:
      "HTTP 402 was unused for thirty years. x402 turns it into a way for an agent to pay for a request, in stablecoin, without an account. FindBuyAgent.com.",
    kicker: "x402",
    date: "2026-10-07",
    minutes: 11,
    series: "x402",
    keywords: ["x402", "HTTP 402", "stablecoin agent payments", "USDC", "crypto payment agent"],
    related: ["visa-or-x402", "visa-model-of-find-and-buy-agentics", "ask-first-mandate"],
    blocks: [
      {
        type: "p",
        text: "HTTP status 402 has meant Payment Required since the 1990s, and almost nobody sent it. x402 is the open protocol that finally does. A client — a person, an app, or an agent — asks for a resource. If the resource costs money, the server answers 402 with payment terms. The client pays and retries. There is no merchant account to open first, no card form, and no session to keep warm.",
      },
      {
        type: "h2",
        id: "cycle",
        text: "The request cycle",
      },
      {
        type: "ol",
        items: [
          "The buyer requests the resource. At this moment it may not know the price.",
          "The server returns 402 Payment Required. The PAYMENT-REQUIRED header carries the terms: how much, which asset, which network, where the payment must land.",
          "The buyer signs a payment payload and sends it back on PAYMENT-SIGNATURE. The signature is the authorization. A raw key does not travel.",
          "A facilitator checks the payload and submits the settlement. In the Coinbase and Cloudflare descriptions, the facilitator does not hold the funds. It verifies and broadcasts a transaction the client already signed.",
          "The server delivers the resource.",
        ],
      },
      {
        type: "p",
        text: "That is a buy engine for things that are not really “orders”: an API call, a document, a query another agent will not answer for free. It fits machine-to-machine trade better than it fits a sofa. The sofa has tax, a truck, and a merchant of record. The API has a price per request and a buyer who may be software.",
      },
      {
        type: "h2",
        id: "money",
        text: "What the money is",
      },
      {
        type: "p",
        text: "x402 is not a coin. It is a way to attach a payment to HTTP. The smoothest asset in current descriptions is an EIP-3009 token such as USDC, which can move with a signature rather than a prior on-chain approval. Other ERC-20 tokens can be used through Permit2. Clients are expected to speak more than one network, including EVM chains and Solana. Cloudflare’s Monetization Gateway, in a closed beta announced at the end of September 2026 for eligible U.S. buyers and sellers, settles through Coinbase’s facilitator in USDC on Base. Those are deployment choices. They are not the whole protocol.",
      },
      {
        type: "p",
        text: "A crypto payment agent therefore needs a budget that is as dull as a Visa decline threshold. Which asset. Which chain. How much per call. How much per hour. Which hosts. An agent with a hot wallet and a curious find-loop will buy the internet by accident. x402 makes paying easy. Easy is the hazard. The mandate still has to be narrow, and it still has to be the principal’s.",
      },
      {
        type: "h2",
        id: "foundation",
        text: "Whose standard it became",
      },
      {
        type: "p",
        text: "Coinbase built x402 and open-sourced it. On 23 September 2025 it said it intended to stand up an x402 Foundation with Cloudflare. On 14 July 2026 the Linux Foundation said that foundation was operational and that Coinbase had contributed the protocol. The point of the move is governance. A payment header that only one company can change is a product. A payment header stewarded in the open, beside projects like the Linux kernel’s institutional home, can be infrastructure.",
      },
      {
        type: "p",
        text: "The member list is the strategic fact. Premier members reported with the foundation include Visa and Mastercard, Stripe and Adyen, American Express, Amazon Web Services, Google, Coinbase, Circle, Shopify, and Fiserv, plus chain organizations including Ripple, the Solana Foundation, the Stellar Development Foundation, and the Monad Foundation. The card networks did not stand outside the stablecoin door. They joined the body that specifies it. That is the context for the next essay: Visa’s token model and x402 are two buy engines, and the same companies intend to understand both.",
      },
      {
        type: "h2",
        id: "cousins",
        text: "Cousins, not clones",
      },
      {
        type: "p",
        text: "Mastercard’s Agent Pay for Machines, described on 20 October 2026, uses x402 as its basis: a business sets a task and a limit, a service answers 402, the agent signs a payment voucher inside the limit, the provider checks the voucher and does the work. Vouchers can be exchanged off-chain and redeemed later. A Cloudflare Connect session showed nine payments to two merchants under one approved budget. Same family as a Visa mandate — a ceiling, a signature, a refusal path — different settlement. Google’s September 2025 AP2 work also described an agent-to-agent x402 extension. The pattern is stable even where the asset is not: the agent pays because a person bounded the spend, not because the model felt confident.",
      },
    ],
  },
  {
    slug: "visa-or-x402",
    title: "Visa or x402: Two Buy Engines, One Find Agent",
    seoTitle: "Visa or x402 for a Find & Buy Agent | FindBuyAgent",
    description:
      "Card mandates and HTTP 402 solve different buys. When a Find & Buy Agent should use Visa Intelligent Commerce, and when it should pay with x402. FindBuyAgent.com.",
    kicker: "x402 · Visa",
    date: "2026-10-30",
    minutes: 12,
    series: "x402",
    keywords: ["Visa or x402", "agent payments", "stablecoin", "Find & Buy Agentics"],
    related: ["what-is-x402", "visa-model-of-find-and-buy-agentics", "merchant-of-record"],
    blocks: [
      {
        type: "quote",
        label: "The rule",
        text: "One find engine. Two buy engines. The find agent may compare a retailer and an API in the same hour. It may not pay both with the same instrument, and it may not hold either instrument while it is still looking.",
      },
      {
        type: "p",
        text: "Find & Buy Agentics is the split between looking and paying. Visa Intelligent Commerce is the buy engine for a purchase that already has a merchant, a receipt, a return, and a cardholder protection story. x402 is the buy engine for a request that should be able to settle in the same HTTP round trip, usually in a stablecoin, often between machines. Using one for the other’s job makes both look broken.",
      },
      {
        type: "h2",
        id: "choose",
        text: "How to choose",
      },
      {
        type: "table",
        caption: "Which buy engine the mandate should name",
        columns: ["Question", "Prefer Visa", "Prefer x402"],
        rows: [
          ["What is being bought?", "A good or a service with a merchant of record", "An API call, a document, a metered query"],
          ["Who is paid?", "A retailer or supplier the acquirer already knows", "A host that may have no prior account with the buyer"],
          ["What is the credential?", "A network token under a decline threshold", "A signed payment within an asset and a host allowlist"],
          ["What protects the principal?", "Card-network rules, the mandate, the merchant’s return policy", "The budget, the signature, and the fact the facilitator does not custody the funds"],
          ["What does failure look like?", "An authorization decline or a chargeback with two hashes to compare", "A 402 the agent refuses, or a payment that never gets replayed"],
        ],
      },
      {
        type: "h2",
        id: "visa-jobs",
        text: "Give Visa the purchases a person would have put on a card",
      },
      {
        type: "p",
        text: "A dishwasher, a carton of ink, an approved supplier invoice: these belong on the card rail if the principal’s money is already there. The October 2026 BILL and Billtrust pilot is the existence proof for the invoice. Consumer Find & Buy is the same shape with a different find — a link or a photo instead of a bill — and it should inherit the same buy law. Trusted Agent Protocol so the merchant can see the agent. A token so the card number stays put. A mandate so “under $100” is a decline threshold, not a suggestion in a prompt.",
      },
      {
        type: "p",
        text: "Do not send that dishwasher through x402 just because stablecoins are faster to tweet about. The buyer wanted a retailer, a delivery, and a human-readable receipt. Those are Visa-shaped facts. Inventing a wallet payment to skip the acquirer throws away the protection the person already pays for with the card.",
      },
      {
        type: "h2",
        id: "x402-jobs",
        text: "Give x402 the requests a card form would make absurd",
      },
      {
        type: "p",
        text: "An agent pricing freight may need a dozen paid lookups: a rate, a tariff table, a map tile, a product identifier. Opening a card authorization for four cents, twelve times, is a comedy. x402 is built for that comedy to end. The server states a price. The agent pays from a budget or it walks away. Mastercard’s machine-pay vouchers and Cloudflare’s gateway are the same idea in different clothes: many small settlements under one ceiling.",
      },
      {
        type: "p",
        text: "The hazard is the wallet. A Visa token can be minted for one mandate and then die. A stablecoin key that lives inside the find loop will eventually pay for a poisoned endpoint, because the find loop’s job is to touch endpoints it does not yet trust. The x402 budget should be a separate signer, capped per host and per day, unable to move the household’s rent money. Ask-first still applies when the call is surprising. It can be silent when the call is inside a budget the person already set for “lookups under two cents.” Silence is a mandate too. It just has to be written down before the searching starts.",
      },
      {
        type: "h2",
        id: "together",
        text: "They meet in the same companies, not in the same header",
      },
      {
        type: "p",
        text: "Visa sitting as a premier member of the x402 Foundation, alongside Mastercard, Stripe, Circle, and Shopify, is not a merger of the protocols. It is an admission that agents will need both, and that a network which understands only cards will watch machine payments happen on a header it did not help specify. A Find & Buy Agent should be just as bilingual, and just as strict about not mixing the dialects.",
      },
      {
        type: "p",
        text: "Practically: the find loop returns an offer and names the rail it expects. A retail offer names Visa, or whichever card mandate the person has funded. A data offer names x402, the asset, and the remaining budget. The person sees that name on anything that is not already inside a standing lookup budget. The agent does not get to “figure out payment” in free text. Payment is a field. If the field is empty, the answer is no.",
      },
      {
        type: "h2",
        id: "close",
        text: "One principal, two locks",
      },
      {
        type: "p",
        text: "Find & Buy Agentics was never a bet that one rail would win. It was a bet that finding and buying are different machines. Visa locks the card-shaped buy. x402 locks the request-shaped buy. The find agent is allowed to be clever in front of both locks, and allowed to hold the key to neither until the mandate says it may.",
      },
    ],
  },
];
