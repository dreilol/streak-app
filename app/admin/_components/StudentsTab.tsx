"use client";
import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";

type Msg = { text: string; error?: boolean };
type Section = { id: string; name: string; batch_id: string | null };
type Batch = { id: string; name: string };

export default function StudentsTab() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, s, b] = await Promise.all([
        supabase.from("profiles").select("*").order("name"),
        supabase.from("sections").select("id,name,batch_id").order("name"),
        supabase.from("batches").select("id,name").order("created_at"),
      ]);
      if (!active) return;
      setRows((p.data as Profile[]) ?? []);
      setSections((s.data as Section[]) ?? []);
      setBatches((b.data as Batch[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [version]);

  async function linkTag(p: Profile, raw: string) {
    const tag = raw.trim();
    if (tag === (p.rfid_tag ?? "")) return;
    const { error } = await supabase.from("profiles").update({ rfid_tag: tag || null }).eq("id", p.id);
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

  async function changeSection(p: Profile, sectionId: string) {
    const newVal = sectionId || null;
    if (newVal === (p.section_id ?? null)) return;
    const { error } = await supabase.from("profiles").update({ section_id: newVal }).eq("id", p.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: newVal ? `Assigned ${p.name} to a section.` : `Removed ${p.name} from their section.` });
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
    } else if (data?.paused) {
  setMsg({
    text: `${p.name} is paused — tap logged but streak unchanged (still ${data.streak}).`,
  });
} else {
  setMsg({
    text: data?.already_logged
      ? `${p.name} already tapped in today (streak ${data.streak}).`
      : `Simulated tap for ${p.name} (streak ${data?.streak ?? "?"}).`,
  });
}
    reload();
  }

  if (loading) return <div className="loading-state">Loading students…</div>;

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`status-banner ${msg.error ? "error" : "success"}`} role={msg.error ? "alert" : "status"}>
          {msg.text}
        </div>
      )}

      <div className="status-banner" style={{ background: "var(--surface-soft)", color: "var(--muted)" }}>
        <span aria-hidden="true">ⓘ</span>
        <span>Create student accounts in Supabase → Authentication → Users. Their profiles appear here automatically.</span>
      </div>

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">Students</h2>
          <p className="panel-description">Assign a section and an RFID tag. Changes save as soon as you click away.</p>
        </div>
        <hr className="divider" />
        {rows.map(r => (
          <StudentRow
            key={r.id}
            profile={r}
            sections={sections}
            batches={batches}
            onLinkTag={linkTag}
            onChangeSection={changeSection}
            onSimulate={simulate}
          />
        ))}
        {rows.length === 0 && <div className="empty-state">No profiles found.</div>}
      </section>
    </div>
  );
}

function StudentRow({
  profile,
  sections,
  batches,
  onLinkTag,
  onChangeSection,
  onSimulate,
}: {
  profile: Profile;
  sections: Section[];
  batches: Batch[];
  onLinkTag: (p: Profile, raw: string) => void;
  onChangeSection: (p: Profile, sectionId: string) => void;
  onSimulate: (p: Profile) => void;
}) {
  const sectionLabel = sections.find(s => s.id === profile.section_id)?.name ?? "";
  const batchName = batches.find(b => b.id === sections.find(s => s.id === profile.section_id)?.batch_id)?.name;

  return (
    <div className="list-row" style={{ margin: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="row-main" style={{ flex: 1, minWidth: 260 }}>
        <div className="avatar" aria-hidden="true">{profile.name.trim().charAt(0).toUpperCase() || "?"}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-name">{profile.name}</div>
          <div className="row-meta">
            {profile.role === "admin" ? "Administrator" : "Student"}
            {sectionLabel ? ` · ${sectionLabel}${batchName ? ` (${batchName})` : ""}` : " · No section"}
            {profile.rfid_tag ? ` · Tag: ${profile.rfid_tag}` : " · No tag"}
          </div>

          {profile.role === "student" && (
            <>
              <label className="field-label" htmlFor={`section-${profile.id}`} style={{ marginTop: 12 }}>
                Section
              </label>
              <select
                id={`section-${profile.id}`}
                className="field"
                style={{ maxWidth: 360 }}
                value={profile.section_id ?? ""}
                onChange={e => onChangeSection(profile, e.target.value)}
              >
                <option value="">— no section —</option>
                {sections.map(s => {
                  const b = batches.find(x => x.id === s.batch_id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}{b ? ` (${b.name})` : ""}
                    </option>
                  );
                })}
              </select>
            </>
          )}

          <label className="field-label" htmlFor={`rfid-${profile.id}`} style={{ marginTop: 12 }}>
            RFID tag
          </label>
          <input
            key={`${profile.id}:${profile.rfid_tag ?? ""}`}
            id={`rfid-${profile.id}`}
            className="field"
            style={{ maxWidth: 360 }}
            placeholder="Enter RFID tag"
            defaultValue={profile.rfid_tag ?? ""}
            onBlur={e => onLinkTag(profile, e.target.value)}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSimulate(profile)}
        disabled={!profile.rfid_tag}
        className="button button-success"
        style={{ alignSelf: "center" }}
      >
        Simulate tap
      </button>
    </div>
  );
}