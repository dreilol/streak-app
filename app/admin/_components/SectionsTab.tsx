"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Batch = { id: string; name: string; meeting_days: number[] };
type Section = { id: string; name: string; batch_id: string | null; created_at: string };

const DAYS: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun",
};

type Msg = { text: string; error?: boolean };

export default function SectionsTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [name, setName] = useState("");
  const [batchId, setBatchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      const [s, b] = await Promise.all([
        supabase.from("sections").select("*").order("created_at", { ascending: true }),
        supabase.from("batches").select("id,name,meeting_days").order("created_at"),
      ]);
      if (!active) return;
      if (s.error) setMsg({ text: s.error.message, error: true });
      else setSections((s.data as Section[]) ?? []);
      setBatches((b.data as Batch[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [version]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const trimmed = name.trim();
    if (!trimmed) return setMsg({ text: "Give the section a name.", error: true });
    if (!batchId) return setMsg({ text: "Pick a batch for this section.", error: true });

    setBusy(true);
    const { error } = await supabase.from("sections").insert({ name: trimmed, batch_id: batchId });
    setBusy(false);

    if (error) return setMsg({ text: error.message, error: true });
    setName("");
    setMsg({ text: `Created ${trimmed}.` });
    reload();
  }

  async function remove(s: Section) {
    if (!confirm(`Delete ${s.name}? Students in it will lose their section.`)) return;
    const { error } = await supabase.from("sections").delete().eq("id", s.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Deleted ${s.name}.` });
    reload();
  }

  async function rename(s: Section, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === s.name) return;
    const { error } = await supabase.from("sections").update({ name: trimmed }).eq("id", s.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Renamed to ${trimmed}.` });
    reload();
  }

  async function changeBatch(s: Section, newBatchId: string) {
    if (newBatchId === s.batch_id) return;
    const { error } = await supabase.from("sections").update({ batch_id: newBatchId }).eq("id", s.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Moved ${s.name} to a different batch.` });
    reload();
  }

  if (loading) return <div className="loading-state">Loading sections…</div>;

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`status-banner ${msg.error ? "error" : "success"}`} role={msg.error ? "alert" : "status"}>
          {msg.text}
        </div>
      )}

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">New section</h2>
          <p className="panel-description">
            A section is a group of students that sits together (e.g. 10-A). Every section belongs to one batch.
          </p>
          {batches.length === 0 ? (
            <div className="status-banner warning" style={{ marginTop: 16 }}>
              You need at least one batch first. Go to the <strong>Batches</strong> tab and create one.
            </div>
          ) : (
            <form onSubmit={create} className="space-y-3" style={{ marginTop: 16 }}>
              <div>
                <label className="field-label" htmlFor="section-name">Section name</label>
                <input
                  id="section-name"
                  className="field"
                  style={{ maxWidth: 360 }}
                  placeholder="e.g. 10-A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="section-batch">Batch</label>
                <select
                  id="section-batch"
                  className="field"
                  style={{ maxWidth: 360 }}
                  value={batchId}
                  onChange={e => setBatchId(e.target.value)}
                >
                  <option value="">— pick a batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.meeting_days.map(d => DAYS[d] ?? "?").join(" ")})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={busy} className="button button-primary">
                {busy ? "Creating…" : "Create section"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">All sections</h2>
          <p className="panel-description">{sections.length} total</p>
        </div>
        <hr className="divider" />
        {sections.map(s => (
          <SectionRow key={s.id} section={s} batches={batches} onRename={rename} onChangeBatch={changeBatch} onDelete={remove} />
        ))}
        {sections.length === 0 && <div className="empty-state">No sections yet. Create one above.</div>}
      </section>
    </div>
  );
}

function SectionRow({
  section,
  batches,
  onRename,
  onChangeBatch,
  onDelete,
}: {
  section: Section;
  batches: Batch[];
  onRename: (s: Section, name: string) => void;
  onChangeBatch: (s: Section, batchId: string) => void;
  onDelete: (s: Section) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [batchId, setBatchId] = useState(section.batch_id ?? "");

  function save() {
    if (name.trim() !== section.name) onRename(section, name);
    if (batchId !== (section.batch_id ?? "")) onChangeBatch(section, batchId);
    setEditing(false);
  }

  function cancel() {
    setName(section.name);
    setBatchId(section.batch_id ?? "");
    setEditing(false);
  }

  const batchName = batches.find(b => b.id === section.batch_id)?.name ?? "No batch";

  if (editing) {
    return (
      <div className="list-row" style={{ margin: 12, alignItems: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: "100%" }}>
          <label className="field-label">Section name</label>
          <input className="field" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ width: "100%" }}>
          <label className="field-label">Batch</label>
          <select className="field" value={batchId} onChange={e => setBatchId(e.target.value)}>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2" style={{ width: "100%", justifyContent: "flex-end" }}>
          <button type="button" className="button" onClick={cancel}>Cancel</button>
          <button type="button" className="button button-primary" onClick={save}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-row" style={{ margin: 12, alignItems: "center" }}>
      <div className="row-main" style={{ flex: 1 }}>
        <div className="avatar" aria-hidden="true">{section.name.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-name">{section.name}</div>
          <div className="row-meta">{batchName}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="button" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="button" onClick={() => onDelete(section)} style={{ color: "var(--danger)" }}>
          Delete
        </button>
      </div>
    </div>
  );
}