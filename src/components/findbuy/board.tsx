import { type State } from "./model";

export function Board({ state }: { state: State }) {
  return (
    <div className="jobs-col">
      <div className="jobs-head">
        <p className="kicker">// {state.jobs.length} shopping jobs</p>
        <span className="live">
          <i className="dot dot-live pulse" aria-hidden /> Live
        </span>
      </div>
      <ul className="jobs">
        {state.jobs.map((job) => (
          <li key={job.key} className={job.hot ? "job is-hot" : "job"}>
            <span className="letter">{job.letter}</span>
            <div className="job-copy">
              <p className="job-name">{job.name}</p>
              <p className="job-brief">"{job.brief}"</p>
            </div>
            <span className={`badge tone-${job.badge.tone}`}>{job.badge.label}</span>
          </li>
        ))}
      </ul>
      <section className="rule">
        <p className="kicker">Rule 1 · set once</p>
        <p className="rule-line">Never buy anything without asking me.</p>
        <p className="rule-count">
          <b>{state.approved}</b>
          <span>
            of {state.asked} orders approved by you
          </span>
        </p>
      </section>
    </div>
  );
}
