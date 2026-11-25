# CLASS FEEDBACK

A lightweight, single-page class satisfaction poll built with HTML, CSS, JavaScript, and Supabase.

## Supabase setup

1. Apply `supabase/migrations/20261125184000_create_votes_and_policies.sql`.
2. In **Authentication → Settings**, turn off new user sign-ups and anonymous sign-ins. Keep the project's Auth users limited to administrators.
3. In **Authentication → Users → Add user → Create new user**, add each administrator. No account credentials are stored in this repository or in Vercel.
4. Copy the project URL and publishable key from the Supabase API settings.

The `votes` table uses row-level security. Anonymous visitors can insert a rating only; authenticated users can read, insert, and delete votes. No role can update a vote.

## Vercel deployment

Connect the GitHub repository to Vercel and set these environment variables for Production, Preview, and Development:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Vercel builds the static site with `npm run build`. The build script writes the public Supabase configuration into the ignored `dist/config.js`; the URL and publishable key are intended for browser use. Never put a Supabase secret or service-role key in these variables.

## Local build

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the environment, then run `npm run build`. Serve the generated `dist` directory with any static file server.
