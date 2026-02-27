# 🚀 Sarang Music App - Complete Deployment Guide

**Frontend on Vercel + Backend on Railway**

This guide provides step-by-step instructions to deploy your mood-based music recommendation app with split architecture for optimal performance and full Python AI support.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] GitHub account
- [ ] Vercel account (free tier available)
- [ ] Railway account (free tier available)  
- [ ] Supabase project with imported song data
- [ ] Spotify Developer App credentials

## 🏗️ Architecture Overview

```
User Request → Vercel (Frontend) → Railway (Backend + Python AI) → Supabase Database
```

**Benefits:**
- ✅ Global CDN for frontend (fast loading)
- ✅ Full Python AI support on Railway
- ✅ Single domain name for users
- ✅ Automatic HTTPS on both platforms
- ✅ Free tier deployment possible

---

## 🎯 Part 1: Backend Deployment (Railway)

### Step 1: Prepare Your Repository

1. **Commit and Push Latest Changes**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

### Step 2: Deploy to Railway

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign up/Login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `Sarang` repository
   - Railway will auto-detect Node.js + Python

3. **Configure Environment Variables**
   
   Go to your project → Variables tab → Add these:

   ```bash
   # Supabase Database (Your NEW project)
   SUPABASE_URL=https://your-new-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Spotify API
   SPOTIFY_CLIENT_ID=2a71acd176dd4d9babf0a2efc83a58e8
   SPOTIFY_CLIENT_SECRET=3d6476f474d24c9eb4968890909ff5c8
   SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback
   
   # App Configuration
   CLIENT_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=5000
   
   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=pk_test_Y2l2aWwtZG9iZXJtYW4tMTAuY2xlcmsuYWNjb3VudHMuZGV2JA
   CLERK_SECRET_KEY=sk_test_zO1oRnvYc4f8JfDMqySYHfLvWL9Zi9ejRBh96DbKzV
   ```

   **⚠️ Important Notes:**
   - Replace `your-new-project.supabase.co` with your actual Supabase URL
   - Replace `your-app.vercel.app` with your actual Vercel domain (you'll get this in Part 2)
   - Update `SPOTIFY_REDIRECT_URI` after getting your Vercel domain

4. **Deploy Backend**
   - Railway automatically builds and deploys
   - Wait for deployment to complete (~3-5 minutes)
   - Note your Railway backend URL: `https://your-app-production-xxxx.up.railway.app`

5. **Verify Backend Deployment**
   - Visit: `https://your-railway-url.up.railway.app/api/health`
   - Should return: `{"status":"healthy","timestamp":...}`

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Update Vercel Configuration

Your `vercel.json` is already configured to proxy API calls to Railway. Just update the Railway URL:

1. **Edit vercel.json**
   - Replace `sarang-production.up.railway.app` with your actual Railway domain
   - Commit and push changes

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your `Sarang` repository
   - Vercel will auto-detect it as a Vite project

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `cd client && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables (Optional)**
   
   Add these in Vercel dashboard → Settings → Environment Variables:

   ```bash
   # Only needed if your frontend uses them directly
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2l2aWwtZG9iZXJtYW4tMTAuY2xlcmsuYWNjb3VudHMuZGV2JA
   ```

5. **Deploy Frontend**
   - Click "Deploy"
   - Wait for deployment (~2-3 minutes)
   - Note your Vercel domain: `https://your-app-xxx.vercel.app`

---

## 🔗 Part 3: Connect Frontend and Backend

### Step 1: Update Railway Environment Variables

Now that you have your Vercel domain, update Railway variables:

1. **Go to Railway Dashboard → Your Project → Variables**
2. **Update these variables:**
   ```bash
   CLIENT_URL=https://your-actual-vercel-domain.vercel.app
   SPOTIFY_REDIRECT_URI=https://your-actual-vercel-domain.vercel.app/api/spotify/callback
   ```

3. **Railway will automatically redeploy**

### Step 2: Update vercel.json with Actual Railway URL

1. **Edit vercel.json:**
   ```json
   "rewrites": [
     {
       "source": "/api/(.*)",
       "destination": "https://your-actual-railway-domain.up.railway.app/api/$1"
     }
   ]
   ```

2. **Commit and push changes**
   ```bash
   git add vercel.json
   git commit -m "Update API proxy to Railway backend"
   git push origin main
   ```

3. **Vercel will automatically redeploy**

---

## 🎵 Part 4: Configure Spotify App

### Update Spotify Developer Dashboard

1. **Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**
2. **Select your app**
3. **Edit Settings → Redirect URIs**
4. **Add your production callback URL:**
   ```
   https://your-vercel-domain.vercel.app/api/spotify/callback
   ```
5. **Save changes**

---

## ✅ Part 5: Testing and Verification

### Backend Testing

1. **Health Check**
   ```bash
   curl https://your-railway-domain.up.railway.app/api/health
   ```
   Expected: `{"status":"healthy",...}`

2. **Database Connection**
   ```bash
   curl https://your-railway-domain.up.railway.app/api/database/status
   ```
   Should show Supabase connection status

### Frontend Testing

1. **Visit your Vercel domain**
   - Should load the homepage
   - No console errors
   - Images and assets loading

2. **Test API Proxy**
   - Open developer tools → Network tab
   - Navigate around the app
   - API calls should go to `/api/*` and work properly

### Full Integration Testing

1. **User Registration**
   - Sign up with Clerk authentication
   - Should create profile in Supabase

2. **Spotify Authentication**
   - Connect Spotify account in settings
   - Should redirect properly and store tokens

3. **Mood Analysis**
   - Submit a mood text
   - Should get recommendations from Python AI service
   - Should use songs from Supabase database

4. **Playlist Creation**
   - Export recommendations to Spotify
   - Should create playlist in user's Spotify account

---

## 🔧 Troubleshooting

### Common Issues

**❌ API calls failing (404/500 errors)**
- Check Railway backend is running
- Verify vercel.json has correct Railway URL
- Check Railway logs for backend errors

**❌ Spotify authentication not working**
- Verify redirect URI in Spotify dashboard
- Check SPOTIFY_REDIRECT_URI in Railway environment
- Ensure CLIENT_URL points to Vercel domain

**❌ No song recommendations**
- Verify Supabase has imported song data
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway
- Test database connection endpoint

**❌ Build failures**
- Check build logs in Railway/Vercel dashboards
- Verify package.json scripts are correct
- Ensure all environment variables are set

### Debug Commands

```bash
# Check Railway deployment logs
railway logs

# Check Vercel deployment logs
vercel logs

# Test backend directly
curl https://your-railway-domain.up.railway.app/api/health

# Test frontend build locally
cd client && npm run build
```

---

## 🎯 Optimization Tips

### Performance
- ✅ Images are lazy-loaded (already configured)
- ✅ Code splitting implemented (chunks < 600KB)
- ✅ Static assets cached for 1 year
- ✅ Database queries use indexes

### Cost Optimization
- ✅ Frontend on Vercel free tier (global CDN)
- ✅ Backend on Railway free tier (500 hours/month)
- ✅ Supabase free tier (500MB database)
- ✅ No additional costs for basic usage

### Scaling
- **Frontend**: Automatic with Vercel's global CDN
- **Backend**: Railway auto-scaling based on usage
- **Database**: Supabase connection pooling

---

## 🎉 Deployment Complete!

Your Sarang music app is now live with:

- **🌐 Frontend**: Fast global CDN via Vercel
- **🖥️ Backend**: Full Node.js + Python support via Railway  
- **🗄️ Database**: High-performance Supabase with 50k+ songs
- **🎵 AI**: Advanced mood analysis with song recommendations
- **🔐 Auth**: Secure user management with Clerk
- **🎶 Spotify**: Full integration for playlist creation

**App URL**: `https://your-vercel-domain.vercel.app`

Users can now:
1. Sign up and authenticate
2. Connect their Spotify accounts
3. Get AI-powered mood-based music recommendations  
4. Export personalized playlists to Spotify
5. Track their mood and music history

**Your mood-based music therapy platform is ready for users!** 🎵✨
