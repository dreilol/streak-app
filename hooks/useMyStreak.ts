"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Profile, LogRow } from "@/lib/types";

export function useMyStreak() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setLoading(false); return; }
      const [{ data: p, error: pe }, { data: l, error: le }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("logs").select("*").eq("profile_id", user.id)
          .order("logged_at", { ascending: false }).limit(30),
      ]);
      if (!active) return;
      setError(pe?.message ?? le?.message ?? null);
      setProfile(p as Profile | null);
      setLogs((l as LogRow[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { profile, logs, loading, error };
}
