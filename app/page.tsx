"use client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { levelFor } from "@/lib/levels";

export default function Home() {
  const { rows, loading, error } = useLeaderboard();
  if (loading) return <main className="p-6 text-center">Loading…</main>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
      {error && <p className="text-red-600 text-sm mb-4">Could not load: {error}</p>}
      <ol className="space-y-2">
        {rows.map((r, i) => {
          const lvl = levelFor(r.streak);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return (
            <li key={r.id} className="flex justify-between items-center rounded-2xl bg-white p-4 shadow">
              <span className="font-medium">{medal} {r.name}</span>
              <span>{lvl.icon} {r.streak}d <span className="text-gray-400 text-sm">(best {r.longest_streak})</span></span>
            </li>
          );
        })}
        {rows.length === 0 && !error && <li className="text-center text-gray-400">No students yet.</li>}
      </ol>
    </main>
  );
}
