# Render Deployment Guide

Complete guide to deploy the LinkedIn Intelligence API to Render.com

---

## Prerequisites

✅ GitHub repository pushed to `fleetconnect/linkedin`
✅ Render account (free at render.com)
✅ Anthropic API key
✅ Perplexity API key (optional, for research features)

---

## Option 1: Automated Deployment (Recommended)

We've created a `render.yaml` that automates the entire setup.

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Deploy from Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository: `fleetconnect/linkedin`
3. Select branch: `main` or `claude/classify-reply-intent-I3wT0`
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

### Step 3: Set Secret Environment Variables
After deployment starts, go to each service:

**For `linkedin-api` service:**
1. Go to **Environment** tab
2. Add these secret variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   PERPLEXITY_API_KEY=pplx-...
   ```
3. Click **"Save Changes"**
4. Service will auto-redeploy with new variables

### Step 4: Wait for Deployment
- Database: ~2-3 minutes
- API Service: ~5-7 minutes
- You'll see build logs in real-time

### Step 5: Get Your API URL
After deployment completes:
```
https://linkedin-api.onrender.com
```

Test it:
```bash
curl https://linkedin-api.onrender.com/api/health
```

---

## Option 2: Manual Deployment

If you prefer manual setup or need custom configuration:

### Step 1: Create PostgreSQL Database
1. **New +** → **PostgreSQL**
2. Settings:
   - Name: `linkedin-outreach-db`
   - Database: `linkedin_outreach`
   - User: `linkedin_user`
   - Region: Choose closest to you
   - Plan: **Free**
3. Click **Create Database**
4. **Copy the Internal Database URL** (starts with `postgresql://`)

### Step 2: Create Web Service
1. **New +** → **Web Service**
2. Connect repository:
   - Repository: `fleetconnect/linkedin`
   - Branch: `main` or your branch
3. Settings:
   - Name: `linkedin-api`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: (leave empty)
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**

### Step 3: Configure Environment Variables
Add these in the **Environment** tab:

**Required:**
```bash
NODE_ENV=production
PORT=3000
STORAGE_TYPE=postgres
DATABASE_URL=<paste Internal Database URL from Step 1>
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Optional (Recommended):**
```bash
PERPLEXITY_API_KEY=pplx-...
DB_POOL_MAX=20
CONFIDENCE_THRESHOLD=0.7
RESEARCH_MODEL=sonar-pro
RESEARCH_TIMEOUT=30000
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_TEMPERATURE=0.7
CLAUDE_MAX_TOKENS=4096
CLAUDE_CLASSIFICATION_MODEL=claude-3-5-sonnet-20241022
CLAUDE_CLASSIFICATION_TEMPERATURE=0.3
CLAUDE_CLASSIFICATION_MAX_TOKENS=500
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for build to complete (~5-7 minutes)
3. Service will auto-start after successful build

---

## Post-Deployment Setup

### 1. Run Database Migrations
Render will automatically run migrations on first deploy via the build command.

To manually run migrations:
1. Go to **Shell** tab in your web service
2. Run:
```bash
npm run db:migrate
```

### 2. Verify Deployment

**Health Check:**
```bash
curl https://your-app.onrender.com/api/health
# {"status":"ok","timestamp":"..."}
```

**Check Database Connection:**
Look for this in deploy logs:
```
📦 Initializing postgres storage...
✅ Database connected: 2025-12-22 ...
✅ PostgreSQL storage initialized
🚀 LinkedIn Intent Classifier API running on port 3000
```

**Create Test Campaign:**
```bash
curl -X POST https://your-app.onrender.com/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test Campaign",
    "messaging_rules": {
      "personalization": true,
      "maxMessagesPerDay": 10,
      "researchRequired": false,
      "toneOfVoice": "professional"
    }
  }'
```

### 3. Get Your API URL

Your production API is now available at:
```
https://linkedin-api-xyz.onrender.com
```

Use this URL in:
- n8n HTTP Request nodes
- HeyReach webhook configurations
- Any external integrations

---

## Update n8n Configuration

Replace `http://localhost:3000` with your Render URL:

**Before (local):**
```
http://localhost:3000/api/leads
```

**After (production):**
```
https://linkedin-api-xyz.onrender.com/api/leads
```

---

## Monitoring & Logs

### View Logs
1. Go to your web service in Render
2. Click **"Logs"** tab
3. Real-time logs appear here

### Metrics
1. Click **"Metrics"** tab
2. See CPU, Memory, Request volume

### Database Metrics
1. Go to your PostgreSQL database
2. Click **"Metrics"** tab
3. See connection count, query performance

---

## Free Tier Limits

**PostgreSQL (Free):**
- 256 MB storage
- 97 connection hours/month
- Expires after 90 days of inactivity

**Web Service (Free):**
- 750 hours/month
- Spins down after 15 minutes of inactivity
- Spins up on first request (~30 second cold start)

**Upgrade if needed:**
- Starter ($7/month): Always-on, no cold starts
- Standard ($25/month): More resources

---

## Troubleshooting

### Build Fails
**Error:** `npm install` fails
**Solution:** Check `package.json` is committed to git

**Error:** `tsc` fails
**Solution:** Fix TypeScript errors locally first

### Database Connection Fails
**Error:** `connect ECONNREFUSED`
**Solution:**
- Verify `DATABASE_URL` is set correctly
- Check database is in same region as web service
- Use **Internal Database URL**, not External

### API Doesn't Respond
**Error:** 404 on all routes
**Solution:**
- Check start command is `npm start`
- Verify build created `dist/` folder
- Check logs for startup errors

### Classification Not Working
**Error:** "Invalid API key"
**Solution:**
- Add `ANTHROPIC_API_KEY` to environment variables
- Restart service after adding env vars

---

## CI/CD (Auto-Deploy)

Render automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push:
```bash
git add .
git commit -m "Your changes"
git push origin main
```
3. Render detects the push
4. Automatically builds and deploys
5. Zero-downtime deployment

---

## Rollback

If deployment fails:

1. Go to **"Deploys"** tab
2. Find last working deploy
3. Click **"..."** → **"Redeploy"**
4. Service reverts to that version

---

## Security

### Environment Variables
- ✅ API keys stored securely in Render
- ✅ Not visible in logs
- ✅ Not committed to git
- ✅ SSL/HTTPS by default

### Database
- ✅ Encrypted connections
- ✅ Internal-only access (web service → DB)
- ✅ No public internet exposure

---

## Cost Optimization

**Free Tier Strategy:**
- Use for development/testing
- Accepts 15-min spin-down delay
- Upgrade before production launch

**Production Strategy:**
- Starter plan: $7/month (no cold starts)
- Background workers: Separate service
- Scheduled tasks: Use n8n instead of cron

---

## Next Steps

✅ Deploy to Render
✅ Update n8n with production URL
✅ Configure HeyReach webhooks
✅ Test end-to-end workflow
✅ Monitor logs for first 24 hours
⏳ Add custom domain (optional)
⏳ Set up monitoring alerts (optional)

---

## Support

**Render Docs:** https://render.com/docs
**API Docs:** See `docs/api-reference.md`
**Database Guide:** See `docs/database-migration.md`

---

Your API is now production-ready on Render! 🚀
