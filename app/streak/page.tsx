"use client";
import { useMyStreak } from "@/hooks/useMyStreak";
import LevelProgress from "@/components/LevelProgress";
import { effectiveStreak, loggedToday } from "@/lib/streak";

export default function Streak() {
  const { profile, logs, loading, error } = useMyStreak();
  if (loading) return <main className="page-container loading-state">Loading your streak…</main>;
  if (!profile) {
    return (
      <main className="page-container narrow">
        <div className="status-banner error" role="alert">
          {error ? `Could not load your streak: ${error}` : "Not signed in."}
        </div>
      </main>
    );
  }

  const streak = effectiveStreak(profile);
  const done = loggedToday(profile);

  return (
    <main className="page-container narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">One day at a time</p>
          <h1 className="page-title">Your streak <span aria-hidden="true">🔥</span></h1>
          <p className="page-subtitle">Nice to see you, {profile.name}. Every check-in is progress.</p>
        </div>
      </div>

      <div className={`status-banner ${done ? "success" : "warning"}`} role="status">
        <span aria-hidden="true">{done ? "✓" : "◷"}</span>
        <span>{done
          ? "You're checked in for today. Great job keeping the momentum going!"
          : streak > 0
            ? "Your streak is waiting. Check in today to keep it alive."
            : "Your streak starts with one check-in. You've got this!"}</span>
      </div>

      <section className="stat-grid section-space" aria-label="Your streak statistics">
        <article className="stat-card">
          <div className="stat-label">Current streak</div>
          <div className="stat-value">{streak}<span style={{ fontSize: 15, letterSpacing: 0 }}> days</span></div>
          <div className="stat-note">Keep the chain going.</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Personal best</div>
          <div className="stat-value">{profile.longest_streak}<span style={{ fontSize: 15, letterSpacing: 0 }}> days</span></div>
          <div className="stat-note">Your longest streak so far.</div>
        </article>
      </section>

      <div className="section-space"><LevelProgress streak={streak} /></div>

      <section className="panel section-space" aria-labelledby="logs-heading">
        <div className="panel-padding" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 id="logs-heading" className="panel-title">Recent check-ins</h2>
            <p className="panel-description">A little consistency adds up.</p>
          </div>
          <span className="badge badge-neutral">{logs.length} total shown</span>
        </div>
        <hr className="divider" />
        {logs.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {logs.map(l => (
              <li key={l.id} className="list-row" style={{ margin: "10px 12px", borderColor: "transparent", background: "var(--surface-soft)" }}>
                <div className="row-main">
                  <span className="avatar" aria-hidden="true">✓</span>
                  <div>
                    <div className="row-name">{l.log_date}</div>
                    <div className="row-meta">Check-in recorded</div>
                  </div>
                </div>
                <time className="row-value muted" dateTime={l.logged_at}>{new Date(l.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
              </li>
            ))}
          </ul>
        ) : <div className="empty-state">No check-ins yet. Your first one will show up here.</div>}
      </section>
    </main>
  );
}
