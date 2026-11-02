import { type State, money } from "./model";
import { Timeline } from "./phone";

export function Vault({ state }: { state: State }) {
  const waiting = state.phone.view === "ask" ? state.phone.pending : null;
  return (
    <section className="panel vault-grid" aria-label="Vault">
      <div className="vault-card">
        <div className="vault-top">
          <span>Agent vault</span>
          <span className="emv" aria-hidden />
        </div>
        <p className="vault-num">···· ···· ···· 2210</p>
        <div className="vault-foot">
          <span>Not connected</span>
          <span>ask first</span>
        </div>
      </div>
      <div>
        <p className="kicker">Available</p>
        <p className="balance">{money(state.balance)}</p>
        <p className="quiet">Nothing captures unless you approve it on this screen.</p>
        {waiting ? (
          <p className="hold">
            <span>Waiting on you</span>
            <span>
              {waiting.store} · {waiting.title}
            </span>
            <b>{money(waiting.price)}</b>
          </p>
        ) : null}
        <ul className="ledger">
          {state.orders.length === 0 ? (
            <li className="empty">No captures. The card is connected. It does not spend alone.</li>
          ) : (
            state.orders.map((order) => (
              <li key={order.id}>
                <span>
                  <strong>{order.store}</strong>
                  <em>{order.title}</em>
                </span>
                <b className={order.mode === "paid" ? "val-mint" : "val-wait"}>
                  {order.mode === "paid" ? `−${money(order.price)}` : "scheduled"}
                </b>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

export function Orders({ state }: { state: State }) {
  return (
    <section className="panel" aria-label="Orders">
      {state.orders.length === 0 ? (
        <div className="empty-block">
          <p className="kicker">Orders</p>
          <h2 className="digest-title">Nothing bought.</h2>
          <p className="quiet">The agent can find a price. It cannot spend until you approve.</p>
        </div>
      ) : (
        <ul className="order-list">
          {state.orders.map((order) => (
            <li key={order.id} className="order-card">
              <p className="kicker">
                Order #{order.num} · {order.store}
              </p>
              <h2 className="digest-title">
                {order.title}, {money(order.price)}
              </h2>
              <p className="quiet">{order.note}</p>
              {order.mode === "scheduled" ? (
                <p className="ship-row">
                  <span>Next</span>
                  <span>{order.when}</span>
                </p>
              ) : null}
              {order.carrier ? (
                <p className="ship-row">
                  <span>{order.carrier}</span>
                  <span className="mono">{order.tracking}</span>
                </p>
              ) : null}
              {order.steps.length > 0 ? <Timeline steps={order.steps} step={order.step} /> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
