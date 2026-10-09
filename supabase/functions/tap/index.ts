import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { logTap } from "../_shared/log-tap.ts";

const DEVICE_SECRET = Deno.env.get("DEVICE_SECRET");

// Compare without leaking how many characters matched.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const { rfid_tag, secret } = await req.json();

    // SECURITY FIX: the old check (`secret !== Deno.env.get(...)`) let anyone in
    // when DEVICE_SECRET was not set, by simply omitting "secret" from the body.
    if (!DEVICE_SECRET || typeof secret !== "string" || !safeEqual(secret, DEVICE_SECRET)) {
      return json({ error: "forbidden" }, 403);
    }
    if (typeof rfid_tag !== "string" || !rfid_tag.trim()) {
      return json({ error: "missing tag" }, 400);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY")!,
    );

    const result = await logTap(db, rfid_tag.trim());
    return json(result.body, result.status);
  } catch (err) {
    console.error(err);
    return json({ error: "server error" }, 500);
  }
});
