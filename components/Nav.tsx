"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";

type Theme = "light" | "dark";

export default function Nav() {
  const [me, setMe] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const pathname = usePathname();

  useEffect(() => {
    const saved = window.localStorage.getItem("streak-app-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial: Theme = saved === "dark" || saved === "light" ? saved : preferred;
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("streak-app-theme", next);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        if (!window.location.pathname.startsWith("/login")) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- preserve full-page auth redirect
          window.location.assign("/login");
        }
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (active) setMe(data as Profile | null);
    })();
    return () => { active = false; };
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears authenticated UI
    window.location.assign("/login");
  }

  const links = [
    { href: "/", label: "Leaderboard", icon: "🏆" },
    { href: "/streak", label: "My Streak", icon: "🔥" },
    { href: "/students", label: "Students", icon: "👥" },
    ...(me?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <header className="app-nav">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="Streak App home">
          <span className="brand-mark">✦</span>
          <span className="brand-label">streak<span style={{ color: "var(--accent)" }}>.</span></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`nav-link${pathname === link.href ? " active" : ""}`}
              aria-current={pathname === link.href ? "page" : undefined}>
              <span aria-hidden="true">{link.icon}</span><span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" className="icon-button" onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
          {me && <span className="user-chip" title={me.name}>Hi, {me.name}</span>}
          {me && <button type="button" onClick={signOut} className="nav-signout">Sign out</button>}
        </div>
      </div>
    </header>
  );
}
