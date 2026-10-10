import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: me } = await userClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rfid_tag } = await req.json();
    if (!rfid_tag) {
      return new Response(JSON.stringify({ error: "missing tag" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await db
      .from("profiles")
      .select("id,section_id,current_streak")
      .eq("rfid_tag", rfid_tag)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "unknown tag" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Today's date in PH time
    const todayPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

    // ─── Already logged today? ───
  const { data: existingLogs } = await db
  .from("logs")
  .select("id")
  .eq("profile_id", profile.id)
  .eq("log_date", todayPH)
  .limit(1);

if (existingLogs && existingLogs.length > 0) {
      return new Response(JSON.stringify({
        ok: true,
        already_logged: true,
        paused: false,
        streak: profile.current_streak,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Check if paused ───
    let paused = false;

    const { data: activePauses } = await db
      .from("pauses")
      .select("target_type,target_id")
      .is("ended_at", null);

    if (activePauses && activePauses.length > 0) {
      let batchId: string | null = null;
      if (profile.section_id) {
        const { data: section } = await db
          .from("sections")
          .select("batch_id")
          .eq("id", profile.section_id)
          .single();
        batchId = section?.batch_id ?? null;
      }

      paused = activePauses.some(p => {
        if (p.target_type === "all") return true;
        if (p.target_type === "student" && p.target_id === profile.id) return true;
        if (p.target_type === "section" && p.target_id === profile.section_id) return true;
        if (p.target_type === "batch" && batchId && p.target_id === batchId) return true;
        return false;
      });
    }

    // Log the tap
    await db.from("logs").insert({ profile_id: profile.id, tag: rfid_tag });

    // If paused, don't touch the streak
    if (paused) {
      return new Response(JSON.stringify({
        ok: true,
        already_logged: false,
        paused: true,
        streak: profile.current_streak,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Not paused — read back what the trigger decided
    const { data: updated } = await db
      .from("profiles")
      .select("current_streak")
      .eq("id", profile.id)
      .single();

    return new Response(JSON.stringify({
      ok: true,
      already_logged: false,
      paused: false,
      streak: updated?.current_streak ?? profile.current_streak,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});