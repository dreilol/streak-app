"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { levelFor } from "@/lib/levels";
import { effectiveStreak } from "@/lib/streak";
import type { Profile } from "@/lib/types";

export default function Students() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const term = q.replace(/[,()*%_\\]/g, " ").trim();
      let query = supabase
        .from("profiles")
        .select("id,name,role,rfid_tag,current_streak,longest_streak,last_log_date")
        .eq("role", "student")
        .order("name");
      if (term) query = query.or(`name.ilike.%${term}%,rfid_tag.ilike.%${term}%`);
      const { data, error } = await query.limit(20);
      if (!active) return;
      setError(error?.message ?? null);
      setRows((data as Profile[]) ?? []);
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [q]);

  return (
    <main className="page-container narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">The community</p>
          <h1 className="page-title">Students <span aria-hidden="true">👥</span></h1>
          <p className="page-subtitle">Find a student and see the streak they're building.</p>
        </div>
        <span className="badge badge-neutral">{rows.length} shown</span>
      </div>

      <section className="panel panel-padding" style={{ marginBottom: 18 }}>
        <label htmlFor="student-search" className="field-label">Search students</label>
        <input id="student-search" className="field" placeholder="Search by name or RFID tag…" value={q}
          onChange={e => setQ(e.target.value)} />
        <p className="panel-description">Search updates as you type.</p>
      </section>

      {error && <div className="status-banner error" role="alert" style={{ marginBottom: 16 }}>Could not search: {error}</div>}
      <ul className="list-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map(r => {
          const streak = effectiveStreak(r);
          const lvl = levelFor(streak);
          return (
            <li key={r.id} className="list-row">
              <div className="row-main">
                <span className="avatar" aria-hidden="true">{r.name.trim().charAt(0).toUpperCase() || "?"}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="row-name">{r.name}</div>
                  <div className="row-meta">RFID · {r.rfid_tag ?? "No tag linked"} · {lvl.icon} {lvl.name}</div>
                </div>
              </div>
              <div className="row-value">
                <div>{streak} {streak === 1 ? "day" : "days"} 🔥</div>
                <div className="row-meta">Best: {r.longest_streak}d</div>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && !error && (
          <li className="panel empty-state">{q ? "No students match that search. Try another name or tag." : "No students found yet."}</li>
        )}
      </ul>
    </main>
  );
}
