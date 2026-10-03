# Charity referral portal

Vite + React + TypeScript + Tailwind v4 + Supabase (magic-link auth).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon/publishable key.
3. Supabase -> SQL Editor: run `supabase/schema.sql` (change the admin email at the bottom first).
4. Supabase -> Authentication -> URL Configuration: Site URL `http://localhost:5173`, add redirect URL `http://localhost:5173/**` (and your live domain later).
5. Supabase -> Authentication -> SMTP: add a custom SMTP provider before real use (built-in sender is heavily rate limited).
6. `npm run dev`

## Routes
- `/` referrer sign in (magic link), `/referral` the form
- `/admin/login` admin sign in, `/admin` Form / Responses / Referral emails / Settings
