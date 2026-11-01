import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Board } from "./board";
import { Market } from "./market";
import { money, type Tab } from "./model";
import { Orders, Vault } from "./panels";
import { PhoneStage } from "./phone";
import { AppHeader } from "./shell";
import { useDemo } from "./use-demo";

export function FindBuyApp({ initialTab = "shop" }: { initialTab?: Tab }) {
  const demo = useDemo(initialTab);
  const navigate = useNavigate();
  const { state } = demo;
  const [marketSeed, setMarketSeed] = useState("");
  const line = state.typing ? state.typed : state.command;
  const showSkip = state.run === "film" && state.phase === "cinema";
  const live =
    state.phone.view === "ask"
      ? `Approval needed. ${state.phone.title} ${state.phone.priceLine}`
      : state.booted
        ? state.pill
        : "Ready";

  const choose = (tab: Tab) => {
    demo.setTab(tab);
    void navigate({
      to: "/",
      search: tab === "shop" ? {} : { tab },
      replace: true,
    });
  };

  return (
    <div className="app">
      <h1 className="sr">Find & Buy Agent</h1>
      <p className="sr" aria-live="polite">
        {live}
      </p>
      <AppHeader active={state.tab} onTab={choose} />
      <main className="frame">
        <div className="cmdbar">
          <div className="cmd">
            <span className="prompt">~/agent</span>
            <span className="chev" aria-hidden>
              ›
            </span>
            <span className="cmdtext">{line}</span>
            {state.typing ? <span className="caret" aria-hidden /> : null}
          </div>
          <div className="cmdmeta">
            {showSkip ? (
              <button type="button" className="linkish" onClick={demo.skip}>
                skip
              </button>
            ) : (
              <button type="button" className="linkish" onClick={demo.replay}>
                replay
              </button>
            )}
            <span className="ver">v0.78.1 · Oct 28, 2026</span>
          </div>
        </div>
        {state.booted ? (
          <section className="stats" aria-label="Run">
            <div className="stat">
              <p className="stat-num">
                {state.checked}
                <span className="stat-den">/{state.goal}</span>
              </p>
              <p className="stat-label">
                Stores
                <br />
                checked
              </p>
            </div>
            <div className="stat">
              <p className="stat-num">{money(state.savings)}</p>
              <p className="stat-label">
                Less than
                <br />
                Amazon
              </p>
            </div>
            <div className="stat">
              <p className="stat-num">
                {state.approved}
                <span className="stat-den">/{state.asked}</span>
              </p>
              <p className="stat-label">
                Orders
                <br />
                approved by you
              </p>
            </div>
          </section>
        ) : (
          <div className="void" />
        )}
        {state.booted && state.tab === "shop" ? (
          <section className="stage">
            <PhoneStage
              state={state}
              onApprove={demo.approve}
              onDecline={demo.decline}
              onBuy={demo.buy}
              onAskAgain={demo.askAgain}
              onWeek={demo.showDigest}
              onAskText={(text) => {
                setMarketSeed(text);
                demo.submit(text);
              }}
              onAskLink={demo.submitLink}
              onAskPhoto={demo.submitPhoto}
              onInput={demo.setInput}
              onReplay={demo.replay}
            />
            <Board state={state} />
          </section>
        ) : null}
        {state.tab === "shop" ? <Market seed={marketSeed} /> : null}
        {state.tab === "vault" ? <Vault state={state} /> : null}
        {state.tab === "orders" ? <Orders state={state} /> : null}
      </main>
    </div>
  );
}
