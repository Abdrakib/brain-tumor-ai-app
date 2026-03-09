# Deployment Guide — Render + Vercel

This guide walks you through deploying the Brain MRI AI app to Render (backend) and Vercel (frontend) using **this repository only** — no portfolio or other projects.

---

## 1. Push this repo to GitHub

If you haven't already:
```bash
git remote add brain-app https://github.com/Abdrakib/brain-tumor-ai-app.git
git branch -M main
git push -u brain-app main
```

---

## 2. Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New** → **Web Service**
3. Connect your GitHub account and select the **brain-tumor-ai-app** repository
4. Configure:
   - **Name:** `brain-mri-api` (or any name)
   - **Region:** Choose nearest to users
   - **Branch:** `main`
   - **Root Directory:** Leave **empty** (repo root)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

   Or use the [Blueprint](https://render.com/docs/blueprint-spec) — Render will auto-detect `render.yaml`.

5. Click **Create Web Service**
6. Wait for deployment. Once live, copy your **Backend URL** (e.g. `https://brain-mri-api-xxxx.onrender.com`)

---

## 3. Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. Import the **brain-tumor-ai-app** repository
4. Configure:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** Click **Edit** → set to `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Environment Variables:** Add:
     - **Name:** `VITE_API_URL`
     - **Value:** Your Render backend URL (e.g. `https://brain-mri-api-xxxx.onrender.com`)
     - Apply to Production, Preview, Development

5. Click **Deploy**
6. Once deployed, copy your **Frontend URL** (e.g. `https://brain-tumor-ai-app.vercel.app`)

---

## 4. Update README

Edit `README.md` and replace:
- `YOUR_VERCEL_FRONTEND_URL` → your actual Vercel URL
- `YOUR_RENDER_API_URL` → your actual Render URL

Commit and push:
```bash
git add README.md
git commit -m "Update deployment URLs"
git push brain-app main
```

---

## 5. Switch existing portfolio deployments to this repo

If you already have Render and Vercel services pointing at your portfolio repo (AI_ML-Portfolio) and want them to serve the brain app from this clean repo instead:

**Render**
1. Open your existing brain-mri-api (or portfolio) Web Service
2. **Settings** → **Build & Deploy**
3. **Repository** → **Connect repository** → Choose **brain-tumor-ai-app**
4. **Root Directory:** Leave empty
5. **Build / Start:** Keep `pip install -r requirements.txt` and `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Save** — Render will redeploy from the new repo

**Vercel**
1. Open your existing brain app project (or create new)
2. **Settings** → **Git**
3. Change connected repository to **brain-tumor-ai-app**
4. **Root Directory:** `frontend`
5. **Environment Variables:** Set `VITE_API_URL` to your Render backend URL
6. **Redeploy** from the Deployments tab

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Model not loading | Ensure `models/v1/adv_final_tfhub.keras` and `label_to_idx.json` are committed |
| CORS errors | Backend has `allow_origins=["*"]` — verify frontend URL is correct |
| Cold start | Render free tier spins down after inactivity; first request may take 30–60s |
| Frontend 404 on API | Ensure `VITE_API_URL` in Vercel matches your Render URL exactly (no trailing slash) |
