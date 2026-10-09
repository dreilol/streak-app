"use client";
import { levelFor, nextLevel } from "@/lib/levels";

export default function LevelProgress({ streak }: { streak: number }) {
  const cur = levelFor(streak);
  const next = nextLevel(streak);
  const span = next ? next.min - cur.min : 1;
  const pct = next ? Math.max(0, Math.min(100, ((streak - cur.min) / span) * 100)) : 100;

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{cur.icon} {cur.name}</span>
        {next && <span className="text-sm text-gray-500">Next: {next.icon} {next.name} at {next.min}d</span>}
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
