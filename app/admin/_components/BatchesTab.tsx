"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Batch = {
  id: string;
  name: string;
  meeting_days: number[];
  created_at: string;
};

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

type Msg = { text: string; error?: boolean };

export default function BatchesTab() {
  const [rows, setRows] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) setMsg({ text: error.message, error: true });
      else setRows((data as Batch[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [version]);

  function toggleDay(d: number) {
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const trimmed = name.trim();
    if (!trimmed) return setMsg({ text: "Give the batch a name.", error: true });
    if (days.length === 0) return setMsg({ text: "Pick at least one school day.", error: true });

    setBusy(true);
    const { error } = await supabase.from("batches").insert({ name: trimmed, meeting_days: days });
    setBusy(false);

    if (error) {
      setMsg({
        text: error.code === "23505" ? "A batch with that name already exists." : error.message,
        error: true,
      });
      return;
    }
    setName("");
    setDays([]);
    setMsg({ text: `Created ${trimmed}.` });
    reload();
  }

  async function remove(b: Batch) {
    if (!confirm(`Delete ${b.name}? Any sections under it will also be removed.`)) return;
    const { error } = await supabase.from("batches").delete().eq("id", b.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Deleted ${b.name}.` });
    reload();
  }

  async function rename(b: Batch, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === b.name) return;
    const { error } = await supabase.from("batches").update({ name: trimmed }).eq("id", b.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Renamed to ${trimmed}.` });
    reload();
  }

  async function updateDays(b: Batch, newDays: number[]) {
    const { error } = await supabase.from("batches").update({ meeting_days: newDays }).eq("id", b.id);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: `Updated days for ${b.name}.` });
    reload();
  }

  if (loading) return <div className="loading-state">Loading batches…</div>;

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`status-banner ${msg.error ? "error" : "success"}`} role={msg.error ? "alert" : "status"}>
          {msg.text}
        </div>
      )}

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">New batch</h2>
          <p className="panel-description">
            A batch is a group of students who come to school on the same days (e.g. Batch 1 = Mon/Tue/Wed).
          </p>
          <form onSubmit={create} className="space-y-3" style={{ marginTop: 16 }}>
            <div>
              <label className="field-label" htmlFor="batch-name">Batch name</label>
              <input
                id="batch-name"
                className="field"
                style={{ maxWidth: 360 }}
                placeholder="e.g. Batch 1"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">School days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={days.includes(d.value) ? "button button-primary" : "button"}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={busy} className="button button-primary">
              {busy ? "Creating…" : "Create batch"}
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">All batches</h2>
          <p className="panel-description">{rows.length} total</p>
        </div>
        <hr className="divider" />
        {rows.map(b => (
          <BatchRow key={b.id} batch={b} onRename={rename} onDelete={remove} onUpdateDays={updateDays} />
        ))}
        {rows.length === 0 && <div className="empty-state">No batches yet. Create one above.</div>}
      </section>
    </div>
  );
}

function BatchRow({
  batch,
  onRename,
  onDelete,
  onUpdateDays,
}: {
  batch: Batch;
  onRename: (b: Batch, name: string) => void;
  onDelete: (b: Batch) => void;
  onUpdateDays: (b: Batch, days: number[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(batch.name);
  const [days, setDays] = useState<number[]>(batch.meeting_days);

  function toggleDay(d: number) {
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()));
  }

  function save() {
    if (name.trim() !== batch.name) onRename(batch, name);
    const sameDays = days.length === batch.meeting_days.length && days.every((d, i) => d === batch.meeting_days[i]);
    if (!sameDays) onUpdateDays(batch, days);
    setEditing(false);
  }

  function cancel() {
    setName(batch.name);
    setDays(batch.meeting_days);
    setEditing(false);
  }

  const dayLabels = batch.meeting_days
    .map(d => DAYS.find(x => x.value === d)?.label ?? "?")
    .join(" · ");

  if (editing) {
    return (
      <div className="list-row" style={{ margin: 12, alignItems: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: "100%" }}>
          <label className="field-label">Batch name</label>
          <input className="field" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ width: "100%" }}>
          <label className="field-label">School days</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={days.includes(d.value) ? "button button-primary" : "button"}
              >
                {d.label}
              </button>
            ))}
          </div>
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
        <div className="avatar" aria-hidden="true">{batch.name.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-name">{batch.name}</div>
          <div className="row-meta">{dayLabels || "No days set"}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="button" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="button" onClick={() => onDelete(batch)} style={{ color: "var(--danger)" }}>
          Delete
        </button>
      </div>
    </div>
  );
}