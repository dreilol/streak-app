"use client";
import { useMyStreak } from "@/hooks/useMyStreak";
import LevelProgress from "@/components/LevelProgress";
import { effectiveStreak, loggedToday } from "@/lib/streak";

export default function Streak() {
  const { profile, logs, loading, error } = useMyStreak();
  if (loading) return <main className="p-6 text-center">Loading…</main>;
  if (!profile) {
    return (
      <main className="p-6 text-center">
        {error ? `Could not load your streak: ${error}` : "Not signed in."}
      </main>
    );
  }

  const streak = effectiveStreak(profile);
  const done = loggedToday(profile);

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">🔥 {profile.name}&apos;s Streak</h1>
      <div className={`rounded-2xl p-3 text-center text-sm font-medium ${done ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
        {done
          ? "✅ You tapped in today"
          : streak > 0
            ? "⏳ Tap in today to keep your streak alive!"
            : "Tap in today to start a streak!"}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow text-center">
          <div className="text-4xl font-bold">{streak}</div>
          <div className="text-gray-500 text-sm">Current streak</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow text-center">
          <div className="text-4xl font-bold">{profile.longest_streak}</div>
          <div className="text-gray-500 text-sm">Longest</div>
        </div>
      </div>
      <LevelProgress streak={streak} />
      <div className="bg-white rounded-2xl p-4 shadow">
        <h2 className="font-semibold mb-2">Recent logs</h2>
        <ul className="text-sm space-y-1">
          {logs.map(l => (
            <li key={l.id} className="flex justify-between">
              <span>{l.log_date}</span>
              <span className="text-gray-400">{new Date(l.logged_at).toLocaleTimeString()}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="text-gray-400">No logs yet — go tap in!</li>}
        </ul>
      </div>
    </main>
  );
}
