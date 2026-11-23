# APEX

APEX is an Expo React Native app for personal fitness. Phase 1 provides accounts, persisted onboarding profiles, and a dashboard. Phase 2 adds an exercise library, workout plans, goal-based generation, live set logging, rest timing, offline storage, and queued Supabase sync. Phase 3 adds personal-progress analysis. Phase 4 adds an interactive anatomy map, muscle-specific training information, exercise references, muscle heatmaps, and recovery indicators derived from completed sessions.

## Run locally

1. Install Node.js 20 LTS or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set your Supabase project URL and anon key.
4. Apply `supabase/migrations/202611230001_phase1_profiles.sql` and `supabase/migrations/202611230002_workout_engine.sql` to your Supabase project, in that order.
5. In Supabase Auth settings, enable email/password sign-in and configure the desired email confirmation behavior.
6. Start Expo with `npm start` and open the project in Expo Go or a simulator. For a browser preview, run `npm run web`.

For a local UI preview without Supabase, set `EXPO_PUBLIC_PREVIEW_MODE=true` in `.env` and restart Expo. This opens the app with sample workouts in an isolated local-only account; no authentication or cloud sync is performed. Set it to `false` and configure the Supabase URL/key to use real accounts.

Only the Supabase anon key belongs in the Expo client. Never add a service-role key to this app.

Without valid Supabase environment values, the app opens in a configuration state unless local preview mode is enabled. New accounts are routed through onboarding; completed profiles land on the dashboard. Workout plans and exercises are bundled locally. Finished sessions are stored per account on-device first, then synced when an authenticated session can reach Supabase.
