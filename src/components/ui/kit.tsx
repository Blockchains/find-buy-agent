import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export function Button({
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={`ui-btn ${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Chip({ children, href }: { children: ReactNode; href?: string }) {
  if (href) return <a className="ui-chip" href={href}>{children}</a>;
  return <span className="ui-chip">{children}</span>;
}

export function Badge({ status, children }: { status: "go" | "ask" | "stop" | "info"; children: ReactNode }) {
  const icon = status === "go" ? "✓" : status === "ask" ? "!" : status === "stop" ? "✕" : "i";
  return (
    <span className={`ui-badge ${status === "info" ? "" : status}`}>
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`ui-card ${className}`}>{children}</article>;
}

export function Callout({ tone = "note", children }: { tone?: "note" | "warn"; children: ReactNode }) {
  return <p className={`ui-callout ${tone === "warn" ? "warn" : ""}`}>{children}</p>;
}

export function Stepper({ steps, current, onStep }: { steps: string[]; current: number; onStep: (index: number) => void }) {
  return (
    <div className="stepper" role="tablist" aria-label="Steps">
      {steps.map((step, index) => (
        <button key={step} type="button" role="tab" aria-selected={index === current} aria-current={index === current ? "step" : undefined} tabIndex={index === current ? 0 : -1} onClick={() => onStep(index)} onKeyDown={(event) => {
          if (event.key === "ArrowRight") onStep(Math.min(steps.length - 1, index + 1));
          if (event.key === "ArrowLeft") onStep(Math.max(0, index - 1));
        }}>
          {index + 1}. {step}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ui-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function CodeBlock({ text }: { text: string }) {
  return (
    <div className="codeblock">
      <button type="button" className="ui-btn ghost" onClick={() => void navigator.clipboard.writeText(text)}>
        Copy
      </button>
      <pre>{text}</pre>
    </div>
  );
}

export function HashPill({ value, href }: { value: string; href?: string }) {
  const short = value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
  return (
    <span className="hash">
      <code>{short}</code>
      <button type="button" className="ui-btn ghost" onClick={() => void navigator.clipboard.writeText(value)}>
        Copy
      </button>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          Explorer
        </a>
      ) : null}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ui-card empty">
      <svg className="empty-art" viewBox="0 0 96 72" aria-hidden="true">
        <rect x="18" y="8" width="60" height="56" rx="8" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M30 24h36M30 36h24" stroke="var(--brand)" strokeWidth="1.75" />
      </svg>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    const previously = document.activeElement as HTMLElement | null;
    const focusable = node?.querySelectorAll<HTMLElement>("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !focusable?.length) return;
      const list = [...focusable];
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [onClose]);
  return (
    <div className="sheet-back" onMouseDown={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ pressed, label, onToggle }: { pressed: boolean; label: string; onToggle: (next: boolean) => void }) {
  return (
    <button type="button" className={`ui-toggle${pressed ? " is-on" : ""}`} aria-pressed={pressed} onClick={() => onToggle(!pressed)}>
      <span>{label}</span>
      <i aria-hidden />
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const id = useId();
  return (
    <div className="pair">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <input
        type="number"
        aria-label={`${label} amount`}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function Tabs({
  tabs,
  current,
  onChange,
}: {
  tabs: string[];
  current: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="stepper" role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={index === current}
          tabIndex={index === current ? 0 : -1}
          onClick={() => onChange(index)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") onChange(Math.min(tabs.length - 1, index + 1));
            if (event.key === "ArrowLeft") onChange(Math.max(0, index - 1));
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <p className="toast" role="status" aria-live="polite">
      {children}
    </p>
  );
}
