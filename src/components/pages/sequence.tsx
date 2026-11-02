import { useState } from "react";
import { Button } from "@/components/ui/kit";

export type SeqStep = { from: string; to: string; label: string };

export function Sequence({ steps, title }: { steps: SeqStep[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const actors = [...new Set(steps.flatMap((step) => [step.from, step.to]))];
  const width = 640;
  const height = 56 + steps.length * 42;
  return (
    <figure className="seq">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {actors.map((actor, index) => {
          const x = 80 + index * ((width - 120) / Math.max(actors.length - 1, 1));
          return (
            <g key={actor}>
              <text x={x} y={20} textAnchor="middle" fill="currentColor" fontSize="13">
                {actor}
              </text>
              <line x1={x} y1={28} x2={x} y2={height - 8} stroke="currentColor" strokeOpacity="0.25" />
            </g>
          );
        })}
        {steps.map((step, index) => {
          const x1 = 80 + actors.indexOf(step.from) * ((width - 120) / Math.max(actors.length - 1, 1));
          const x2 = 80 + actors.indexOf(step.to) * ((width - 120) / Math.max(actors.length - 1, 1));
          const y = 52 + index * 42;
          const on = index <= current;
          return (
            <g key={step.label} className={index === current ? "seq-step is-on" : on ? "seq-step is-done" : "seq-step"}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="currentColor" strokeWidth={index === current ? 2.5 : 1.5} markerEnd="url(#arrow)" />
              <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" fill="currentColor" fontSize="12">
                {index + 1}. {step.label}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="currentColor" />
          </marker>
        </defs>
      </svg>
      <figcaption>
        <p role="status">{steps[current]?.label}</p>
        <Button type="button" variant="secondary" onClick={() => setCurrent((value) => (value + 1) % steps.length)}>
          Next step
        </Button>
      </figcaption>
    </figure>
  );
}
