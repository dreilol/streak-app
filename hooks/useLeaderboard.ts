"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { effectiveStreak } from "@/lib/streak";
import type { Profile } from "@/lib/types";

export type LeaderboardRow = Profile & { streak: number };

export function useLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,role,rfid_tag,current_streak,longest_streak,last_log_date")
        .eq("role", "student");
      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        const ranked = ((data as Profile[]) ?? [])
          .map(p => ({ ...p, streak: effectiveStreak(p) }))
          .sort(
            (a, b) =>
              b.streak - a.streak ||
              b.longest_streak - a.longest_streak ||
              a.name.localeCompare(b.name)
          );
        setRows(ranked);
        setError(null);
      }
      setLoading(false);
    }

    // Initial load happens when the realtime channel reports its status,
    // and again on every change to the profiles table.
    const ch = supabase
      .channel("lb")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe(status => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") load();
      });

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { rows, loading, error };
}
