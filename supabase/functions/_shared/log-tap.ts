import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Calendar date (YYYY-MM-DD) in Philippine time. */
export function manilaDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString(
    "en-CA",
    { timeZone: "Asia/Manila" },
  );
}

/**
 * Shared by the real device endpoint and the admin simulator.
 * One log per student per day: a second tap the same day is acknowledged but
 * not stored again, so the history stays clean.
 * `db` must be a service-role client.
 */
export async function logTap(db: SupabaseClient, rfidTag: string) {
  const { data: profile, error } = await db
    .from("profiles")
    .select("id,name,last_log_date,current_streak")
    .eq("rfid_tag", rfidTag)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return { status: 404, body: { error: "unknown tag" } };

  const today = manilaDate();
  if (profile.last_log_date === today) {
    return {
      status: 200,
      body: {
        ok: true,
        already_logged: true,
        name: profile.name,
        streak: profile.current_streak,
      },
    };
  }

  const { error: insertError } = await db
    .from("logs")
    .insert({ profile_id: profile.id, tag: rfidTag, log_date: today });
  if (insertError) throw insertError;

  // The database trigger has updated the streak; read the new value back.
  const { data: updated, error: readError } = await db
    .from("profiles")
    .select("current_streak")
    .eq("id", profile.id)
    .single();
  if (readError) throw readError;

  return {
    status: 200,
    body: {
      ok: true,
      already_logged: false,
      name: profile.name,
      streak: updated.current_streak,
    },
  };
}
