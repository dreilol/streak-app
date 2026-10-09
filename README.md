# Tumbler Streak App

Next.js + Supabase dashboard for the RFID tumbler streak tracker.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. `npm run dev`

## Database (Supabase → SQL Editor)
Run these two files, in order. Both are safe to re-run:
1. `supabase/schema.sql`
2. `supabase/policies.sql`

Make yourself admin (once), using your own email:
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

## Edge functions
```bash
supabase functions deploy tap --no-verify-jwt
supabase functions deploy simulate-tap
supabase secrets set DEVICE_SECRET=pick-a-long-random-string
```
`tap` is called by the ESP32 and is protected by `DEVICE_SECRET`, so it must be
deployed with `--no-verify-jwt`. `simulate-tap` is called by the admin page and
checks the signed-in user's role.

## ESP32 request
`POST https://<project-ref>.supabase.co/functions/v1/tap`
```json
{ "rfid_tag": "A1B2C3D4", "secret": "<DEVICE_SECRET>" }
```
Reply: `{ "ok": true, "already_logged": false, "name": "Ana", "streak": 4 }`
(or `404 unknown tag`, `403 forbidden`). Use `name` and `streak` for the OLED.

## Vercel
Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
Project → Settings → Environment Variables, then redeploy.
Never put the service role key or `DEVICE_SECRET` in Vercel or in the repo.
