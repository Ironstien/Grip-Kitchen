# Grip Kitchen — Live Testing & Vercel Deployment

## Local development (live testing)

1. Copy `.env.example` to `.env` and add your Supabase keys (see [supabase-setup.md](./supabase-setup.md)).
2. Start the dev server:

```bash
npm run web
```

3. Open [http://localhost:8081](http://localhost:8081).

Changes hot-reload automatically. Restart the dev server after editing `.env`.

### Preview the production build locally

```bash
npm run build
npm run preview
```

Open [http://localhost:3000](http://localhost:3000). This serves the same static output Vercel deploys.

---

## Git + Vercel auto-deploy

### 1. Initialize Git and push to GitHub

If you have not created a repo yet:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create grip-kitchen --public --source=. --push
```

Or link to an existing GitHub repo:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/grip-kitchen.git
git branch -M main
git push -u origin main
```

### 2. Connect the repo to Vercel (one-time)

The Vercel project **grip-kitchen** is already linked locally. To enable **auto-deploy on git push**:

1. Push your code to GitHub (see step 1 above).
2. Open [Vercel → grip-kitchen → Settings → Git](https://vercel.com/grip-projects/grip-kitchen/settings/git).
3. Click **Connect Git Repository** and select `Ironstien/Grip-Kitchen`.
   - If prompted, install/authorize the Vercel GitHub app for your account.
4. Confirm build settings (from `vercel.json`):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

Environment variables are already configured on Vercel:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

After Git is connected, every push to `main` triggers a production deploy. Pull requests get preview URLs automatically.

### 3. Configure Supabase for production

Production URL: **https://grip-kitchen.vercel.app**

**Supabase → Authentication → URL Configuration**

- **Site URL:** `https://grip-kitchen.vercel.app`
- **Redirect URLs:** add:
  - `https://grip-kitchen.vercel.app/callback`
  - `http://localhost:8081/callback` (keep for local dev)
  - `gripkitchen://callback` (keep for native)

**Google Cloud Console → OAuth client**

- **Authorized JavaScript origins:** add `https://grip-kitchen.vercel.app`
- **Authorized redirect URIs:** keep `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 4. Verify the deployment

1. Open your Vercel URL.
2. Sign in with Google.
3. Confirm you land in the app and data loads from Supabase.

---

## Workflow summary

| Action | Result |
|--------|--------|
| `npm run web` | Local dev at localhost:8081 |
| `npm run build` + `npm run preview` | Test production build locally |
| `git push` to `main` | Vercel production deploy |
| Open a pull request | Vercel preview deploy |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Check build logs; run `npm run build` locally first |
| Login works locally but not on Vercel | Add Vercel URL to Supabase redirect URLs and Google OAuth origins |
| Blank page after deploy | Confirm env vars are set in Vercel project settings |
| 404 on deep links | `vercel.json` rewrites handle dynamic routes; redeploy after config changes |
