import { useRef, useState } from "react";
import { Check, ImagePlus, Link2, Lock, PenLine, Star } from "lucide-react";
import {
  type Offer,
  type Order,
  type State,
  type TrackStep,
  digestCopy,
  digestText,
  digestTone,
  money,
  normalizeLink,
} from "./model";

type Props = {
  state: State;
  onApprove: () => void;
  onDecline: () => void;
  onBuy: () => void;
  onAskAgain: () => void;
  onWeek: () => void;
  onAskText: (text: string) => void;
  onAskLink: (url: string) => void;
  onAskPhoto: (photo: { src: string; name: string }) => void;
  onInput: (value: string) => void;
  onReplay: () => void;
};

const SUGGEST: { id: string; label: string; q: string }[] = [
  { id: "tv", label: "Replay TV run", q: "" },
  { id: "nike", label: "Nike size 10", q: "nike size 10 under $80 top rated show me 3" },
  { id: "bb", label: "Headphones −20%", q: "headphones message me at -20%" },
  { id: "co", label: "Coffee every 30 days", q: "costco coffee every 30 days ask me first" },
  { id: "et", label: "Gifts for mom", q: "3 gifts for mom under $50 by friday" },
];

export function PhoneStage(props: Props) {
  const { state } = props;
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="statusbar">
          <span>{state.clock}</span>
          <span className="island" aria-hidden />
          <span className="status-icons" aria-hidden>
            <span className="sig" />
            <span className="bat" />
          </span>
        </div>
        <div className="agent">
          <span className="avatar" aria-hidden />
          <span className="agent-name">Find & Buy Agent</span>
          <span className={`ppill tone-${state.pillTone}`}>{state.pill}</span>
        </div>
        <div className="phone-body">
          <PhoneBody {...props} />
        </div>
        {state.phase === "live" ? (
          <AskDock
            state={state}
            onAskText={props.onAskText}
            onAskLink={props.onAskLink}
            onAskPhoto={props.onAskPhoto}
            onInput={props.onInput}
            onReplay={props.onReplay}
          />
        ) : null}
        <div className="home-ind" aria-hidden />
      </div>
    </div>
  );
}

function PhoneBody({ state, onApprove, onDecline, onBuy, onAskAgain, onWeek }: Props) {
  const phone = state.phone;
  switch (phone.view) {
    case "blank":
      if (!state.booted) return null;
      return (
        <div className="rise ask-hello">
          <p className="kicker">Find & Buy Agent</p>
          <h2 className="digest-title">What should I find?</h2>
          <p className="quiet">Type it, paste a link, or upload a photo. Nothing is bought until you approve.</p>
        </div>
      );
    case "scan":
      return (
        <>
          <Bubble text={phone.bubble} image={phone.image} href={phone.href} />
          <Sub text={phone.sub} />
          <OfferGrid offers={phone.offers.slice(0, phone.seen)} highlight={false} />
        </>
      );
    case "found":
      return (
        <>
          <Bubble text={phone.bubble} image={phone.image} href={phone.href} />
          <Sub text={phone.sub} />
          <OfferGrid offers={phone.offers} highlight />
          {phone.showBuy && phone.pending ? (
            <button type="button" className="btn btn-mint press is-glow buy" onClick={onBuy}>
              <Check size={16} aria-hidden /> Buy now
            </button>
          ) : null}
        </>
      );
    case "ask":
      return (
        <div className="rise">
          <p className="kicker">{phone.kicker}</p>
          <h2 className="ask-title">{phone.title}</h2>
          <p className="ask-price">{phone.priceLine}</p>
          <p className="quiet">{phone.sub}</p>
          <Sheet rows={phone.rows} />
          <div className="ask-actions">
            <button type="button" className="btn btn-ghost press" onClick={onDecline}>
              Not now
            </button>
            <button type="button" className="btn btn-mint press is-glow" onClick={onApprove}>
              Approve
            </button>
          </div>
        </div>
      );
    case "track":
      return <TrackBody state={state} orderId={phone.orderId} />;
    case "digest": {
      const copy = digestCopy(state);
      return (
        <div className="rise">
          <p className="kicker">This week</p>
          <h2 className="digest-title">{copy.title}</h2>
          <p className="quiet">{copy.sub}</p>
          <ul className="dlist">
            {state.jobs.map((job) => (
              <li key={job.key}>
                <span className="dname">{job.name}</span>
                <span className="dline">{job.line}</span>
                <span className={`dval val-${digestTone(job)}`}>{digestText(job)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "held":
      return (
        <div className="rise">
          <p className="kicker">Held</p>
          <h2 className="digest-title">{phone.title}</h2>
          <p className="quiet">{phone.detail}</p>
          <button type="button" className="btn btn-mint press buy" onClick={onAskAgain}>
            Ask me again
          </button>
          <button type="button" className="linkish" onClick={onWeek}>
            This week
          </button>
        </div>
      );
    case "picks":
      return (
        <div className="rise">
          <p className="kicker">{phone.kicker}</p>
          <h2 className="digest-title">{phone.title}</h2>
          <p className="quiet">{phone.sub}</p>
          <ul className="ogrid">
            {phone.items.map((item) => (
              <li key={item.name} className="pcard">
                <div className="mono-mark" aria-hidden>
                  {item.name.slice(0, 1)}
                </div>
                <p className="pname">{item.name}</p>
                <p className="pstore">{item.meta}</p>
                <p className="prow">
                  <span className="rate">
                    <Star size={12} className="star" aria-hidden /> {item.rating}
                  </span>
                  <span className="pprice">{item.price}</span>
                </p>
              </li>
            ))}
          </ul>
          {phone.pending ? (
            <>
              <button type="button" className="btn btn-mint press buy" onClick={onBuy}>
                Buy the top one
              </button>
              <p className="fine">I'll ask before anything is charged.</p>
            </>
          ) : null}
          <button type="button" className="linkish" onClick={onWeek}>
            This week
          </button>
        </div>
      );
    case "note":
      return (
        <div className="rise">
          <p className="kicker">{phone.kicker}</p>
          <h2 className="digest-title">{phone.title}</h2>
          <p className="quiet">{phone.sub}</p>
          {phone.rows.length > 0 ? <Sheet rows={phone.rows} /> : null}
          <button type="button" className="linkish" onClick={onWeek}>
            This week
          </button>
        </div>
      );
    default:
      return null;
  }
}

function TrackBody({ state, orderId }: { state: State; orderId: string }) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return null;
  return (
    <div className="rise">
      <p className="kicker">
        Order #{order.num} · {order.store}
      </p>
      <h2 className="digest-title">
        {order.title}, {money(order.price)}
      </h2>
      <p className="quiet">{order.note}</p>
      {order.carrier ? (
        <p className="ship-row">
          <span>{order.carrier}</span>
          <span className="mono">{order.tracking}</span>
        </p>
      ) : null}
      {order.steps.length > 0 ? <Timeline steps={order.steps} step={order.step} /> : null}
      {order.step >= 2 && order.foot ? (
        <p className="foot">
          <Check size={14} aria-hidden /> {order.foot}
        </p>
      ) : null}
    </div>
  );
}

function Bubble({ text, image, href }: { text: string; image?: string; href?: string }) {
  let host = "";
  if (href) {
    try {
      host = new URL(href).hostname.replace(/^www\./, "");
    } catch {
      host = "";
    }
  }
  return (
    <div className="bubble">
      {image ? <img className="bubble-shot" src={image} alt="" /> : null}
      <p className="bubble-copy">{text}</p>
      {host ? <p className="bubble-host">{host}</p> : null}
    </div>
  );
}

function Sub({ text }: { text: string }) {
  return (
    <p className="subline">
      <i aria-hidden />
      {text}
    </p>
  );
}

function OfferGrid({ offers, highlight }: { offers: Offer[]; highlight: boolean }) {
  if (offers.length === 0) return null;
  return (
    <ul className="ogrid">
      {offers.map((offer) => (
        <li
          key={offer.id}
          className={`pcard rise${highlight && offer.lowest ? " is-lowest" : ""}${offer.blocked ? " is-blocked" : ""}`}
        >
          {highlight && offer.lowest ? <span className="ribbon">Lowest · same model</span> : null}
          <div className="pmedia">{offer.art === "tv" ? <TvMark muted={!!offer.blocked} /> : <span className="mono-mark">{offer.store.slice(0, 1)}</span>}</div>
          <p className="pstore">{offer.store}</p>
          <p className="pname">{offer.name}</p>
          <p className="prow">
            {offer.blocked || offer.rating == null ? (
              <span className="blocked">
                <Lock size={11} aria-hidden /> blocked
              </span>
            ) : (
              <span className="rate">
                <Star size={12} className="star" aria-hidden /> {offer.rating.toFixed(1)}
              </span>
            )}
            <span className="pprice">{money(offer.price)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function Sheet({ rows }: { rows: { k: string; v: string; pill?: boolean }[] }) {
  return (
    <dl className="sheet">
      {rows.map((row) => (
        <div key={row.k}>
          <dt>{row.k}</dt>
          <dd>{row.pill ? <span className="mini-pill">{row.v}</span> : row.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ steps, step }: { steps: TrackStep[]; step: number }) {
  return (
    <ol className="timeline">
      {steps.map((item, index) => {
        const done = index < step;
        const now = index === step;
        return (
          <li key={item.label} className={done ? "is-done" : now ? "is-now" : "is-wait"}>
            <span className="tick" aria-hidden />
            <span className="tl-label">{item.label}</span>
            <span className="tl-detail">{item.detail}</span>
            {now ? <span className="tl-now">now</span> : null}
            {done ? <Check size={14} aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function AskDock({
  state,
  onAskText,
  onAskLink,
  onAskPhoto,
  onInput,
  onReplay,
}: Pick<Props, "state" | "onAskText" | "onAskLink" | "onAskPhoto" | "onInput" | "onReplay">) {
  const [mode, setMode] = useState<"type" | "link" | "photo">("type");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [photo, setPhoto] = useState<{ src: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="ask"
      onSubmit={(event) => {
        event.preventDefault();
        if (mode === "type") onAskText(state.input);
        else if (mode === "link") {
          if (!normalizeLink(link)) {
            setLinkError("Paste a full product link");
            return;
          }
          setLinkError("");
          onAskLink(link);
          setLink("");
        } else if (photo) {
          onAskPhoto(photo);
          setPhoto(null);
        }
      }}
    >
      <div className="modes" role="tablist" aria-label="How to ask">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "type"}
          className={mode === "type" ? "mode is-on" : "mode"}
          onClick={() => setMode("type")}
        >
          <PenLine size={15} aria-hidden /> Type
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "link"}
          className={mode === "link" ? "mode is-on" : "mode"}
          onClick={() => setMode("link")}
        >
          <Link2 size={15} aria-hidden /> Link
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "photo"}
          className={mode === "photo" ? "mode is-on" : "mode"}
          onClick={() => setMode("photo")}
        >
          <ImagePlus size={15} aria-hidden /> Photo
        </button>
      </div>
      {mode === "type" ? (
        <div className="ask-row">
          <label className="sr" htmlFor="ask-type">
            What to find
          </label>
          <input
            id="ask-type"
            value={state.input}
            onChange={(event) => onInput(event.target.value)}
            placeholder="What should I find?"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={140}
            enterKeyHint="search"
          />
          <button type="submit" className="btn btn-ghost press ask-go">
            Find
          </button>
        </div>
      ) : null}
      {mode === "link" ? (
        <div className="ask-row">
          <label className="sr" htmlFor="ask-link">
            Product link
          </label>
          <input
            id="ask-link"
            value={link}
            onChange={(event) => {
              setLink(event.target.value);
              if (linkError) setLinkError("");
            }}
            placeholder="Paste a product link"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          <button type="submit" className="btn btn-ghost press ask-go">
            Find
          </button>
        </div>
      ) : null}
      {mode === "link" && linkError ? <p className="ask-error">{linkError}</p> : null}
      {mode === "photo" ? (
        <div className="ask-row">
          <button type="button" className="photo-pick" onClick={() => fileRef.current?.click()}>
            {photo ? <img src={photo.src} alt="" /> : <ImagePlus size={18} aria-hidden />}
            <span>{photo ? photo.name : "Upload a photo"}</span>
          </button>
          <button type="submit" className="btn btn-ghost press ask-go" disabled={!photo}>
            Find
          </button>
          <input
            ref={fileRef}
            className="sr"
            type="file"
            accept="image/*"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") setPhoto({ src: reader.result, name: file.name });
              };
              reader.readAsDataURL(file);
              event.target.value = "";
            }}
          />
        </div>
      ) : null}
      {mode === "type" && state.phone.view === "blank" && state.booted ? (
        <div className="ask-chips">
          {SUGGEST.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="chip press"
              onClick={() => (chip.id === "tv" ? onReplay() : onAskText(chip.q))}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function TvMark({ muted }: { muted?: boolean }) {
  return (
    <svg viewBox="0 0 160 96" className={muted ? "tv-mark is-muted" : "tv-mark"} aria-hidden>
      <rect x="4" y="6" width="152" height="70" rx="8" className="tv-bezel" />
      <path d="M14 62 L36 34 L52 48 L74 26 L98 52 L120 34 L146 62 Z" className="tv-peaks" />
      <rect x="68" y="76" width="24" height="6" className="tv-neck" />
      <rect x="52" y="82" width="56" height="5" rx="2" className="tv-base" />
    </svg>
  );
}
