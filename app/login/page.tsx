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
    // Full page load on purpose so the nav bar picks up the new session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is intentional
    window.location.assign("/");
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-3 bg-white p-6 rounded-2xl shadow">
        <input className="w-full border rounded p-2" type="email" required autoComplete="email"
          placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" required autoComplete="current-password"
          placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={busy} className="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
