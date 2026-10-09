import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { logTap } from "../_shared/log-tap.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL")!;

    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });

    // Pass the token explicitly so the user is verified by Supabase Auth.
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "unauth" }, 401);

    const { data: me } = await userClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") return json({ error: "forbidden" }, 403);

    const { rfid_tag } = await req.json();
    if (typeof rfid_tag !== "string" || !rfid_tag.trim()) {
      return json({ error: "missing tag" }, 400);
    }

    const db = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY")!,
    );
    const result = await logTap(db, rfid_tag.trim());
    return json(result.body, result.status);
  } catch (err) {
    console.error(err);
    return json({ error: "server error" }, 500);
  }
});
