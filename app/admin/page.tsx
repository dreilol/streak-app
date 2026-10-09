"use client";
import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";

type Msg = { text: string; error?: boolean };

export default function Admin() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Profile[]>([]);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setLoading(false); return; }
      const { data: mine } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!active) return;
      setMe(mine as Profile | null);
      if (mine?.role === "admin") {
        const { data } = await supabase.from("profiles").select("*").order("name");
        if (!active) return;
        setRows((data as Profile[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [version]);

  async function linkTag(p: Profile, raw: string) {
    const tag = raw.trim();
    if (tag === (p.rfid_tag ?? "")) return; // nothing changed
    const { error } = await supabase
      .from("profiles").update({ rfid_tag: tag || null }).eq("id", p.id);
    if (error) {
      setMsg({
        text: error.code === "23505" ? "That tag is already linked to another student." : error.message,
        error: true,
      });
    } else {
      setMsg({ text: tag ? `Linked tag to ${p.name}` : `Unlinked tag from ${p.name}` });
    }
    reload();
  }

  async function simulate(p: Profile) {
    if (!p.rfid_tag) return setMsg({ text: "No tag linked.", error: true });
    const { data, error } = await supabase.functions.invoke("simulate-tap", {
      body: { rfid_tag: p.rfid_tag },
    });
    if (error) {
      let text = error.message;
      if (error instanceof FunctionsHttpError) {
        try { text = (await error.context.json()).error ?? text; } catch { /* keep generic */ }
      }
      setMsg({ text, error: true });
    } else {
      setMsg({
        text: data?.already_logged
          ? `${p.name} already tapped in today (streak ${data.streak}).`
          : `Simulated tap for ${p.name} (streak ${data?.streak ?? "?"}).`,
      });
    }
    reload();
  }

  if (loading) return <main className="p-6 text-center">Loading…</main>;
  if (me?.role !== "admin") return <main className="p-6 text-center">Admins only.</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">⚙️ Admin</h1>
      <p className="text-sm text-gray-500">
        Create students in Supabase → Authentication → Users. They appear here automatically.
      </p>
      {msg && <p className={`text-sm ${msg.error ? "text-red-600" : "text-blue-700"}`}>{msg.text}</p>}
      <div className="bg-white rounded-2xl shadow divide-y">
        {rows.map(r => (
          <div key={r.id} className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{r.name} <span className="text-xs text-gray-400">({r.role})</span></div>
              <input
                key={`${r.id}:${r.rfid_tag ?? ""}`}
                className="border rounded p-1 text-sm mt-1" placeholder="RFID tag"
                defaultValue={r.rfid_tag ?? ""}
                onBlur={e => linkTag(r, e.target.value)} />
            </div>
            <button onClick={() => simulate(r)}
              className="bg-green-600 text-white rounded px-3 py-1 text-sm">Simulate tap</button>
          </div>
        ))}
      </div>
    </main>
  );
}
