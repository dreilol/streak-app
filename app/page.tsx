"use client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { levelFor } from "@/lib/levels";

export default function Home() {
  const { rows, loading, error } = useLeaderboard();
  if (loading) return <main className="page-container loading-state">Loading the leaderboard…</main>;

  const totalStudents = rows.length;
  const topStreak = rows.reduce((best, row) => Math.max(best, row.streak), 0);

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Consistency counts</p>
          <h1 className="page-title">Leaderboard <span aria-hidden="true">🏆</span></h1>
          <p className="page-subtitle">Every check-in counts. See who's building the strongest streaks.</p>
        </div>
        <span className="badge badge-neutral">Updated live</span>
      </div>

      {error && <div className="status-banner error" role="alert">Could not load the leaderboard: {error}</div>}

      <section className="stat-grid" aria-label="Leaderboard summary">
        <article className="stat-card">
          <div className="stat-label">Students on the board</div>
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-note">Keep showing up, day by day.</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Top current streak</div>
          <div className="stat-value">{topStreak}<span style={{ fontSize: 16, letterSpacing: 0 }}> days</span></div>
          <div className="stat-note">The longest active run right now.</div>
        </article>
      </section>

      <section className="section-space" aria-labelledby="ranking-title">
        <div className="page-heading" style={{ alignItems: "end", marginBottom: 14 }}>
          <div>
            <h2 id="ranking-title" className="panel-title">Top streaks</h2>
            <p className="panel-description">Ranked by current streak.</p>
          </div>
          <span className="muted small">{totalStudents} {totalStudents === 1 ? "student" : "students"}</span>
        </div>
        <ol className="list-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r, i) => {
            const lvl = levelFor(r.streak);
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <li key={r.id} className="list-row">
                <div className="row-main">
                  <span className={`rank${i < 3 ? " top" : ""}`} aria-label={`Rank ${i + 1}`}>{medal ?? i + 1}</span>
                  <div className="avatar" aria-hidden="true">{r.name.trim().charAt(0).toUpperCase() || "?"}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="row-name">{r.name}</div>
                    <div className="row-meta">{lvl.icon} {lvl.name}</div>
                  </div>
                </div>
                <div className="row-value">
                  <div>{r.streak} {r.streak === 1 ? "day" : "days"} 🔥</div>
                  <div className="row-meta">Best: {r.longest_streak}d</div>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && !error && (
            <li className="panel empty-state">No students yet. Once students check in, their progress will appear here.</li>
          )}
        </ol>
      </section>
    </main>
  );
}
