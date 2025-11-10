# 🚂 Deploy to Railway - Quick Guide

Railway is perfect for this app! It's simple and includes everything you need.

## 📋 Prerequisites

1. GitHub account
2. Railway account (free - sign up at [railway.app](https://railway.app))

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `AddressCollector` repository
5. Click **"Add variables"** (optional - Railway auto-configures PORT)
6. Click **"Deploy"**

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatically:
   - Creates the database
   - Adds `DATABASE_URL` environment variable
   - Connects it to your app

### Step 4: Switch to PostgreSQL

Your app currently uses SQLite. To use Railway's PostgreSQL:

**Option A: Keep SQLite (simpler, but data may reset on redeploys)**
- No changes needed
- Works immediately
- ⚠️ Data persists but not recommended for production

**Option B: Use PostgreSQL (recommended for production)**

1. Rename the current server:
   ```bash
   mv server.js server-sqlite.js
   mv server-postgres.js server.js
   ```

2. Push changes:
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL"
   git push
   ```

3. Railway will auto-redeploy with PostgreSQL!

### Step 5: Get Your URL

1. In Railway dashboard, click on your app
2. Go to **"Settings"** tab
3. Click **"Generate Domain"**
4. Your app will be live at: `https://your-app.up.railway.app`

## ✅ That's It!

Your app is now live! Users can:
- Scan the QR code at your Railway URL
- Submit their Ethereum addresses
- You can view them in the admin dashboard

## 💰 Pricing

Railway gives you **$5 free credits per month** which is enough for:
- ~300 hours of runtime (always-on for small apps)
- PostgreSQL database included
- Perfect for this use case!

## 🔧 Environment Variables (Optional)

Railway auto-provides:
- `PORT` - Automatically set
- `DATABASE_URL` - Auto-set when you add PostgreSQL

You can add custom variables in Railway dashboard → Settings → Variables

## 📊 Monitoring

Railway dashboard shows:
- Deployment logs
- Database metrics
- Resource usage
- Custom domain setup

## 🆘 Troubleshooting

**Build fails?**
- Check Railway logs in the dashboard
- Ensure all dependencies are in `package.json`

**Database not connecting?**
- Make sure you added PostgreSQL in Railway
- Check that `DATABASE_URL` variable exists
- Ensure you're using `server-postgres.js` (renamed to `server.js`)

**App not accessible?**
- Generate domain in Settings
- Check if deployment succeeded

## 🎉 Next Steps

Once deployed:
1. Test the QR code with your phone
2. Submit a test address
3. Check the admin dashboard
4. Share your Railway URL with users!

## 🔐 Optional: Add Custom Domain

1. Buy a domain (e.g., from Namecheap, Google Domains)
2. In Railway: Settings → Domains → Add custom domain
3. Update your DNS records as shown
4. Done!

---

**Questions?** Check [Railway docs](https://docs.railway.app) or their Discord community.
