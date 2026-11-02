import type { Post } from "./types";

export const visaPosts: Post[] = [
  {
    slug: "visa-model-of-find-and-buy-agentics",
    title: "The Visa Model of Find & Buy Agentics",
    seoTitle: "The Visa Model of Find & Buy Agentics | FindBuyAgent",
    description:
      "Visa Intelligent Commerce is the buy law for a Find & Buy Agent: a trusted identity, a token that is not a card number, and a mandate the network can decline. FindBuyAgent.com.",
    kicker: "Visa · Flagship",
    date: "2026-10-31",
    minutes: 14,
    series: "Visa",
    featured: true,
    keywords: [
      "Visa Intelligent Commerce",
      "Find & Buy Agentics",
      "Trusted Agent Protocol",
      "Visa mandate",
      "FindBuyAgent",
    ],
    related: ["visa-intelligent-commerce", "trusted-agent-protocol", "visa-or-x402"],
    blocks: [
      {
        type: "quote",
        label: "The claim",
        text: "A Find & Buy Agent is not a chatbot with a card. It is a principal’s mandate carried by software. Visa’s model is the first network design that treats that sentence as a payments problem: prove who the agent is, replace the card number with a bounded token, and let the network decline anything the mandate did not allow.",
      },
      {
        type: "p",
        text: "Find & Buy Agentics is the name for that split. Finding can be open, probabilistic, and curious. Buying cannot. The moment capital moves, the agent stops being a researcher and becomes a fiduciary. Visa Intelligent Commerce, the Trusted Agent Protocol, and the mandate object are how a card network draws that line without asking the agent to impersonate a person.",
      },
      {
        type: "h2",
        id: "payments-problem",
        text: "Why agentics is a payments problem",
      },
      {
        type: "p",
        text: "Most of the public conversation about shopping agents is about the find. Which model reads the page. Which one compares ten retailers. Which one understands a photo of a lamp. That work matters, and it is unfinished. It is also not the part that breaks commercial law.",
      },
      {
        type: "p",
        text: "The break happens at buy. A card network spent fifty years assuming a human was present, or at least that a human had typed a number into a form the merchant could challenge. An autonomous agent violates that assumption on purpose. If the network keeps treating the agent as either a human or an attack, every honest agent payment looks like fraud, and every fraud looks like a helpful assistant.",
      },
      {
        type: "p",
        text: "Visa’s chief executive, Ryan McInerney, put the obstacle in plain language in late October 2026: trust is proving an agent’s identity, linking it to a customer, and confirming the transaction stays inside the customer’s instructions. That is not a model-quality problem. It is a credential problem. Visa said it was already working with nearly fifty AI partners in production, and that more than half of its 5.2 billion credentials were tokenized, with tokenized credentials on more than 60 percent of e-commerce transactions. The rails were ready before the agents were trustworthy.",
      },
      {
        type: "h2",
        id: "the-split",
        text: "The split Visa already enforces",
      },
      {
        type: "p",
        text: "Find & Buy Agentics borrows a distinction the network has started to encode. In the find state, the agent may search, rank, and propose. No token is requested. No merchant is charged. A wrong guess costs compute, not money. In the buy state, the agent may act only inside a mandate the principal can read: what may be bought, a ceiling, a clock, and sometimes a merchant or a category.",
      },
      {
        type: "p",
        text: "Visa’s own developer example is almost a Find & Buy sentence: find and purchase these supplies, and keep the total under $100. Initiating that instruction lets Visa Acceptance Platform check that the agent is still inside the customer’s intent. The mandate is not a prompt. The fields that have been described publicly are a mandate identifier, a human-readable description, an effective-until time, and a decline threshold in an amount and a currency. A model can misunderstand a jacket size. It cannot quietly raise the decline threshold. The network holds that number.",
      },
      {
        type: "table",
        caption: "Find state versus buy state in the Visa model",
        columns: ["", "Find", "Buy"],
        rows: [
          ["Risk", "No capital moves", "A real authorization"],
          ["Engine", "Open reasoning over catalogs, links, and photos", "Deterministic checks against a mandate"],
          ["Credential", "None", "A network token, not a 16-digit number"],
          ["Who can say no", "The principal, before approval", "The issuer, the merchant, and Visa, at authorization"],
          ["Failure mode", "A bad shortlist", "An out-of-bounds charge, which should decline"],
        ],
      },
      {
        type: "h2",
        id: "three-checks",
        text: "Three checks, and the one that is still yours",
      },
      {
        type: "p",
        text: "A useful way to read the stack is as three checks the network can perform, and one it should not pretend to perform.",
      },
      {
        type: "ol",
        items: [
          "The merchant verifies the agent. The Trusted Agent Protocol, introduced with Cloudflare on 14 October 2025 and built on HTTP message signatures, lets a merchant accept a signed agent request instead of a shared password or a scraped session.",
          "The issuer verifies the token. The agent never holds the primary account number. It requests a token scoped to the purchase. In June 2026 Visa described richer token data — transaction type, where the token is used, and who is paying — plus an assurance signal drawn from how the token was provisioned and how it has behaved.",
          "Visa applies the consumer’s limits. The decline threshold, the expiry, and the instruction the principal actually signed are network facts. If the authorization does not fit, it does not clear.",
        ],
      },
      {
        type: "p",
        text: "The fourth check is the principal’s, and no network should steal it. Did this purchase match the purpose, not only the ceiling? “Under $100” does not mean “any $99 object.” A Find & Buy Agent on this site already refuses to buy until a person approves. That approval is the consumer-side half of the mandate. Visa can enforce the ceiling. The agent’s operator still has to show the person what will be bought.",
      },
      {
        type: "h2",
        id: "pilot",
        text: "What the October 2026 pilot actually proved",
      },
      {
        type: "p",
        text: "On 20 October 2026 Visa, BILL, and Billtrust launched a live pilot in which a trusted agent initiates and completes approved invoice payments through supplier portals. The BILL Payment Agent is registered with Visa’s Trusted Agent Protocol and an agentic directory. It uses tokenized credentials and controls aligned to the buyer’s approved instructions. Billtrust then recognizes that agent and lets it into the supplier portal, instead of demanding a human login that made automation impossible.",
      },
      {
        type: "p",
        text: "Read the pilot narrowly, which is how it deserves to be read. It is business invoice payment, not a consumer hunting for a cheaper television. The “find” has already happened: an invoice exists, a buyer has approved it, a supplier expects the money. The agent’s job is execution under an instruction, with both sides able to see who acted. Darren Parslow, Visa’s global head of commercial solutions, described the surrounding shift as businesses automating the work around payments — identifying supplier opportunities, approving invoices, and executing — while keeping control. That is Find & Buy Agentics in a procurement office. It is the proof that the buy engine can be live. It is not proof that open-web discovery is solved.",
      },
      {
        type: "h2",
        id: "how-to-sit",
        text: "How a Find & Buy Agent should sit on the model",
      },
      {
        type: "p",
        text: "The interface can stay human and small. Type the need, paste a link, or hand over a photo. That is find. The agent returns a shortlist and a price. Nothing is bought. That pause is not a missing feature. It is the moment a mandate is born.",
      },
      {
        type: "p",
        text: "Approval should compile into something a network can hold: a description a person can read, a ceiling, an expiry, and enough merchant detail that a later dispute can compare what was authorized with what was charged. The payment credential, when this is a card purchase, should be a Visa token created for that mandate, not a number stored in the agent’s context. If the agent is paying a metered API rather than a merchant of record, the buy engine may be x402 instead. The find engine does not get to choose the rail by improvising. The principal’s instruction does.",
      },
      {
        type: "h2",
        id: "not",
        text: "What this model is not",
      },
      {
        type: "ul",
        items: [
          "It is not a claim that FindBuyAgent.com is a Visa product, a partner integration, or an issuer. The model is the standard. The product is the ask-first agent.",
          "It is not permission for an agent to wander a card number through prompts. The number stays at the issuer.",
          "It is not the end of shopping. It is the end of using the same interface for a chore and for a pleasure. Replenishment can be mandated. A Saturday in a bookshop should not be.",
          "It is not settled law. The October pilot shows a path for approved B2B payments. Consumer retail, returns, and disputes when a model buys the wrong size are still being written, and they should be written against the mandate, not against a screenshot of a chat.",
        ],
      },
      {
        type: "p",
        text: "The award, if there is one, is not for a cleverer search box. It is for refusing to let the cleverness touch the money until the instruction is narrow enough for a network to enforce. That is the Visa model of Find & Buy Agentics. Find in the open. Buy inside a mandate. Decline the rest.",
      },
    ],
  },
  {
    slug: "visa-intelligent-commerce",
    title: "What Visa Intelligent Commerce Actually Checks",
    seoTitle: "What Visa Intelligent Commerce Checks | FindBuyAgent",
    description:
      "Tokens, assurance signals, and mandate fields: what Visa Intelligent Commerce can verify when an agent pays, and what it leaves to the principal. FindBuyAgent.com.",
    kicker: "Visa",
    date: "2026-10-28",
    minutes: 11,
    series: "Visa",
    keywords: ["Visa Intelligent Commerce", "payment token", "decline threshold", "agent mandate"],
    related: ["visa-model-of-find-and-buy-agentics", "ask-first-mandate", "trusted-agent-protocol"],
    blocks: [
      {
        type: "p",
        text: "Visa Intelligent Commerce is Visa’s platform for agentic commerce. The short version, from how Visa and its developers have described it: an agent receives a tokenized credential instead of a card number, the cardholder sets spending limits and conditions, and Visa sees commerce signals it can use for controls and disputes. Everything else people project onto the name — taste, brand fit, moral judgment — is not in the platform.",
      },
      {
        type: "h2",
        id: "token",
        text: "The token is the credential",
      },
      {
        type: "p",
        text: "A Find & Buy Agent that “has the card” in any literal sense is already designed wrong. The primary account number is a bearer secret. Paste it into a prompt, a log, or a merchant the agent scraped, and the bearer secret has left the only place that knew how to rotate it.",
      },
      {
        type: "p",
        text: "Intelligent Commerce’s move is to provision a token for the agent. In June 2026 Visa described enhancements that put more of the story on the token itself: the type of transaction, where the token is being used, and who is making the payment. It also described a token assurance signal built from how that token was provisioned and how it has behaved since. Those are network observations. They do not require the merchant to trust the agent’s autobiography.",
      },
      {
        type: "p",
        text: "For a Find & Buy product, the practical rule is blunt. The find engine may see offers, links, and photos. The buy engine may request a token when, and only when, a mandate exists. The token’s job is to be worthless outside that mandate. A stolen token that can only clear one merchant, under a ceiling, before a clock runs out, is a different loss from a stolen card number.",
      },
      {
        type: "h2",
        id: "mandate",
        text: "The mandate is the instruction the network can read",
      },
      {
        type: "p",
        text: "Visa’s documented example is domestic and specific: find and purchase these supplies, and keep the total under $100. Starting that instruction is what lets Visa Acceptance Platform test whether the agent is still acting for the customer. The fields described with a mandate are not poetry. They are an identifier, a description, an effective-until time, and a decline threshold as an amount and a currency.",
      },
      {
        type: "table",
        caption: "What a Visa-style mandate can and cannot carry",
        columns: ["Field", "What it constrains", "What it does not know"],
        rows: [
          ["Description", "The instruction in words a person can audit", "Whether the words were wise"],
          ["Decline threshold", "The most that may clear", "Whether a cheaper offer existed"],
          ["Effective until", "When the permission dies", "Whether the delivery will be on time"],
          ["Identifier", "Which instruction this charge claims to serve", "Whether a second, quieter instruction contradicted it"],
        ],
      },
      {
        type: "p",
        text: "This is why “healthy catering under $1,200” is a dangerous mandate if those are the only words compiled. The network can decline $1,201. It cannot decline shellfish unless shellfish was a constraint in the description the principal signed, and the merchant’s offer can be compared to that constraint. Intelligent Commerce checks congruence with the instruction it was given. It does not repair a vague instruction.",
      },
      {
        type: "h2",
        id: "signals",
        text: "Signals are for controls and disputes, not for taste",
      },
      {
        type: "p",
        text: "Sharing commerce signals with Visa is how a later dispute has something other than a chat log. The useful record is dull: which mandate identifier was presented, which token, which amount, which merchant, which time. If the cleared amount sits under the decline threshold and inside the clock, the network has done the job it claimed. If the person is unhappy because the shirt is the wrong color, that is a return policy, not an authorization failure.",
      },
      {
        type: "p",
        text: "Find & Buy Agents should store the same dull record on their side, in words. The person who tapped approve should be able to see the description, the ceiling, and the expiry without learning what a token is. The network’s copy and the person’s copy ought to match. When they do, “the agent went rogue” becomes a testable sentence instead of a mood.",
      },
      {
        type: "h2",
        id: "left-to-you",
        text: "What is left to the agent platform",
      },
      {
        type: "ul",
        items: [
          "Choosing the shortlist. Visa does not shop.",
          "Refusing to ask for a token until the person has approved a specific offer, if that is the product promise. Ask-first is a product rule on top of the network rule.",
          "Keeping fleet or household budgets that are tighter than the card limit. A network ceiling of $100 does not know that this week’s groceries were already $80.",
          "Deciding that this purchase is a card purchase at all. A metered API may belong on x402. Intelligent Commerce is the card-rail answer, not the only answer.",
        ],
      },
      {
        type: "p",
        text: "The platform earns trust by being narrower than the model’s imagination. Visa checks the token, the clock, and the ceiling. The Find & Buy Agent checks that a human still wants the thing. Both checks have to pass.",
      },
    ],
  },
  {
    slug: "trusted-agent-protocol",
    title: "Trusted Agent Protocol: The Merchant’s Side of the Payment",
    seoTitle: "Visa Trusted Agent Protocol Explained | FindBuyAgent",
    description:
      "How Visa’s Trusted Agent Protocol lets a merchant recognize a signed agent instead of blocking it as a bot. Built with Cloudflare on HTTP message signatures. FindBuyAgent.com.",
    kicker: "Visa",
    date: "2026-10-24",
    minutes: 10,
    series: "Visa",
    keywords: ["Trusted Agent Protocol", "Visa TAP", "HTTP message signatures", "agent identity"],
    related: ["visa-model-of-find-and-buy-agentics", "bill-billtrust-pilot", "merchant-of-record"],
    blocks: [
      {
        type: "p",
        text: "Tokens solve the issuer’s problem: the agent does not hold the card number. They do not solve the merchant’s problem. A merchant’s edge looks at traffic and has spent twenty years learning that automated traffic at checkout is an attack. A Find & Buy Agent that shows up as a browser with a stolen cookie will be treated like one. Visa’s Trusted Agent Protocol is the attempt to make the agent legible instead.",
      },
      {
        type: "h2",
        id: "what-tap-is",
        text: "What TAP is",
      },
      {
        type: "p",
        text: "Visa introduced the Trusted Agent Protocol on 14 October 2025, developed with Cloudflare and built on the HTTP message signature standard. The merchant can verify a signed agent request. The signature is how the request claims an identity. Verification is how the merchant checks that the identity is the one it thinks it is, and that the message was not rewritten on the way.",
      },
      {
        type: "p",
        text: "That is a different object from a login. A login says a human session exists. A TAP signature says a registered agent is speaking, and the bytes of this request are its. In the October 2026 BILL and Billtrust pilot, the distinction stopped being theoretical. The buyer’s agent is registered using the protocol and Visa’s agentic directory. The supplier platform recognizes that agent and lets it complete an approved payment, instead of forcing a person to type into a portal that was never going to be automated.",
      },
      {
        type: "h2",
        id: "firewall",
        text: "The firewall paradox",
      },
      {
        type: "p",
        text: "Security teams were not wrong to hate bots. Card testing, credential stuffing, and inventory hoarding are automated, and they look, at the edge, like a careful shopping agent. The mistake was having only one bucket. TAP’s bet is a second door: unverified automation still dies at the wall; attested agents are routed to a catalog or checkout API that can speak in structured data rather than in pixels.",
      },
      {
        type: "p",
        text: "A Find & Buy Agent should prefer that door even when scraping would be faster. Scraping borrows a human interface and then has to lie about being human. The lie is the entire fraud model. An agent that signs its request can be refused honestly — not registered, mandate missing, merchant not in scope — and the refusal is a protocol response, not a CAPTCHA.",
      },
      {
        type: "h2",
        id: "what-a-merchant-learns",
        text: "What the merchant learns, and what it still must not trust",
      },
      {
        type: "ul",
        items: [
          "That this request was signed by an agent identity the directory will stand behind.",
          "That the agent is acting under a principal’s instruction, when the signature is bound to a mandate rather than to a blank “pay anything” key.",
          "Not that the principal wanted this specific SKU if the mandate was vague. Identity is not intent.",
          "Not that the price is fair. TAP does not shop.",
        ],
      },
      {
        type: "p",
        text: "Merchants who treat a TAP pass as permission to skip product accuracy will lose the next dispute. The agent believed the feed. If the feed said refundable and the ticket was not, the signature that proves the agent was real also proves what the merchant claimed. Recognition cuts both ways.",
      },
      {
        type: "h2",
        id: "directory",
        text: "A directory is not a marketplace",
      },
      {
        type: "p",
        text: "Visa’s agentic directory, as used in the BILL pilot, is a place an agent is registered so a counterparty can resolve the signature to a known actor. It is not a store, and it should not become one. The moment the directory is the only place an agent is allowed to shop, the protocol has collapsed back into a mall. Find stays competitive — many merchants, many endpoints. Buy stays accountable — one signed actor, one mandate, one token.",
      },
      {
        type: "p",
        text: "For FindBuyAgent.com that means the shopping surface can remain a phone, a link, and a photo. The payment surface, when it is a Visa purchase, should be able to present an agent the merchant can verify. We do not pretend that signature exists in the demo. We do insist that the product’s shape — find freely, buy only after approval — is the shape TAP is for.",
      },
    ],
  },
  {
    slug: "bill-billtrust-pilot",
    title: "The First Live Visa Agent Payment, and What It Does Not Prove",
    seoTitle: "Visa, BILL, and Billtrust Agent Pilot | FindBuyAgent",
    description:
      "On 20 October 2026 Visa, BILL, and Billtrust put a trusted agent on a real invoice. What the pilot shows about Find & Buy Agentics, and what it leaves open. FindBuyAgent.com.",
    kicker: "Visa",
    date: "2026-10-21",
    minutes: 9,
    series: "Visa",
    keywords: ["BILL Payment Agent", "Billtrust", "Visa agent pilot", "B2B agentic commerce"],
    related: ["trusted-agent-protocol", "visa-model-of-find-and-buy-agentics", "merchant-of-record"],
    blocks: [
      {
        type: "p",
        text: "On 20 October 2026 Visa, BILL, and Billtrust said they had started the first live pilot in which a trusted AI agent initiates and completes approved buyer invoice payments, end to end, through supplier portals. It is the cleanest public fact in Find & Buy Agentics this autumn. It is also easy to over-read.",
      },
      {
        type: "h2",
        id: "the-flow",
        text: "The flow, without the adjectives",
      },
      {
        type: "ol",
        items: [
          "A BILL customer has already approved a payment instruction. The find, in this setting, is an invoice, not a vibe.",
          "The BILL Payment Agent is registered using Visa’s Trusted Agent Protocol and the agentic directory.",
          "The agent uses tokenized payment credentials, with controls aligned to that approved instruction, under the Visa Intelligent Commerce portfolio.",
          "Billtrust, on the supplier side, recognizes and authenticates the agent and lets it into the portal that used to require a person.",
          "The payment completes. Visa said the pilot was processing end-to-end transactions with participating buyers and suppliers.",
        ],
      },
      {
        type: "p",
        text: "The barrier it removes is specific. Many supplier portals assumed a human at the keyboard, so “automate accounts payable” stopped at the login. TAP gives the portal a way to admit an agent without handing it a shared password. Tokenization gives the payment a way to happen without dropping a card number into that portal.",
      },
      {
        type: "h2",
        id: "proves",
        text: "What it proves",
      },
      {
        type: "p",
        text: "It proves that a buy engine can be live on a card network when three things are true at once: the principal’s instruction already exists, the agent has an identity a supplier platform will honor, and the credential is a token bound to the instruction. Darren Parslow, who leads Visa Commercial Solutions, framed the business need as automating the work from supplier opportunity through invoice approval to execution, without giving up visibility into who acted and what had been approved.",
      },
      {
        type: "p",
        text: "It also proves the sequence Find & Buy Agentics wants. Approval first. Agent second. Money third. The pilot does not start with an agent deciding a company should pay a stranger. It starts with an approved instruction and removes the typing.",
      },
      {
        type: "h2",
        id: "does-not",
        text: "What it does not prove",
      },
      {
        type: "ul",
        items: [
          "It does not prove an agent can safely shop the open web for a household. There is no photo of a sofa in this pilot, and no ten-retailer price comparison.",
          "It does not set consumer dispute rules. An invoice the buyer approved is a kinder fact pattern than a model that guessed a size.",
          "It does not make shared portal passwords acceptable in the meantime. The point of the pilot is that the password stopped being the credential.",
          "It does not say every supplier portal will speak TAP this year. Visa has described commercial virtual-card authentication and supplier validation as pilots with general availability aimed at 2027. The invoice pilot is live. The rest of the commercial stack is still arriving.",
        ],
      },
      {
        type: "h2",
        id: "for-a-product",
        text: "What a Find & Buy product should copy",
      },
      {
        type: "p",
        text: "Copy the order of operations, not the industry. A person states a need. The agent finds. The person approves a concrete buy, which becomes the instruction. Only then does a credential move, and only a token scoped to that instruction. If the counterparty can verify the agent, use that door. If it cannot, do not dress the agent up as the person.",
      },
      {
        type: "p",
        text: "The pilot is a procurement story. The model inside it is the whole category. Find may be an invoice, a link, or a photograph. Buy is an approved instruction with a name on it.",
      },
    ],
  },
];
