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

## 6. Test RLS isolation with two accounts

Row Level Security ensures each user only sees their own data.

### Setup

1. Sign in with Google account A.
2. In Supabase SQL Editor, insert a test inventory row for account A:

```sql
INSERT INTO public.inventory (user_id, name, category, quantity, unit_of_measure)
SELECT id, 'Account A Milk', 'Dairy', 1, 'L'
FROM public.users
LIMIT 1;
```

3. Sign out in the app.
4. Sign in with Google account B.
5. Insert a different row for account B using the same SQL with a different name.

### Verify in the app (Phase 3+)

Once inventory UI exists, each account should only see its own items.

### Verify in Supabase SQL Editor

Run as the authenticated user via the app, or test policies directly:

```sql
-- Should only return rows where user_id = auth.uid()
SELECT * FROM public.inventory;
```

With account A signed in, account B's rows must not appear.

### Quick API test from browser console

While signed in as account A:

```js
const { data, error } = await supabase.from('inventory').select('*');
console.log(data, error);
```

Sign out, sign in as account B, run again — results must differ and never overlap.

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Login button disabled | `.env` missing or dev server not restarted |
| Redirect loop after Google sign-in | Add `http://localhost:8081/callback` to Supabase redirect URLs |
| `users` row missing after sign-in | Re-run migration; trigger `on_auth_user_created` should exist |
| Google OAuth error | Check Google client origins and Supabase callback URL match |
