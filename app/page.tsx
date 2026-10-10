"use client";
import { useEffect, useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { levelFor } from "@/lib/levels";
import { supabase } from "@/lib/supabase-browser";
import { isPaused, type Pause, type SectionInfo } from "@/lib/pauses";

export default function Home() {
  const { rows, loading, error } = useLeaderboard();
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [pauses, setPauses] = useState<Pause[]>([]);
  const [activeSection, setActiveSection] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        supabase.from("sections").select("id,name,batch_id").order("name"),
        supabase.from("pauses").select("*").is("ended_at", null),
      ]);
      setSections((s.data as SectionInfo[]) ?? []);
      setPauses((p.data as Pause[]) ?? []);
    })();

    const ch = supabase
      .channel("pauses-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pauses" }, async () => {
        const { data } = await supabase.from("pauses").select("*").is("ended_at", null);
        setPauses((data as Pause[]) ?? []);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  if (loading) return <main className="page-container loading-state">Loading leaderboard…</main>;

  const sectionFiltered = activeSection === "all"
    ? rows
    : rows.filter(r => r.section_id === activeSection);

  // Split into active and paused
  const active = sectionFiltered.filter(r => !isPaused(r, pauses, sections));
  const paused = sectionFiltered.filter(r => isPaused(r, pauses, sections));

  const activeSectionName = sections.find(s => s.id === activeSection)?.name;

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Streak champions</p>
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">Keep the momentum going — every tap counts.</p>
        </div>
        <span className="badge badge-neutral">{active.length} students</span>
      </div>

      {error && (
        <div className="status-banner error" role="alert" style={{ marginBottom: 18 }}>
          Could not load: {error}
        </div>
      )}

      {sections.length > 0 && (
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 20 }}>
          <FilterButton active={activeSection === "all"} onClick={() => setActiveSection("all")}>
            Global
          </FilterButton>
          {sections.map(s => (
            <FilterButton key={s.id} active={activeSection === s.id} onClick={() => setActiveSection(s.id)}>
              {s.name}
            </FilterButton>
          ))}
        </div>
      )}

      <section className="panel">
        <div className="panel-padding" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="panel-title">{activeSection === "all" ? "Everyone" : activeSectionName}</h2>
            <p className="panel-description">
              {activeSection === "all"
                ? "Ranked by current streak across all sections."
                : `Ranked by current streak in ${activeSectionName}.`}
            </p>
          </div>
        </div>
        <hr className="divider" />
        {active.map((r, i) => {
          const lvl = levelFor(r.streak);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          const displayName = r.display_name || r.name;
          const sectionName = sections.find(s => s.id === r.section_id)?.name;
          return (
            <div key={r.id} className="list-row" style={{ margin: 12, alignItems: "center" }}>
              <div className="row-main" style={{ flex: 1 }}>
                <div className={`rank ${i < 3 ? "top" : ""}`} aria-hidden="true">{medal}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row-name">
                    {displayName}
                    {sectionName && (
                      <span className="muted small" style={{ fontWeight: 500 }}> · {sectionName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="row-value">
                {lvl.icon} {r.streak}d
                <span className="muted small" style={{ fontWeight: 500 }}> (best {r.longest_streak})</span>
              </div>
            </div>
          );
        })}
        {active.length === 0 && !error && (
          <div className="empty-state">
            {activeSection === "all" ? "No active students yet." : "No active students in this section yet."}
          </div>
        )}
        {paused.length > 0 && (
          <div style={{ padding: "12px 22px 18px", borderTop: "1px solid var(--line)" }}>
            <span className="muted small">
              🌴 {paused.length} {paused.length === 1 ? "student" : "students"} paused
              {" — their streaks are frozen until the pause ends."}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "button button-primary" : "button"}
    >
      {children}
    </button>
  );
}