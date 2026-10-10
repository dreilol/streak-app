"use client";
import { useEffect, useState } from "react";
import { useMyStreak } from "@/hooks/useMyStreak";
import LevelProgress from "@/components/LevelProgress";
import { effectiveStreak, loggedToday } from "@/lib/streak";
import { supabase } from "@/lib/supabase-browser";
import { isPaused, type Pause, type SectionInfo } from "@/lib/pauses";

export default function Streak() {
  const { profile, logs, loading, error } = useMyStreak();
  const [pauses, setPauses] = useState<Pause[]>([]);
  const [sections, setSections] = useState<SectionInfo[]>([]);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        supabase.from("pauses").select("*").is("ended_at", null),
        supabase.from("sections").select("id,name,batch_id"),
      ]);
      setPauses((p.data as Pause[]) ?? []);
      setSections((s.data as SectionInfo[]) ?? []);
    })();

    const ch = supabase
      .channel("streak-pauses")
      .on("postgres_changes", { event: "*", schema: "public", table: "pauses" }, async () => {
        const { data } = await supabase.from("pauses").select("*").is("ended_at", null);
        setPauses((data as Pause[]) ?? []);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

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
  const activePause = isPaused(profile, pauses, sections);

  return (
    <main className="page-container narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">One day at a time</p>
          <h1 className="page-title">Your streak <span aria-hidden="true">🔥</span></h1>
          <p className="page-subtitle">Nice to see you, {profile.name}. Every check-in is progress.</p>
        </div>
      </div>

      {activePause && (
        <div
          className="status-banner"
          role="status"
          style={{
            marginBottom: 18,
            background: "var(--warning-soft)",
            color: "var(--warning)",
            borderColor: "color-mix(in srgb, var(--warning) 20%, var(--line))",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 20 }}>🌴</span>
          <div>
            <div style={{ fontWeight: 750 }}>You&apos;re currently paused</div>
            <div className="small" style={{ marginTop: 4, fontWeight: 500 }}>
              {activePause.reason ? `Reason: ${activePause.reason}` : "No reason provided."}
              {" "}Started {new Date(activePause.started_at).toLocaleDateString()}.
              Your streak is safe — it won&apos;t break while paused.
            </div>
          </div>
        </div>
      )}

      {!activePause && (
        <div className={`status-banner ${done ? "success" : "warning"}`} role="status">
          <span aria-hidden="true">{done ? "✓" : "◷"}</span>
          <span>
            {done
              ? "You're checked in for today. Great job keeping the momentum going!"
              : streak > 0
                ? "Your streak is waiting. Check in today to keep it alive."
                : "Your streak starts with one check-in. You've got this!"}
          </span>
        </div>
      )}

      <section className="stat-grid section-space" aria-label="Your streak statistics">
        <article className="stat-card">
          <div className="stat-label">Current streak</div>
         <div className="stat-value">
  {streak}
  <span style={{ fontSize: 15, letterSpacing: 0 }}> {streak === 1 ? "day" : "days"}</span>
</div>
          <div className="stat-note">
            {activePause ? "Frozen while paused." : "Keep the chain going."}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Personal best</div>
         <div className="stat-value">
  {profile.longest_streak}
  <span style={{ fontSize: 15, letterSpacing: 0 }}> {profile.longest_streak === 1 ? "day" : "days"}</span>
</div>
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
                <time className="row-value muted" dateTime={l.logged_at}>
                  {new Date(l.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No check-ins yet. Your first one will show up here.</div>
        )}
      </section>
    </main>
  );
}