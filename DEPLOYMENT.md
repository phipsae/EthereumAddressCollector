# Deployment Guide

## 🚀 Vercel Deployment (with Cloud Database)

Vercel is serverless, so SQLite won't work. Use one of these database options:

### **Option 1: Vercel Postgres** (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Add Vercel Postgres:**
   - Go to your project dashboard on vercel.com
   - Click "Storage" tab
   - Click "Create Database" → "Postgres"
   - Follow setup instructions
   - Environment variable `POSTGRES_URL` will be auto-added

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

**Cost:** Free tier includes 256 MB storage, 60 hours compute time/month

---

### **Option 2: Supabase (Free Postgres)**

1. **Create Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get connection string from Settings → Database

2. **Add to Vercel:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `POSTGRES_URL` with your Supabase connection string

3. **Deploy:**
   ```bash
   vercel --prod
   ```

**Cost:** Free tier includes 500 MB database, unlimited API requests

---

### **Option 3: Railway (PostgreSQL included)**

Railway is actually easier than Vercel for this use case:

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Click "Add PostgreSQL" 
5. Railway auto-connects database
6. Done! ✅

**Cost:** Free $5 credit/month (enough for small projects)

---

## 📦 Other Hosting Options

### **Render.com** (Easiest - includes free database)

1. Go to [render.com](https://render.com)
2. Create "New Web Service" from GitHub
3. Add PostgreSQL database (free tier available)
4. Environment variables auto-configured
5. Uses `server-postgres.js` automatically

**Cost:** Free tier available (spins down after inactivity)

---

### **DigitalOcean App Platform**

1. Go to [digitalocean.com](https://digitalocean.com)
2. Create "App" from GitHub
3. Add managed PostgreSQL database
4. Configure environment variables

**Cost:** $5/month for app, $15/month for database

---

## 🗄️ Database Comparison

| Service | Database Type | Free Tier | Best For |
|---------|--------------|-----------|----------|
| **Railway** | PostgreSQL | $5/month credit | Easiest deployment |
| **Render** | PostgreSQL | 90 days free | Simple hosting |
| **Vercel + Supabase** | PostgreSQL | 500 MB | Serverless apps |
| **Fly.io** | SQLite (keep current) | 3GB storage | Full control |

---

## 🎯 Recommended: Railway

**Why Railway is best for your use case:**
- ✅ Automatic PostgreSQL database
- ✅ Zero configuration needed
- ✅ Free $5/month credit
- ✅ Keeps SQLite code (can switch to Postgres easily)
- ✅ Always-on (no cold starts)
- ✅ Simple GitHub integration

**Quick Deploy to Railway:**

1. Push to GitHub
2. Visit [railway.app](https://railway.app)
3. "New Project" → "Deploy from GitHub"
4. Click "Add PostgreSQL"
5. Railway detects Node.js and deploys automatically

**If using Railway with current SQLite:** It will work but data resets on redeploy. Better to switch to their PostgreSQL.

---

## 🔄 Switching to PostgreSQL

To use PostgreSQL version (for Vercel/Railway/Render):

1. **Install pg dependency:**
   ```bash
   npm install pg
   ```

2. **Rename files:**
   ```bash
   mv server.js server-sqlite.js
   mv server-postgres.js server.js
   ```

3. **Set environment variable:**
   ```bash
   export POSTGRES_URL="your-database-connection-string"
   ```

4. **Deploy!**

---

## 🛡️ Security Notes for Production

Before going live, add:

- **Admin authentication** (password protect /admin)
- **Rate limiting** (prevent spam)
- **HTTPS** (all platforms provide this)
- **Environment variables** for sensitive config
- **Database backups** (most platforms include this)

---

## 📞 Support

Choose based on your needs:
- **Just starting?** → Railway
- **Need serverless?** → Vercel + Supabase
- **Want simplicity?** → Render
- **Need control?** → Fly.io with SQLite

