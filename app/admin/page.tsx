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
    if (tag === (p.rfid_tag ?? "")) return;
    const { error } = await supabase.from("profiles").update({ rfid_tag: tag || null }).eq("id", p.id);
    if (error) {
      setMsg({ text: error.code === "23505" ? "That tag is already linked to another student." : error.message, error: true });
    } else {
      setMsg({ text: tag ? `Linked tag to ${p.name}` : `Unlinked tag from ${p.name}` });
    }
    reload();
  }

  async function simulate(p: Profile) {
    if (!p.rfid_tag) return setMsg({ text: "No tag linked.", error: true });
    const { data, error } = await supabase.functions.invoke("simulate-tap", { body: { rfid_tag: p.rfid_tag } });
    if (error) {
      let text = error.message;
      if (error instanceof FunctionsHttpError) {
        try { text = (await error.context.json()).error ?? text; } catch { /* keep generic */ }
      }
      setMsg({ text, error: true });
    } else {
      setMsg({ text: data?.already_logged
        ? `${p.name} already tapped in today (streak ${data.streak}).`
        : `Simulated tap for ${p.name} (streak ${data?.streak ?? "?"}).` });
    }
    reload();
  }

  if (loading) return <main className="page-container loading-state">Loading admin tools…</main>;
  if (me?.role !== "admin") return (
    <main className="page-container narrow">
      <div className="status-banner error" role="alert">Admins only. This account doesn't have administrator access.</div>
    </main>
  );

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Manage the experience</p>
          <h1 className="page-title">Admin tools <span aria-hidden="true">⚙️</span></h1>
          <p className="page-subtitle">Manage RFID tags and test check-ins without changing student records manually.</p>
        </div>
        <span className="badge badge-neutral">{rows.length} profiles</span>
      </div>

      <div className="status-banner" style={{ marginBottom: 22, background: "var(--surface-soft)", color: "var(--muted)" }}>
        <span aria-hidden="true">ⓘ</span>
        <span>Create student accounts in Supabase → Authentication → Users. Their profiles appear here automatically.</span>
      </div>
      {msg && <div className={`status-banner ${msg.error ? "error" : "success"}`} role={msg.error ? "alert" : "status"} style={{ marginBottom: 18 }}>{msg.text}</div>}

      <section className="panel">
        <div className="panel-padding" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="panel-title">RFID assignments</h2>
            <p className="panel-description">Edit a tag and move focus away to save it.</p>
          </div>
        </div>
        <hr className="divider" />
        {rows.map(r => (
          <div key={r.id} className="list-row" style={{ margin: 12, alignItems: "center" }}>
            <div className="row-main" style={{ flex: 1 }}>
              <div className="avatar" aria-hidden="true">{r.name.trim().charAt(0).toUpperCase() || "?"}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row-name">{r.name}</div>
                <div className="row-meta">{r.role === "admin" ? "Administrator" : "Student"} · {r.rfid_tag ? `Tag: ${r.rfid_tag}` : "No tag linked"}</div>
                <label className="field-label" htmlFor={`rfid-${r.id}`} style={{ marginTop: 12 }}>RFID tag</label>
                <input key={`${r.id}:${r.rfid_tag ?? ""}`} id={`rfid-${r.id}`} className="field" style={{ maxWidth: 360 }}
                  placeholder="Enter RFID tag" defaultValue={r.rfid_tag ?? ""} onBlur={e => linkTag(r, e.target.value)} />
              </div>
            </div>
            <button type="button" onClick={() => simulate(r)} disabled={!r.rfid_tag} className="button button-success">
              Simulate tap
            </button>
          </div>
        ))}
        {rows.length === 0 && <div className="empty-state">No profiles found.</div>}
      </section>
    </main>
  );
}
