"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setBusy(false); return setErr(error.message); }
    window.location.assign("/");
  }

  return (
    <main className="login-wrap">
      <div className="login-brand">
        <span className="brand-mark" style={{ width: 52, height: 52, borderRadius: 17, fontSize: 22 }}>✦</span>
        <h1 className="page-title" style={{ fontSize: 30, marginTop: 18 }}>Welcome back</h1>
        <p className="page-subtitle">Sign in and keep your momentum going.</p>
      </div>
      <form onSubmit={submit} className="panel login-card">
        <div className="field-group">
          <label className="field-label" htmlFor="email">Email address</label>
          <input id="email" className="field" type="email" required autoComplete="email"
            placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" className="field" type="password" required autoComplete="current-password"
            placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {err && <div className="status-banner error" role="alert" style={{ marginBottom: 16 }}>{err}</div>}
        <button type="submit" disabled={busy} className="button button-primary button-full" style={{ minHeight: 46 }}>
          {busy ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
        </button>
        <p className="footer-note">Small steps. Stronger streaks.</p>
      </form>
    </main>
  );
}
