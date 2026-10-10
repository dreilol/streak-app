"use client";
import { useEffect, useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { levelFor } from "@/lib/levels";
import { supabase } from "@/lib/supabase-browser";

type Section = { id: string; name: string; batch_id: string | null };

export default function Home() {
  const { rows, loading, error } = useLeaderboard();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sections")
        .select("id,name,batch_id")
        .order("name");
      setSections((data as Section[]) ?? []);
    })();
  }, []);

  if (loading) return <main className="page-container loading-state">Loading leaderboard…</main>;

  const filtered = activeSection === "all"
    ? rows
    : rows.filter(r => r.section_id === activeSection);

  const activeSectionName = sections.find(s => s.id === activeSection)?.name;

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Streak champions</p>
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">Keep the momentum going — every tap counts.</p>
        </div>
        <span className="badge badge-neutral">{filtered.length} students</span>
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
        {filtered.map((r, i) => {
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
        {filtered.length === 0 && !error && (
          <div className="empty-state">
            {activeSection === "all" ? "No students yet." : "No students in this section yet."}
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