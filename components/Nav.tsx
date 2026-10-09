"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";

export default function Nav() {
  const [me, setMe] = useState<Profile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        // Stale or expired session: send the person back to sign in.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is intentional
        if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (active) setMe(data as Profile | null);
    })();
    return () => { active = false; };
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is intentional
    window.location.assign("/login");
  }

  return (
    <nav className="flex gap-4 items-center justify-between p-4 bg-white shadow mb-6">
      <div className="flex gap-4">
        <Link href="/" className="font-bold">🏆 Leaderboard</Link>
        <Link href="/streak">🔥 My Streak</Link>
        <Link href="/students">🔍 Students</Link>
        {me?.role === "admin" && <Link href="/admin">⚙️ Admin</Link>}
      </div>
      {me && (
        <button onClick={signOut} className="text-sm text-blue-600 underline">
          Sign out ({me.name})
        </button>
      )}
    </nav>
  );
}
