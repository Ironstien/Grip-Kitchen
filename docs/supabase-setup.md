# Grip Kitchen — Supabase Setup

Phase 2 backend integration for Grip Kitchen.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **Project Settings → API**.
3. Copy the **Project URL** and **anon public** key.

## 2. Configure local environment

1. Copy `.env.example` to `.env` in the project root.
2. Fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Restart the Expo dev server after changing `.env`.

## 3. Run the database migration

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`.
3. Run the script.

This creates all Grip Kitchen tables, enables Row Level Security, and adds a trigger that auto-creates a `users` profile row when someone signs up.

### Recipe photo storage (Phase 3)

1. In **SQL Editor**, paste and run `supabase/migrations/002_recipe_photos_storage.sql`.
2. Confirm **Storage → recipe-photos** bucket exists in the dashboard.

Recipe hero uploads from the app write to this bucket under `{user_id}/{recipe_id}/...`.

### Master Units List and Master ingredient list

Run these in order in **SQL Editor**:

1. `supabase/migrations/003_price_unit_of_measure.sql` — price unit column on inventory
2. `supabase/migrations/004_user_units.sql` — custom units (skip if `user_units already exists`)
3. `supabase/migrations/005_ingredients_master_list.sql` — master ingredient catalog (or `006_fix_ingredients_master_list.sql` if 005 failed)
4. `supabase/migrations/007_user_categories.sql` — master category list
5. `supabase/migrations/008_ingredient_purchase_conversions.sql` — purchase format, display names, conversions, recipe units

**If 005 fails** (e.g. `price_unit_of_measure does not exist`, or a partial run), run:

`supabase/migrations/006_fix_ingredients_master_list.sql`

That script is safe to re-run and finishes any incomplete steps.

Without the ingredients table, Settings → Master list shows *"Could not find the table public.ingredients"*.

### Shared household access

Run **`supabase/migrations/014_ensure_shared_household.sql`** in the Supabase SQL Editor. This is the single script that:

- Creates the shared `notes` table (if missing)
- Removes all old per-user security policies
- Applies shared access so every signed-in Google account sees the same data
- Enables live note sync between devices

Safe to re-run if sharing still is not working.

Older migrations `012_shared_household_access.sql` and `013_notes.sql` are superseded by `014` — you only need to run `014`.

## 4. Enable Google OAuth

### Supabase

1. In the left sidebar, click **Authentication** (person icon).
2. Under **CONFIGURATION**, click **Sign In / Providers** (not "Users").
3. Find **Google** in the provider list and expand it.
4. Turn **Enable Sign in with Google** on.
5. Paste your Google **Client ID** and **Client Secret** from Google Cloud Console.
6. Click **Save**.

### Google Cloud Console

1. Create an OAuth 2.0 Web client.
2. Add authorized JavaScript origins:
   - `http://localhost:8081`
   - Your production domain when deployed
3. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

### Supabase redirect URLs

In the same **Authentication** sidebar, open **URL Configuration** (under CONFIGURATION) and add:

- `http://localhost:8081/callback`
- `gripkitchen://callback`
- Your production callback URL when deployed

Set **Site URL** to `http://localhost:8081` for local development.

## 5. Test sign-in locally

```bash
npm run web
```

1. Open `http://localhost:8081`.
2. You should land on the login screen.
3. Click **Continue with Google**.
4. After auth, you should enter the app.
5. Open **Settings** and confirm your email appears.
6. Click **Sign out** and confirm you return to login.

## 6. Verify shared household access

After running migration `014_ensure_shared_household.sql`, any signed-in user should see the same data.

1. Sign in with your main account and confirm ingredients, pantry, recipes, and notes load.
2. Sign out, then sign in with a second Google account (e.g. your partner's phone).
3. The same ingredients, pantry items, recipes, and notes should appear.
4. Add a note on one phone — it should appear on the other within a few seconds.

If the second account still sees an empty app, re-run `014_ensure_shared_household.sql` in the Supabase SQL Editor and confirm both users completed Google sign-in (a row exists in `public.users` for each).

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Login button disabled | `.env` missing or dev server not restarted |
| Redirect loop after Google sign-in | Add `http://localhost:8081/callback` to Supabase redirect URLs |
| `users` row missing after sign-in | Re-run migration; trigger `on_auth_user_created` should exist |
| Google OAuth error | Check Google client origins and Supabase callback URL match |
