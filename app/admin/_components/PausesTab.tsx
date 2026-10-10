"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Pause = {
  id: string;
  target_type: "student" | "section" | "batch" | "all";
  target_id: string | null;
  reason: string | null;
  started_at: string;
  ended_at: string | null;
  created_by: string | null;
};

type Batch = { id: string; name: string };
type Section = { id: string; name: string; batch_id: string | null };
type Profile = { id: string; name: string; role: string; section_id: string | null };

type Msg = { text: string; error?: boolean };
type TargetType = "all" | "batch" | "section" | "student";

export default function PausesTab() {
  const [rows, setRows] = useState<Pause[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, b, s, u] = await Promise.all([
        supabase.from("pauses").select("*").is("ended_at", null).order("started_at", { ascending: false }),
        supabase.from("batches").select("id,name").order("created_at"),
        supabase.from("sections").select("id,name,batch_id").order("name"),
        supabase.from("profiles").select("id,name,role,section_id").eq("role", "student").order("name"),
      ]);
      if (!active) return;
      if (p.error) setMsg({ text: p.error.message, error: true });
      else setRows((p.data as Pause[]) ?? []);
      setBatches((b.data as Batch[]) ?? []);
      setSections((s.data as Section[]) ?? []);
      setStudents((u.data as Profile[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [version]);

  function resetTarget() {
    setTargetId("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (targetType !== "all" && !targetId) {
      return setMsg({ text: "Pick who this pause applies to.", error: true });
    }

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("pauses").insert({
      target_type: targetType,
      target_id: targetType === "all" ? null : targetId,
      reason: reason.trim() || null,
      created_by: user?.id ?? null,
    });
    setBusy(false);

    if (error) return setMsg({ text: error.message, error: true });

    setTargetType("all");
    setTargetId("");
    setReason("");
    setMsg({ text: "Pause started." });
    reload();
  }

  async function endPause(p: Pause) {
    if (!confirm("End this pause? The streak will resume normally on the next tap.")) return;
    setEnding(p.id);
    const { error } = await supabase
      .from("pauses")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", p.id);
    setEnding(null);
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: "Pause ended." });
    reload();
  }

  if (loading) return <div className="loading-state">Loading pauses…</div>;

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`status-banner ${msg.error ? "error" : "success"}`} role={msg.error ? "alert" : "status"}>
          {msg.text}
        </div>
      )}

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">Start a pause</h2>
          <p className="panel-description">
            Freeze a student&apos;s streak. Taps during a pause are logged but don&apos;t count — the streak picks up where it left off.
          </p>

          <form onSubmit={create} className="space-y-3" style={{ marginTop: 16 }}>
            <div>
              <label className="field-label" htmlFor="pause-type">Applies to</label>
              <select
                id="pause-type"
                className="field"
                style={{ maxWidth: 360 }}
                value={targetType}
                onChange={e => { setTargetType(e.target.value as TargetType); resetTarget(); }}
              >
                <option value="all">Everyone</option>
                <option value="batch">A batch</option>
                <option value="section">A section</option>
                <option value="student">A specific student</option>
              </select>
            </div>

            {targetType === "batch" && (
              <div>
                <label className="field-label" htmlFor="pause-batch">Which batch</label>
                <select
                  id="pause-batch"
                  className="field"
                  style={{ maxWidth: 360 }}
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                >
                  <option value="">— pick a batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "section" && (
              <div>
                <label className="field-label" htmlFor="pause-section">Which section</label>
                <select
                  id="pause-section"
                  className="field"
                  style={{ maxWidth: 360 }}
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                >
                  <option value="">— pick a section —</option>
                  {sections.map(s => {
                    const b = batches.find(x => x.id === s.batch_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name}{b ? ` (${b.name})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {targetType === "student" && (
              <div>
                <label className="field-label" htmlFor="pause-student">Which student</label>
                <select
                  id="pause-student"
                  className="field"
                  style={{ maxWidth: 360 }}
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                >
                  <option value="">— pick a student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="pause-reason">Reason (optional)</label>
              <input
                id="pause-reason"
                className="field"
                style={{ maxWidth: 480 }}
                placeholder="e.g. Typhoon suspension, exam week, excused absence"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <button type="submit" disabled={busy} className="button button-primary">
              {busy ? "Starting…" : "Start pause"}
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-padding">
          <h2 className="panel-title">Active pauses</h2>
          <p className="panel-description">{rows.length} active</p>
        </div>
        <hr className="divider" />
        {rows.length === 0 ? (
          <div className="empty-state">No active pauses right now.</div>
        ) : (
          rows.map(p => {
            let label = "Everyone";
            if (p.target_type === "batch") {
              label = batches.find(b => b.id === p.target_id)?.name ?? "Unknown batch";
            } else if (p.target_type === "section") {
              label = sections.find(s => s.id === p.target_id)?.name ?? "Unknown section";
            } else if (p.target_type === "student") {
              label = students.find(s => s.id === p.target_id)?.name ?? "Unknown student";
            }
            const isEnding = ending === p.id;
            return (
              <div key={p.id} className="list-row" style={{ margin: 12, alignItems: "center" }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <div className="avatar" aria-hidden="true">⏸</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row-name">{label}</div>
                    <div className="row-meta">
                      {p.reason || "No reason given"} · started {new Date(p.started_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => endPause(p)}
                  disabled={isEnding}
                  className="button"
                >
                  {isEnding ? "Ending…" : "End pause"}
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}