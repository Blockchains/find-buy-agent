import type { Post } from "./types";

export const buyingPosts: Post[] = [
  {
    slug: "ask-first-mandate",
    title: "Ask First: The Mandate Is the Product",
    seoTitle: "Ask First: The Find & Buy Mandate | FindBuyAgent",
    description:
      "Nothing is bought until you approve. That pause is the mandate a Visa-style buy engine can enforce, and a chat log cannot. FindBuyAgent.com.",
    kicker: "Autonomous buying",
    date: "2026-10-18",
    minutes: 9,
    series: "Autonomous buying",
    keywords: ["ask first", "payment mandate", "Find & Buy Agent", "human approval"],
    related: ["visa-intelligent-commerce", "visa-model-of-find-and-buy-agentics", "how-an-agent-shops"],
    blocks: [
      {
        type: "p",
        text: "The least glamorous control in a Find & Buy Agent is the one that matters: nothing is bought until you approve. It looks like a button. It is the product. Without it, the rest of the stack — tokens, signatures, x402 vouchers — is a faster way to be wrong.",
      },
      {
        type: "h2",
        id: "pause",
        text: "The pause is where intent becomes a record",
      },
      {
        type: "p",
        text: "A person says “the same lamp, cheaper” or drops a photo or a link. That sentence is a brief, not a payment. The agent shops. It returns a thing, a seller, and a price. Approval is the first moment the brief is allowed to name an amount. Up to then, a mistake is a bad card on a phone screen. After that, a mistake is an authorization.",
      },
      {
        type: "p",
        text: "Visa’s mandate fields are a useful checklist for what the button must freeze. A description a person can still recognize tomorrow. A decline threshold, which on this product is the price they just saw, not an invisible budget the model may spend up to. An expiry, so a yes on Tuesday is not a yes in November. An identifier, so the charge can be joined back to this yes and not to a different conversation.",
      },
      {
        type: "h2",
        id: "vague",
        text: "Vague yeses are how agents get blamed",
      },
      {
        type: "p",
        text: "“Order something healthy for the board meeting, under $1,200” feels like an instruction and functions like a wish. A network can enforce the number. It cannot enforce healthy unless healthy was compiled into a constraint the merchant’s offer can fail. Ask-first only works if the screen shows the actual offer: the item, the seller, the time, the price. Approving a mood is not approving a purchase.",
      },
      {
        type: "p",
        text: "This is also why the find engine and the buy engine should not share a wallet. The find engine is supposed to consider options the person will reject. If it can pay while it is still considering, every rejected option is a race. Ask-first is the airlock between them.",
      },
      {
        type: "h2",
        id: "what-approval-is-not",
        text: "What approval is not",
      },
      {
        type: "ul",
        items: [
          "It is not a substitute for a network token. A button in a web app does not, by itself, stop a leaked card number.",
          "It is not a free pass for the merchant. If the goods are not what the feed promised, the mandate does not launder the description.",
          "It is not required for every human pleasure. People should still be allowed to shop without an agent. The rule is for when they delegated.",
          "It is not optional inside this product. Replay the film or send a link: the buy waits.",
        ],
      },
      {
        type: "p",
        text: "Autonomous buying, said honestly, is autonomous only after the mandate. The autonomy is in the searching, the comparing, and the filling of a checkout the person will not retype. The authority stays where the money is: with the principal, in a form a rail can decline.",
      },
    ],
  },
  {
    slug: "how-an-agent-shops",
    title: "How an Autonomous Buyer Shops a Category",
    seoTitle: "How an Autonomous Buyer Shops a Category | FindBuyAgent",
    description:
      "Before any payment rail is touched, a Find & Buy Agent has to search without getting tired, bored, or loyal. What that find loop should compute. FindBuyAgent.com.",
    kicker: "Autonomous buying",
    date: "2026-10-14",
    minutes: 10,
    series: "Autonomous buying",
    keywords: ["autonomous buying", "price comparison", "Find & Buy Agent", "satisficing"],
    related: ["ask-first-mandate", "visa-model-of-find-and-buy-agentics", "visa-or-x402"],
    blocks: [
      {
        type: "p",
        text: "People stop looking when an option is good enough. Herbert Simon called it satisficing, and a century of retail was built on it: the eye-level shelf, the sponsored slot, the tab you do not open. An autonomous buyer that shops like a tired person is just a more expensive ad click. The find loop has to be willing to look at option fourteen hundred with the same attention as option one.",
      },
      {
        type: "h2",
        id: "inputs",
        text: "Three ways a brief arrives",
      },
      {
        type: "p",
        text: "On this product the brief is deliberately small. You type a need, you paste a product link, or you upload a photo. Each one is a different find problem and the same buy rule.",
      },
      {
        type: "ul",
        items: [
          "Typed intent is underspecified on purpose. “Nike, size 10, under eighty” names a category, a constraint, and a ceiling. The agent still has to decide what counts as the same shoe.",
          "A link is overspecified. The page is a claim by one merchant. The agent’s job is to ask whether that claim is the best available instance, not to worship the URL.",
          "A photo is a recognition problem before it is a commerce problem. The label on the image is not a mandate. It is a guess the person can correct before anyone is paid.",
        ],
      },
      {
        type: "h2",
        id: "score",
        text: "Score the landed cost, not the hero price",
      },
      {
        type: "p",
        text: "The number on the picture is rarely the number that leaves the account. A serious find loop adds tax, shipping, duty if it applies, and the cost of a return that is not actually free. It subtracts a reward only if that reward is real money, not a point the program can devalue. It throws out offers that miss a hard constraint: the size, the delivery date, the material the person named. Sponsored rank is not a feature in this score. It is the thing the score exists to ignore.",
      },
      {
        type: "p",
        text: "Price dispersion on identical goods is mostly a search-cost story, the one George Stigler told in 1961. When polling another merchant is cheap, the dispersion that came from hiding the shipping table starts to collapse. Merchants who still hide the price behind “contact sales” simply fail the filter. An agent cannot book a demo at 11 p.m. and should not have to.",
      },
      {
        type: "h2",
        id: "stop",
        text: "Know when to stop, and when to ask",
      },
      {
        type: "p",
        text: "Unlimited search is not a gift if it delays a purchase the person needed today. The loop should stop when more looking cannot beat the best feasible offer by enough to matter, or when the brief was a specific link and the alternatives are not the same thing. Then it shows its work: the winner, the price, what it beat. The Visa buy, or an x402 payment, is not in this chapter. Those rails start after the person accepts the winner.",
      },
      {
        type: "p",
        text: "Autonomy in the find is a duty to be tireless and a duty to be boring. The interesting part of the purchase, if there is one, was supposed to stay with the human. The agent’s glory is a shortlist that did not depend on who bought the top of the page.",
      },
    ],
  },
  {
    slug: "merchant-of-record",
    title: "Who Is the Merchant When the Buyer Is Software",
    seoTitle: "Merchant of Record When an Agent Buys | FindBuyAgent",
    description:
      "The agent is not the store. Why the retailer stays merchant of record, and how that shapes disputes when a Find & Buy Agent pays. FindBuyAgent.com.",
    kicker: "Autonomous buying",
    date: "2026-10-10",
    minutes: 9,
    series: "Autonomous buying",
    keywords: ["merchant of record", "agentic checkout", "chargeback", "Find & Buy Agent"],
    related: ["trusted-agent-protocol", "bill-billtrust-pilot", "ask-first-mandate"],
    blocks: [
      {
        type: "p",
        text: "A quiet fear in retail is that the agent platform becomes the only store: one chat window, every brand behind it, the customer relationship captured by whoever owns the model. The fear is reasonable. It is also a choice, not a law of software. A Find & Buy Agent can buy from the merchant who actually sells the thing.",
      },
      {
        type: "h2",
        id: "mor",
        text: "Merchant of record is a legal job, not a UI job",
      },
      {
        type: "p",
        text: "The merchant of record is who the customer is buying from: who charges, who issues the receipt, who owns the return, who sits in front of the acquirer. If an agent platform inserts itself as that merchant for every purchase, it has built a marketplace and should be regulated and branded as one. If it does not, the retailer’s existing checkout remains the checkout. The agent is a buyer’s representative, the way a procurement clerk is, not a new storefront with a take rate hidden in the prompt.",
      },
      {
        type: "p",
        text: "Open storefront protocols — the ones retailers have pushed so they are not scraped into someone else’s mall — exist to keep that job where it is. The agent asks a structured catalog for price, tax, and delivery. It settles with a credential the retailer’s acquirer already understands. Visa’s side of that settlement is a token and a mandate. The retailer’s side is still the order.",
      },
      {
        type: "h2",
        id: "disputes",
        text: "Disputes get simpler when both sides wrote down the offer",
      },
      {
        type: "p",
        text: "When software buys, “I didn’t mean to” splits into cases, and they should not all be called fraud.",
      },
      {
        type: "ul",
        items: [
          "Inside the mandate. The offer matched the ceiling, the item, and the deadline the person approved. The merchant delivered that offer. Unhappiness is a return, not a chargeback. The pilot logic of an approved invoice lives here.",
          "Outside the mandate. The person approved noon and no shellfish. The agent accepted four o’clock and shellfish. That failure belongs to the agent’s operator, not to a merchant who told the truth in the feed.",
          "A dishonest feed. The merchant’s structured offer said refundable, or said wool, and the thing was neither. The agent did what it was told by the seller. The seller owns that.",
        ],
      },
      {
        type: "p",
        text: "None of those cases require the agent platform to become the merchant. They require the offer and the mandate to be specific enough to compare. A chat transcript is a bad exhibit. A signed instruction and a structured offer are a good one.",
      },
      {
        type: "h2",
        id: "product",
        text: "What this means on the phone screen",
      },
      {
        type: "p",
        text: "Show the seller’s name next to the price. Do not say “we bought it” if a retailer sold it. Do not hide whose return policy applies. The Find & Buy Agent can be relentless about the price and still be modest about the role. It found. The person approved. The merchant sold. The network, if it is a card, moved a token. Confusing those four jobs is how a useful agent becomes a marketplace nobody agreed to join.",
      },
    ],
  },
];
