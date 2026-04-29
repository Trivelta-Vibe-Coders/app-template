# Trivelta Vibe Coders Hackathon

Welcome to the hackathon! This template gives you a pre-configured setup for deploying to Railway.

## Quick Start

### 1. Create Your Repo

Click **"Use this template"** (green button, top-right) to create your own repo in the Trivelta-Vibe-Coders org.

Name it whatever you want.

### 2. Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard) (make sure you're in the **Trivelta Vibe Coders** workspace)
2. Click **New Project** > **Deploy from GitHub Repo**
3. Select your new repo
4. Railway will auto-detect your stack and deploy

### 3. Get a Public URL

Once deployed, go to your service in Railway:
- Click **Settings** > **Networking** > **Generate Domain**
- You'll get a public `*.up.railway.app` URL

### 4. Push to Deploy

Every push to `main` triggers an automatic redeploy. Just:

```bash
git add .
git commit -m "my changes"
git push origin main
```

## Adding a Database

In your Railway project dashboard:
1. Click **+ New** > **Database**
2. Pick one: **Postgres**, **MySQL**, **Redis**, or **MongoDB**
3. Railway auto-injects connection variables into your service — check the **Variables** tab

## Environment Variables

### Via Dashboard

- Go to your service in Railway > **Variables** tab
- Add any env vars your app needs (API keys, secrets, etc.)

### Via CLI

Install the Railway CLI and link to your project:

```bash
npm install -g @railway/cli
railway login
railway link
```

Then set variables from the command line:

```bash
railway variable set SECRET_KEY=my-secret-value
railway variable set DB_PASSWORD=abc123 API_KEY=xyz789
```

Variables are available as `process.env.VAR_NAME` (Node), `os.environ["VAR_NAME"]` (Python), etc.

## What Can I Build?

Anything! Railway auto-detects most stacks via [Nixpacks](https://nixpacks.com):

- **Node.js** (Express, Next.js, React, etc.)
- **Python** (Flask, FastAPI, Django, Streamlit)
- **Go**, **Rust**, **Ruby**, **Java**, and more

Just make sure your project has the right entry point file (`package.json`, `requirements.txt`, `main.go`, etc.) and Railway handles the rest.

## Troubleshooting

- **Build failed?** Check the build logs in Railway dashboard — click on the failed deployment
- **App crashes?** Check deploy logs. Make sure your app listens on `process.env.PORT` (Railway assigns the port dynamically)
- **Can't see your repo in Railway?** Make sure you created it in the **Trivelta-Vibe-Coders** org, not your personal account

## Need Help?

Grab someone from the hackathon team or check the [Railway docs](https://docs.railway.com).
