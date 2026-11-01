import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  type Badge,
  type Brief,
  type JobKey,
  type Order,
  type PendingBuy,
  type Phone,
  type PillTone,
  type State,
  COFFEE_PENDING,
  ETSY_ITEMS,
  ETSY_PENDING,
  FILM_BUBBLE,
  FILM_COMMAND,
  NIKE_ITEMS,
  NIKE_PENDING,
  TV_OFFERS,
  TV_PENDING,
  askView,
  cheaperLine,
  classify,
  commandFor,
  customOffers,
  customPending,
  freshState,
  labelFromLink,
  labelFromPhoto,
  looksLikeLink,
  money,
  normalizeLink,
  type Tab,
} from "./model";

type JobPatch = {
  key: JobKey;
  badge?: Badge;
  hot?: boolean;
  line?: string;
  brief?: string;
};

type Action =
  | { type: "reset" }
  | { type: "patch"; patch: Partial<State> }
  | { type: "typed"; text: string }
  | { type: "savings"; value: number }
  | { type: "checked"; n: number }
  | { type: "clock"; clock: string }
  | { type: "pill"; pill: string; tone: PillTone }
  | { type: "jobs"; updates: JobPatch[] }
  | { type: "tab"; tab: State["tab"] }
  | { type: "input"; value: string }
  | { type: "approve"; orderId: string }
  | { type: "decline" }
  | { type: "track"; orderId: string; step: number }
  | { type: "open-ask"; phone: Extract<Phone, { view: "ask" }> }
  | { type: "ask-again" }
  | { type: "show-buy" }
  | { type: "show-digest" }
  | { type: "skip" };

type Engine = {
  alive: () => boolean;
  after: (ms: number, fn: () => void) => void;
  tween: (from: number, to: number, ms: number, on: (value: number) => void) => void;
  cancel: () => void;
};

function makeEngine(isReduced: () => boolean): Engine {
  let dead = false;
  const timers = new Set<number>();
  const frames = new Set<number>();
  return {
    alive: () => !dead,
    after(ms, fn) {
      if (dead) return;
      const wait = isReduced() ? Math.min(ms, 28) : ms;
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!dead) fn();
      }, wait);
      timers.add(id);
    },
    tween(from, to, ms, on) {
      const dur = isReduced() ? 1 : ms;
      const start = performance.now();
      const loop = (now: number) => {
        if (dead) return;
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - (1 - t) ** 3;
        on(Math.round(from + (to - from) * eased));
        if (t < 1) frames.add(requestAnimationFrame(loop));
      };
      frames.add(requestAnimationFrame(loop));
    },
    cancel() {
      dead = true;
      timers.forEach((id) => clearTimeout(id));
      frames.forEach((id) => cancelAnimationFrame(id));
    },
  };
}

function applyJobs(state: State, updates: JobPatch[]): State {
  const hotUpdate = updates.find((update) => update.hot === true);
  const jobs = state.jobs.map((job) => {
    const update = updates.find((item) => item.key === job.key);
    if (!update && !hotUpdate) return job;
    const hot = hotUpdate ? job.key === hotUpdate.key : update?.hot === false ? false : job.hot;
    if (!update) return { ...job, hot };
    return {
      ...job,
      hot,
      badge: update.badge ?? job.badge,
      line: update.line ?? job.line,
      brief: update.brief ?? job.brief,
    };
  });
  return { ...state, jobs };
}

function clearHot(): JobPatch[] {
  return (["amazon", "nike", "bestbuy", "costco", "etsy", "ups"] as JobKey[]).map((key) => ({
    key,
    hot: false,
  }));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return freshState();
    case "patch":
      return { ...state, ...action.patch };
    case "typed":
      return { ...state, typed: action.text };
    case "savings":
      return { ...state, savings: action.value };
    case "checked":
      return { ...state, checked: action.n };
    case "clock":
      return { ...state, clock: action.clock };
    case "pill":
      return { ...state, pill: action.pill, pillTone: action.tone };
    case "jobs":
      return applyJobs(state, action.updates);
    case "tab":
      return { ...state, tab: action.tab };
    case "input":
      return { ...state, input: action.value };
    case "show-buy":
      if (state.phone.view !== "found") return state;
      return { ...state, phone: { ...state.phone, showBuy: true } };
    case "open-ask": {
      if (state.phone.view === "ask") return state;
      const first = state.askSlotsUsed === 0;
      return {
        ...state,
        phase: "ask",
        pill: "needs you",
        pillTone: "fill",
        askSlotsUsed: state.askSlotsUsed + 1,
        asked: first ? Math.max(state.asked, 1) : state.asked + 1,
        phone: action.phone,
        clock: state.run === "film" ? "9:14" : state.clock,
      };
    }
    case "ask-again":
      if (state.phone.view !== "held") return state;
      return {
        ...state,
        phase: "ask",
        pill: "needs you",
        pillTone: "fill",
        phone: askView(state.phone.pending),
      };
    case "approve": {
      if (state.phone.view !== "ask") return state;
      const pending = state.phone.pending;
      const order = orderFrom(pending, action.orderId, state.orders.length + 1);
      const jobs = pending.job
        ? applyJobs(state, [{ key: pending.job, hot: false, badge: pending.boughtBadge }]).jobs
        : state.jobs;
      return {
        ...state,
        phase: pending.tag === "tv" ? "resolving" : "live",
        approved: state.approved + 1,
        tv: pending.tag === "tv" ? "bought" : state.tv,
        orders: [order, ...state.orders],
        balance: pending.mode === "paid" ? state.balance - pending.price : state.balance,
        jobs,
        phone: phoneAfterYes(pending, order.id),
        pill: pending.mode === "scheduled" ? "scheduled" : pending.tag === "tv" ? "ordered" : "ordered",
        pillTone: pending.tag === "tv" ? "line" : "mint",
        clock: pending.tag === "tv" ? "9:15" : state.clock,
      };
    }
    case "decline": {
      if (state.phone.view !== "ask") return state;
      const pending = state.phone.pending;
      const jobs = pending.job
        ? applyJobs(state, [
            {
              key: pending.job,
              hot: false,
              badge: pending.declineBadge ?? { tone: "wait", label: "Not now" },
            },
          ]).jobs
        : state.jobs;
      return {
        ...state,
        phase: "live",
        tv: pending.tag === "tv" ? "passed" : state.tv,
        jobs,
        pill: "held",
        pillTone: "ghost",
        phone: {
          view: "held",
          title: "Nothing bought.",
          detail:
            pending.tag === "tv"
              ? "The same TV is still $400 under Amazon. It stays there until you say so."
              : `${pending.title} stays unbought. Ask again whenever you want it.`,
          pending,
        },
      };
    }
    case "track":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.orderId ? { ...order, step: action.step } : order,
        ),
      };
    case "show-digest":
      return applyJobs(
        {
          ...state,
          phase: "live",
          pill: "done",
          pillTone: "ghost",
          phone: { view: "digest" },
        },
        clearHot(),
      );
    case "skip":
      return {
        ...freshState(),
        typing: false,
        booted: true,
        phase: "ask",
        run: "film",
        command: FILM_COMMAND,
        typed: FILM_COMMAND,
        clock: "9:14",
        pill: "needs you",
        pillTone: "fill",
        checked: 4,
        goal: 4,
        savings: 40000,
        asked: 1,
        askSlotsUsed: 1,
        phone: askView(TV_PENDING),
        jobs: applyJobs(freshState(), [
          { key: "amazon", hot: false, badge: { tone: "mint", label: "-$400" } },
        ]).jobs,
      };
    default:
      return state;
  }
}

function orderFrom(pending: PendingBuy, id: string, num: number): Order {
  return {
    id,
    num,
    store: pending.store,
    title: pending.title,
    price: pending.price,
    note: pending.note,
    carrier: pending.carrier,
    tracking: pending.tracking,
    steps: pending.steps ?? [],
    step: pending.steps && pending.steps.length > 1 ? 1 : 0,
    foot: pending.foot,
    mode: pending.mode,
    when: pending.when,
    tag: pending.tag,
  };
}

function phoneAfterYes(pending: PendingBuy, orderId: string): Phone {
  if (pending.mode === "scheduled") {
    return {
      view: "note",
      kicker: "Scheduled",
      title: `${pending.title}.`,
      sub: "Nothing captured. I'll ask again before it runs.",
      rows: [
        { k: "Store", v: pending.store },
        { k: "Next", v: pending.when },
        { k: "Then", v: money(pending.price) },
      ],
    };
  }
  return { view: "track", orderId };
}

const FILL: { at: number; updates: JobPatch[] }[] = [
  { at: 480, updates: [{ key: "nike", hot: true, badge: { tone: "work", label: "Working" } }] },
  {
    at: 1200,
    updates: [
      { key: "nike", hot: false, badge: { tone: "mint", label: "3 picks" } },
      { key: "bestbuy", hot: true, badge: { tone: "work", label: "Working" } },
    ],
  },
  {
    at: 1950,
    updates: [
      { key: "bestbuy", hot: false, badge: { tone: "wait", label: "Watching" } },
      { key: "costco", hot: true, badge: { tone: "work", label: "Working" } },
    ],
  },
  {
    at: 2700,
    updates: [
      { key: "costco", hot: false, badge: { tone: "wait", label: "Next Nov 29" } },
      { key: "etsy", hot: true, badge: { tone: "work", label: "Working" } },
    ],
  },
  {
    at: 3450,
    updates: [
      { key: "etsy", hot: false, badge: { tone: "mint", label: "3 picks" } },
      { key: "ups", hot: true, badge: { tone: "work", label: "Working" } },
    ],
  },
  { at: 4200, updates: [{ key: "ups", hot: false, badge: { tone: "mint", label: "1 on the way" } }] },
];

function fillBoard(eng: Engine, dispatch: (action: Action) => void, done?: () => void) {
  for (const beat of FILL) {
    eng.after(beat.at, () => {
      if (!eng.alive()) return;
      dispatch({ type: "jobs", updates: beat.updates });
    });
  }
  if (done) eng.after(5000, done);
}

function playFilm(eng: Engine, dispatch: (action: Action) => void, getState: () => State) {
  const cmd = FILM_COMMAND;
  let index = 0;
  const type = () => {
    if (!eng.alive()) return;
    index += 1;
    dispatch({ type: "typed", text: cmd.slice(0, index) });
    if (index < cmd.length) eng.after(index % 9 === 0 ? 84 : 26, type);
    else eng.after(380, () => reveal(eng, dispatch, getState));
  };
  eng.after(220, type);
}

function reveal(eng: Engine, dispatch: (action: Action) => void, getState: () => State) {
  if (!eng.alive()) return;
  dispatch({
    type: "patch",
    patch: {
      typing: false,
      booted: true,
      phase: "cinema",
      run: "film",
      command: FILM_COMMAND,
      clock: "9:12",
      pill: "shopping",
      pillTone: "fill",
      checked: 0,
      goal: 4,
      savings: 0,
      phone: { view: "scan", bubble: FILM_BUBBLE, seen: 0, offers: TV_OFFERS, sub: "checking 0 of 4 stores" },
    },
  });
  dispatch({
    type: "jobs",
    updates: [{ key: "amazon", hot: true, badge: { tone: "work", label: "Working" } }],
  });
  eng.after(520, () => scan(eng, dispatch, getState, 1, "9:12"));
}

function scan(
  eng: Engine,
  dispatch: (action: Action) => void,
  getState: () => State,
  seen: number,
  clock: string,
) {
  if (!eng.alive()) return;
  dispatch({ type: "checked", n: seen });
  dispatch({ type: "clock", clock });
  dispatch({
    type: "patch",
    patch: {
      phone: {
        view: "scan",
        bubble: FILM_BUBBLE,
        seen,
        offers: TV_OFFERS,
        sub: `checking ${seen} of 4 stores`,
      },
    },
  });
  if (seen === 1) eng.after(640, () => scan(eng, dispatch, getState, 2, "9:13"));
  else if (seen === 2) eng.after(720, () => scan(eng, dispatch, getState, 4, "9:13"));
  else eng.after(480, () => found(eng, dispatch, getState));
}

function found(eng: Engine, dispatch: (action: Action) => void, getState: () => State) {
  if (!eng.alive()) return;
  dispatch({
    type: "patch",
    patch: {
      phone: {
        view: "found",
        bubble: FILM_BUBBLE,
        offers: TV_OFFERS,
        sub: cheaperLine(TV_OFFERS),
        showBuy: false,
        pending: TV_PENDING,
      },
    },
  });
  eng.tween(0, 400, 680, (dollars) => dispatch({ type: "savings", value: dollars * 100 }));
  eng.after(760, () => {
    if (!eng.alive()) return;
    dispatch({ type: "pill", pill: "-$400", tone: "mint" });
    dispatch({ type: "clock", clock: "9:14" });
    dispatch({
      type: "jobs",
      updates: [{ key: "amazon", hot: false, badge: { tone: "mint", label: "-$400" } }],
    });
    dispatch({ type: "show-buy" });
  });
  eng.after(1650, () => {
    if (!eng.alive()) return;
    if (getState().phone.view !== "found") return;
    dispatch({ type: "open-ask", phone: askView(TV_PENDING) });
  });
}

function playSide(
  eng: Engine,
  dispatch: (action: Action) => void,
  getState: () => State,
  kind: Exclude<Brief, { type: "tv" }>,
) {
  const boot = (command: string, patch: Partial<State>) => {
    dispatch({
      type: "patch",
      patch: {
        typing: false,
        booted: true,
        run: "side",
        phase: "cinema",
        command,
        typed: command,
        tab: "shop",
        ...patch,
      },
    });
  };

  switch (kind.type) {
    case "nike":
      boot(commandFor("size 10, under $80"), {
        pill: "shopping",
        pillTone: "fill",
        goal: 3,
        checked: 0,
        phone: {
          view: "note",
          kicker: "Nike",
          title: "Size 10. Under $80.",
          sub: "Top rated. Pulling three.",
          rows: [],
        },
      });
      dispatch({ type: "jobs", updates: [{ key: "nike", hot: true, badge: { tone: "work", label: "Working" } }] });
      eng.after(700, () => {
        dispatch({ type: "checked", n: 3 });
        dispatch({ type: "jobs", updates: [{ key: "nike", hot: false, badge: { tone: "mint", label: "3 picks" } }] });
        dispatch({
          type: "patch",
          patch: {
            phase: "live",
            pill: "3 picks",
            pillTone: "mint",
            phone: {
              view: "picks",
              kicker: "Showing 3",
              title: "Size 10. Under $80.",
              sub: "Top rated. Nothing bought.",
              items: NIKE_ITEMS,
              pending: NIKE_PENDING,
            },
          },
        });
      });
      return;
    case "etsy":
      boot(commandFor("3 gifts for mom, under $50"), {
        pill: "shopping",
        pillTone: "fill",
        goal: 3,
        checked: 0,
        phone: {
          view: "note",
          kicker: "Etsy",
          title: "Three gifts. Under $50.",
          sub: "By Friday. Pulling three.",
          rows: [],
        },
      });
      dispatch({ type: "jobs", updates: [{ key: "etsy", hot: true, badge: { tone: "work", label: "Working" } }] });
      eng.after(700, () => {
        dispatch({ type: "checked", n: 3 });
        dispatch({ type: "jobs", updates: [{ key: "etsy", hot: false, badge: { tone: "mint", label: "3 picks" } }] });
        dispatch({
          type: "patch",
          patch: {
            phase: "live",
            pill: "3 picks",
            pillTone: "mint",
            phone: {
              view: "picks",
              kicker: "Showing 3",
              title: "For mom. Under $50.",
              sub: "By Friday. Nothing bought.",
              items: ETSY_ITEMS,
              pending: ETSY_PENDING,
            },
          },
        });
      });
      return;
    case "bestbuy":
      boot(commandFor("headphones, message me at -20%"), {
        pill: "shopping",
        pillTone: "fill",
        phone: {
          view: "note",
          kicker: "Best Buy",
          title: "Headphones.",
          sub: "Watching the price.",
          rows: [],
        },
      });
      dispatch({
        type: "jobs",
        updates: [{ key: "bestbuy", hot: true, badge: { tone: "work", label: "Working" } }],
      });
      eng.after(680, () => {
        dispatch({
          type: "jobs",
          updates: [{ key: "bestbuy", hot: false, badge: { tone: "wait", label: "Watching" } }],
        });
        dispatch({
          type: "patch",
          patch: {
            phase: "live",
            pill: "watching",
            pillTone: "line",
            phone: {
              view: "note",
              kicker: "Watching",
              title: "Headphones at −20%.",
              sub: "I'll message you. I won't buy.",
              rows: [
                { k: "Now", v: "$398" },
                { k: "Target", v: "$318" },
                { k: "Store", v: "Best Buy" },
              ],
            },
          },
        });
      });
      return;
    case "ups":
      boot(commandFor("tell me the day one runs late"), {
        pill: "shopping",
        pillTone: "fill",
        phone: {
          view: "note",
          kicker: "UPS",
          title: "Checking the late ones.",
          sub: "One scan.",
          rows: [],
        },
      });
      dispatch({ type: "jobs", updates: [{ key: "ups", hot: true, badge: { tone: "work", label: "Working" } }] });
      eng.after(680, () => {
        dispatch({
          type: "jobs",
          updates: [{ key: "ups", hot: false, badge: { tone: "mint", label: "1 on the way" } }],
        });
        dispatch({
          type: "patch",
          patch: {
            phase: "live",
            pill: "on the way",
            pillTone: "mint",
            phone: {
              view: "note",
              kicker: "On the way",
              title: "One package. On time.",
              sub: "I'll tell you the day it runs late.",
              rows: [
                { k: "Carrier", v: "UPS" },
                { k: "Tracking", v: "1Z88···440" },
                { k: "Status", v: "Out for delivery" },
              ],
            },
          },
        });
      });
      return;
    case "costco":
      boot(commandFor("coffee every 30 days, ask me first"), {
        pill: "shopping",
        pillTone: "fill",
        phone: {
          view: "note",
          kicker: "Costco",
          title: "Coffee, every 30 days.",
          sub: "Drafting the ask.",
          rows: [],
        },
      });
      dispatch({
        type: "jobs",
        updates: [{ key: "costco", hot: true, badge: { tone: "work", label: "Working" } }],
      });
      eng.after(640, () => {
        if (!eng.alive()) return;
        dispatch({ type: "open-ask", phone: askView(COFFEE_PENDING) });
      });
      return;
    case "custom": {
      const offers = customOffers(kind.text);
      const low = offers.find((offer) => offer.lowest) ?? offers[0];
      const amazon = offers.find((offer) => offer.blocked);
      const savings = low && amazon ? Math.max(0, amazon.price - low.price) : 0;
      const pending = low ? customPending(low, savings) : null;
      const image = kind.image;
      const href = kind.href;
      boot(commandFor(kind.text), {
        pill: "shopping",
        pillTone: "fill",
        goal: 4,
        checked: 0,
        phone: {
          view: "scan",
          bubble: kind.text,
          image,
          href,
          seen: 0,
          offers,
          sub: "checking 0 of 4 stores",
        },
      });
      if (getState().tv === "open") {
        dispatch({
          type: "jobs",
          updates: [{ key: "amazon", hot: true, badge: { tone: "work", label: "Working" } }],
        });
      }
      eng.after(420, () => {
        dispatch({ type: "checked", n: 2 });
        dispatch({
          type: "patch",
          patch: {
            phone: {
              view: "scan",
              bubble: kind.text,
              image,
              href,
              seen: 2,
              offers,
              sub: "checking 2 of 4 stores",
            },
          },
        });
      });
      eng.after(900, () => {
        if (!eng.alive() || !pending) return;
        dispatch({ type: "checked", n: 4 });
        if (getState().tv === "open") dispatch({ type: "savings", value: savings });
        dispatch({
          type: "jobs",
          updates:
            getState().tv === "open"
              ? [{ key: "amazon", hot: false, badge: { tone: "mint", label: money(savings).replace("$", "-$") } }]
              : [],
        });
        dispatch({
          type: "patch",
          patch: {
            phase: "live",
            pill: savings > 0 ? `-${money(savings)}` : "found",
            pillTone: "mint",
            phone: {
              view: "found",
              bubble: kind.text,
              image,
              href,
              offers,
              sub: cheaperLine(offers),
              showBuy: true,
              pending,
            },
          },
        });
        if (kind.buy) {
          eng.after(700, () => {
            if (!eng.alive()) return;
            if (getState().phone.view !== "found") return;
            dispatch({ type: "open-ask", phone: askView(pending) });
          });
        }
      });
      return;
    }
    default:
      return;
  }
}

export function useDemo(initialTab: Tab = "shop") {
  const bootTab = useRef(initialTab);
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const reducedRef = useRef(false);
  const engineRef = useRef<Engine | null>(null);

  const startFilm = useCallback(() => {
    engineRef.current?.cancel();
    const eng = makeEngine(() => reducedRef.current);
    engineRef.current = eng;
    dispatch({ type: "reset" });
    const tab = bootTab.current;
    bootTab.current = "shop";
    dispatch({
      type: "patch",
      patch: {
        typing: true,
        typed: "",
        command: "",
        phase: "cinema",
        run: "film",
        booted: false,
        pill: "shopping",
        pillTone: "fill",
        checked: 0,
        goal: 4,
        savings: 0,
        clock: "9:12",
        phone: { view: "blank" },
        tab,
      },
    });
    playFilm(eng, dispatch, () => stateRef.current);
  }, []);

  const approve = useCallback(() => {
    const current = stateRef.current;
    if (current.phone.view !== "ask") return;
    const pending = current.phone.pending;
    const orderId = `ord-${current.orders.length + 1}`;
    engineRef.current?.cancel();
    dispatch({ type: "approve", orderId });
    const eng = makeEngine(() => reducedRef.current);
    engineRef.current = eng;
    if (pending.steps && pending.tag !== "tv") {
      eng.after(800, () => dispatch({ type: "track", orderId, step: 2 }));
    }
    if (pending.tag !== "tv") return;
    eng.after(650, () => {
      dispatch({ type: "pill", pill: "tracking", tone: "line" });
      dispatch({ type: "clock", clock: "9:16" });
      dispatch({ type: "track", orderId, step: 2 });
    });
    eng.after(2100, () => dispatch({ type: "clock", clock: "9:17" }));
    fillBoard(eng, dispatch, () => {
      dispatch({
        type: "patch",
        patch: { phase: "live", clock: "9:18", pill: "done", pillTone: "ghost", phone: { view: "digest" } },
      });
      dispatch({ type: "jobs", updates: clearHot() });
    });
  }, []);

  const decline = useCallback(() => {
    const current = stateRef.current;
    if (current.phone.view !== "ask") return;
    const tag = current.phone.pending.tag;
    engineRef.current?.cancel();
    dispatch({ type: "decline" });
    if (tag !== "tv") return;
    const eng = makeEngine(() => reducedRef.current);
    engineRef.current = eng;
    fillBoard(eng, dispatch);
  }, []);

  const buy = useCallback(() => {
    const phone = stateRef.current.phone;
    if ((phone.view !== "found" && phone.view !== "picks") || !phone.pending) return;
    engineRef.current?.cancel();
    dispatch({ type: "open-ask", phone: askView(phone.pending) });
  }, []);

  const askAgain = useCallback(() => {
    if (stateRef.current.phone.view !== "held") return;
    dispatch({ type: "ask-again" });
  }, []);

  const showDigest = useCallback(() => {
    engineRef.current?.cancel();
    dispatch({ type: "show-digest" });
  }, []);

  const skip = useCallback(() => {
    if (stateRef.current.run !== "film" || stateRef.current.phase !== "cinema") return;
    engineRef.current?.cancel();
    dispatch({ type: "skip" });
  }, []);

  const submitLink = useCallback((raw: string) => {
    const href = normalizeLink(raw);
    if (!href) return;
    const text = labelFromLink(href);
    engineRef.current?.cancel();
    const eng = makeEngine(() => reducedRef.current);
    engineRef.current = eng;
    dispatch({ type: "input", value: "" });
    playSide(eng, dispatch, () => stateRef.current, { type: "custom", text, buy: false, href });
  }, []);

  const submitPhoto = useCallback((photo: { src: string; name: string }) => {
    const text = labelFromPhoto(photo.name);
    engineRef.current?.cancel();
    const eng = makeEngine(() => reducedRef.current);
    engineRef.current = eng;
    dispatch({ type: "input", value: "" });
    playSide(eng, dispatch, () => stateRef.current, {
      type: "custom",
      text,
      buy: false,
      image: photo.src,
    });
  }, []);

  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      if (looksLikeLink(text) && normalizeLink(text)) {
        submitLink(text);
        return;
      }
      const kind = classify(text);
      if (kind.type === "tv") {
        startFilm();
        return;
      }
      engineRef.current?.cancel();
      const eng = makeEngine(() => reducedRef.current);
      engineRef.current = eng;
      dispatch({ type: "input", value: "" });
      playSide(eng, dispatch, () => stateRef.current, kind);
    },
    [startFilm, submitLink],
  );

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startFilm();
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
      if (stateRef.current.phone.view !== "ask") return;
      if (event.key === "Enter") approve();
      if (event.key === "Escape") decline();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      engineRef.current?.cancel();
      window.removeEventListener("keydown", onKey);
    };
  }, [approve, decline, startFilm]);

  return {
    state,
    setTab: (tab: State["tab"]) => dispatch({ type: "tab", tab }),
    setInput: (value: string) => dispatch({ type: "input", value }),
    approve,
    decline,
    buy,
    askAgain,
    showDigest,
    skip,
    replay: startFilm,
    submit,
    submitLink,
    submitPhoto,
  };
}
