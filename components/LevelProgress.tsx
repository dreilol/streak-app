"use client";
import { levelFor, nextLevel } from "@/lib/levels";

export default function LevelProgress({ streak }: { streak: number }) {
  const cur = levelFor(streak);
  const next = nextLevel(streak);
  const span = next ? next.min - cur.min : 1;
  const pct = next ? Math.max(0, Math.min(100, ((streak - cur.min) / span) * 100)) : 100;
  const remaining = next ? Math.max(0, next.min - streak) : 0;

  return (
    <section className="panel panel-padding">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="eyebrow">Your current level</p>
          <h2 className="panel-title" style={{ fontSize: 20 }}>{cur.icon} {cur.name}</h2>
        </div>
        <span className="badge badge-neutral">{streak} {streak === 1 ? "day" : "days"}</span>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Progress to next level"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
        <span className="muted small">{next ? `${remaining} more ${remaining === 1 ? "day" : "days"} to go` : "You've reached the highest level!"}</span>
        {next && <span className="small" style={{ color: "var(--accent)", fontWeight: 700, textAlign: "right" }}>Next: {next.icon} {next.name}</span>}
      </div>
    </section>
  );
}
