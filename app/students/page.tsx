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
    // Debounce typing, and ignore responses that arrive out of order.
    const timer = setTimeout(async () => {
      // Strip characters that have special meaning in a PostgREST filter
      // (commas, parentheses) and in LIKE patterns (%, _, *).
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
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">🔍 Students</h1>
      <input className="w-full border rounded p-2" placeholder="Search name or RFID tag"
        value={q} onChange={e => setQ(e.target.value)} />
      {error && <p className="text-red-600 text-sm">Could not search: {error}</p>}
      <ul className="space-y-2">
        {rows.map(r => {
          const streak = effectiveStreak(r);
          const lvl = levelFor(streak);
          return (
            <li key={r.id} className="bg-white p-4 rounded-2xl shadow flex justify-between">
              <span>{r.name} <span className="text-gray-400 text-sm">#{r.rfid_tag ?? "no tag"}</span></span>
              <span>{lvl.icon} {streak}d</span>
            </li>
          );
        })}
        {rows.length === 0 && !error && <li className="text-center text-gray-400">No students found.</li>}
      </ul>
    </main>
  );
}
