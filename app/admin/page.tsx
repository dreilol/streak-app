"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";
import StudentsTab from "./_components/StudentsTab";
import BatchesTab from "./_components/BatchesTab";
import SectionsTab from "./_components/SectionsTab";

type Tab = "students" | "batches" | "sections";

export default function Admin() {
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("students");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: mine } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setMe(mine as Profile | null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="page-container loading-state">Loading admin tools…</main>;
  if (me?.role !== "admin") return (
    <main className="page-container narrow">
      <div className="status-banner error" role="alert">
        Admins only. This account doesn&apos;t have administrator access.
      </div>
    </main>
  );

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Manage the experience</p>
          <h1 className="page-title">Admin tools <span aria-hidden="true">⚙️</span></h1>
          <p className="page-subtitle">Manage students, batches, and sections — all in one place.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--line)" }}>
        <TabButton active={tab === "students"} onClick={() => setTab("students")}>Students</TabButton>
        <TabButton active={tab === "batches"} onClick={() => setTab("batches")}>Batches</TabButton>
        <TabButton active={tab === "sections"} onClick={() => setTab("sections")}>Sections</TabButton>
      </div>

      {tab === "students" && <StudentsTab />}
 {tab === "batches" && <BatchesTab />}
   {tab === "sections" && <SectionsTab />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 18px",
        background: "transparent",
        border: 0,
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
        color: active ? "var(--accent)" : "var(--muted)",
        fontWeight: 750,
        fontSize: 14,
        cursor: "pointer",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}