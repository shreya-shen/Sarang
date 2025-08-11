# 🚀 Sarang - Free Deployment Guide

This guide will help you deploy your Sarang application completely free using the best available platforms.

## 📋 Deployment Stack Overview

- **Frontend**: Vercel (Free tier - 100GB bandwidth, unlimited deployments)
- **Backend + Python ML**: Railway (Free tier - $5 credit monthly, sufficient for small apps)
- **Database**: Supabase (Already configured - Free tier includes 2 databases, 50MB storage)
- **File Storage**: Supabase Storage (1GB free)
- **Authentication**: Clerk (Free tier - 10,000 monthly active users)

## 🛠️ Pre-Deployment Checklist

### 1. Prepare Your Environment Variables
Create a list of all environment variables you'll need:

**Backend Environment Variables:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-backend-domain.railway.app/api/spotify/callback
CLIENT_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
PORT=5000
```

**Frontend Environment Variables:**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=https://your-backend-domain.railway.app
```

### 2. Update Package.json Scripts
Ensure your client package.json has the correct build command:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🚀 Step-by-Step Deployment

### Phase 1: Deploy Backend (Railway)

#### 1.1 Setup Railway Account
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub account (recommended)
3. Connect your GitHub repository

#### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your Sarang repository
4. Railway will auto-detect Node.js

#### 1.3 Configure Environment Variables
1. Go to your project dashboard
2. Click "Variables" tab
3. Add all backend environment variables (listed above)
4. **Important**: Set `SPOTIFY_REDIRECT_URI` to your Railway domain

#### 1.4 Configure Build Settings
1. In Railway dashboard, go to "Settings"
2. Under "Build", set:
   - **Root Directory**: Leave empty (uses repository root)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

#### 1.5 Deploy
1. Railway will automatically deploy
2. Monitor the build logs
3. Once deployed, note your Railway domain (e.g., `your-app-name.railway.app`)

### Phase 2: Update Spotify Redirect URI

#### 2.1 Update Spotify App Settings
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Update Redirect URI to: `https://your-railway-domain.railway.app/api/spotify/callback`
5. Save changes

### Phase 3: Deploy Frontend (Vercel)

#### 3.1 Setup Vercel Account
1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub account
3. Import your repository

#### 3.2 Configure Project Settings
1. **Framework Preset**: Vite
2. **Root Directory**: `client`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### 3.3 Add Environment Variables
1. In Vercel dashboard, go to "Settings" → "Environment Variables"
2. Add frontend environment variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_API_URL=https://your-railway-domain.railway.app
   ```

#### 3.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Note your Vercel domain (e.g., `your-app-name.vercel.app`)

### Phase 4: Update Backend CORS and Client URL

#### 4.1 Update Railway Environment Variables
1. Go back to Railway dashboard
2. Update `CLIENT_URL` to your Vercel domain:
   ```
   CLIENT_URL=https://your-vercel-domain.vercel.app
   ```
3. Redeploy the backend

### Phase 5: Configure Clerk Production Settings

#### 5.1 Update Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to "Domains" section
4. Add your production domains:
   - Frontend: `your-vercel-domain.vercel.app`
   - Backend: `your-railway-domain.railway.app`

## 🔧 Alternative Deployment Options

### Option 2: Netlify (Frontend) + Render (Backend)

**Frontend (Netlify):**
1. Connect GitHub repo to Netlify
2. Build settings:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`

**Backend (Render):**
1. Create new Web Service on Render
2. Connect GitHub repo
3. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`

### Option 3: GitHub Pages (Frontend) + Railway (Backend)

**Frontend (GitHub Pages):**
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts:
   ```json
   "homepage": "https://yourusername.github.io/Sarang",
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run `npm run deploy`

## 📊 Free Tier Limitations & Monitoring

### Railway Free Tier
- **$5 monthly credit** (usually sufficient for small apps)
- **Sleep after 30 minutes of inactivity**
- Monitor usage in Railway dashboard

### Vercel Free Tier
- **100GB bandwidth per month**
- **Unlimited deployments**
- **Custom domains supported**

### Supabase Free Tier
- **2 projects**
- **50MB database storage**
- **1GB file storage**
- **50,000 monthly active users**

## 🚨 Important Production Considerations

### 1. Database Migrations
Run your database setup scripts on production:
```bash
# Connect to your production Supabase instance
node create_tables.js
```

### 2. Security Headers
Add security headers to your Express app:
```javascript
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 3. Error Monitoring
Consider adding free error monitoring:
- **Sentry** (free tier: 5,000 errors/month)
- **LogRocket** (free tier: 1,000 sessions/month)

### 4. Performance Monitoring
- **Vercel Analytics** (free for personal projects)
- **Railway Metrics** (built-in)

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions for Automatic Deployment
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🆘 Troubleshooting Common Issues

### Build Failures
1. **Python dependencies**: Ensure `requirements.txt` is in root
2. **Node version**: Specify Node.js version in Railway settings
3. **Memory issues**: Optimize your ML model loading

### CORS Issues
1. Update CORS configuration in your Express app
2. Ensure CLIENT_URL matches your frontend domain exactly

### Spotify Authentication
1. Verify redirect URI matches exactly
2. Check Spotify app settings
3. Ensure HTTPS is used in production

## 📈 Scaling and Upgrades

When you outgrow free tiers:

### Paid Upgrades (All under $20/month)
- **Railway Pro**: $20/month (unlimited usage)
- **Vercel Pro**: $20/month (advanced features)
- **Supabase Pro**: $25/month (8GB storage, 100K users)

### Performance Optimizations
- Implement Redis caching
- Use CDN for static assets
- Optimize database queries
- Implement request rate limiting

---

## 🎯 Quick Deployment Commands

```bash
# 1. Prepare for deployment
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Deploy to Railway (automatic via GitHub connection)
# 3. Deploy to Vercel (automatic via GitHub connection)

# 4. Test deployment
curl https://your-railway-domain.railway.app/api/health
curl https://your-vercel-domain.vercel.app
```

Your Sarang application should now be live and accessible worldwide! 🌍

Remember to monitor your usage and optimize as needed. The free tiers are quite generous for development and small-scale production use.
