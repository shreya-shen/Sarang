# 🚀 Sarang - Free Deployment Guide

A complete step-by-step guide to deploy your AI-powered music therapy platform for free using modern cloud services.

## 📋 Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] GitHub account (free)
- [ ] Vercel account (free) 
- [ ] Railway account (free)
- [ ] Supabase account (free)
- [ ] Clerk account (free)
- [ ] Spotify Developer account (free)
- [ ] Git installed on your machine

## 🏗️ Project Architecture Overview

```
Frontend (React) → Vercel (Free)
Backend (Node.js) → Railway (Free)
Database → Supabase (Free)
ML Service (Python) → Railway (Free)
Auth → Clerk (Free)
Music API → Spotify Web API (Free)
```

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → "Sign in with GitHub"
3. Click "New Project"
4. Choose organization, enter project name: `sarang-db`
5. Enter database password (save it securely)
6. Select region closest to your users
7. Click "Create new project"

### 1.2 Setup Database Schema
1. In your Supabase dashboard, go to "SQL Editor"
2. Create a new query and run the following schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spotify_user_id TEXT,
  preferred_genres TEXT[],
  energy_preference DECIMAL(3,2),
  valence_preference DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood analysis history
CREATE TABLE mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text_input TEXT NOT NULL,
  sentiment_score DECIMAL(3,2) NOT NULL,
  mood_classification TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood_analysis_id UUID REFERENCES mood_history(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT,
  playlist_name TEXT NOT NULL,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can manage own mood history" ON mood_history
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can manage own playlists" ON playlists
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));
```

### 1.3 Get Database Credentials
1. Go to "Settings" → "API"
2. Copy and save these values:
   - Project URL
   - Project API Key (anon public)
   - Project API Key (service_role) - keep this secret

## 🔐 Step 2: Authentication Setup (Clerk)

### 2.1 Create Clerk Application
1. Go to [clerk.com](https://clerk.com)
2. Sign in with GitHub
3. Click "Add Application"
4. Enter application name: "Sarang"
5. Choose authentication options:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ GitHub (optional)
6. Click "Create Application"

### 2.2 Configure Clerk Settings
1. In your Clerk dashboard, go to "User & Authentication" → "Email, Phone, Username"
2. Ensure "Email address" is required
3. Go to "Sessions" → set session timeout to 7 days
4. Go to "Domains" → add your future Vercel domain (you'll get this later)

### 2.3 Get Clerk Keys
1. Go to "API Keys"
2. Copy and save:
   - Publishable Key
   - Secret Key

## 🎵 Step 3: Spotify API Setup

### 3.1 Create Spotify App
1. Go to [developer.spotify.com](https://developer.spotify.com)
2. Log in with your Spotify account
3. Go to "Dashboard" → "Create an App"
4. Fill in:
   - App Name: "Sarang Music Therapy"
   - App Description: "AI-powered music therapy platform"
   - Website: "https://your-app-name.vercel.app" (placeholder)
   - Redirect URI: "https://your-app-name.vercel.app/auth/callback"
5. Check the boxes and click "Create"

### 3.2 Get Spotify Credentials
1. In your Spotify app dashboard:
   - Copy Client ID
   - Copy Client Secret (click "Show Client Secret")
2. Click "Edit Settings"
3. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://your-app-name.vercel.app/auth/callback` (for production)

## 🚂 Step 4: Backend Deployment (Railway)

### 4.1 Prepare Backend for Deployment
1. Create a `Dockerfile` in your `server` folder:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

WORKDIR /app/server

EXPOSE 5000

CMD ["npm", "start"]
```

2. Create a `railway.toml` in your project root:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "cd server && npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 4.2 Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `Sarang` repository
5. Choose "Deploy Now"

### 4.3 Configure Railway Environment Variables
1. In Railway dashboard, go to your project
2. Click on your service → "Variables"
3. Add these environment variables:

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_KEY=<your-supabase-service-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
SPOTIFY_REDIRECT_URI=https://your-railway-app.railway.app/auth/callback
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 4.4 Setup Custom Domain (Optional)
1. In Railway, go to "Settings" → "Domains"
2. You'll get a free `.railway.app` domain
3. Copy this URL - you'll need it for frontend configuration

## 🤖 Step 5: Python ML Service Deployment (Railway)

### 5.1 Create Separate Railway Service for Python
1. In your Railway project, click "New Service"
2. Choose "Empty Service"
3. Connect to the same GitHub repo
4. Set root directory to `server/python`

### 5.2 Create Python Dockerfile
Create `server/python/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download required models
RUN python -c "
import nltk
nltk.download('punkt')
nltk.download('stopwords')
from transformers import AutoTokenizer, AutoModelForSequenceClassification
AutoTokenizer.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest')
AutoModelForSequenceClassification.from_pretrained('cardiffnlp/twitter-roberta-base-sentiment-latest')
"

# Copy source code
COPY . .

EXPOSE 5001

CMD ["python", "start_production_service.py"]
```

### 5.3 Configure Python Service Environment Variables
Add to your Python Railway service:

```
PORT=5001
PYTHONPATH=/app
TRANSFORMERS_CACHE=/tmp/transformers_cache
```

## 🌐 Step 6: Frontend Deployment (Vercel)

### 6.1 Prepare Frontend for Deployment
1. Update `client/.env.production`:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
VITE_API_URL=<your-railway-backend-url>
VITE_SPOTIFY_CLIENT_ID=<your-spotify-client-id>
```

2. Update `vercel.json` in project root:

```json
{
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-railway-app.railway.app/api/$1"
    }
  ]
}
```

### 6.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `Sarang` repository
5. Configure project:
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 6.3 Configure Vercel Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
VITE_API_URL=<your-railway-backend-url>
VITE_SPOTIFY_CLIENT_ID=<your-spotify-client-id>
```

## 🔗 Step 7: Connect All Services

### 7.1 Update Spotify Redirect URIs
1. Go to your Spotify Developer Dashboard
2. Edit your app settings
3. Update Redirect URIs:
   - Add: `https://your-vercel-app.vercel.app/auth/callback`
   - Add: `https://your-railway-app.railway.app/auth/callback`

### 7.2 Update Clerk Domains
1. In Clerk dashboard → "Domains"
2. Add your production domains:
   - `https://your-vercel-app.vercel.app`

### 7.3 Configure CORS
Update your backend to allow your frontend domain:

```javascript
// In your server/app.js
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'http://localhost:3000'  // for development
  ],
  credentials: true
}));
```

## 🧪 Step 8: Testing Deployment

### 8.1 Test Each Service
1. **Database**: Test connection from Railway backend
2. **Authentication**: Try signing up/in through Vercel frontend
3. **ML Service**: Test sentiment analysis API endpoint
4. **Spotify Integration**: Test music search and playlist creation

### 8.2 End-to-End Testing
1. Visit your Vercel URL
2. Sign up with a new account
3. Enter a mood text
4. Verify sentiment analysis works
5. Check if playlist generation works
6. Test mood history functionality

## 🚀 Step 9: Final Optimizations

### 9.1 Performance Optimizations
1. **Enable Vercel Analytics** (free)
2. **Configure Railway Health Checks**
3. **Set up Supabase Connection Pooling**
4. **Enable ML Model Caching**

### 9.2 Monitoring Setup
1. **Railway Logs**: Monitor backend performance
2. **Vercel Analytics**: Track frontend usage
3. **Supabase Logs**: Monitor database queries
4. **Clerk Analytics**: Track authentication metrics

## 💰 Free Tier Limits

### Vercel (Frontend)
- ✅ Unlimited static deployments
- ✅ 100GB bandwidth/month
- ✅ Custom domain
- ✅ SSL certificates

### Railway (Backend)
- ✅ $5/month credit (covers small apps)
- ✅ 512MB RAM
- ✅ 1GB storage
- ✅ Custom domain

### Supabase (Database)
- ✅ 2 projects
- ✅ 500MB database space
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users

### Clerk (Authentication)
- ✅ 10,000 monthly active users
- ✅ Unlimited applications
- ✅ Basic authentication features

### Spotify API
- ✅ 100 API calls per second
- ✅ Unlimited for personal use

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure backend CORS is configured with frontend domain
   - Check Clerk domain configuration

2. **Build Failures**
   - Verify all environment variables are set
   - Check Node.js version compatibility

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies

4. **ML Service Errors**
   - Ensure Python dependencies are installed
   - Check model loading and caching

5. **Spotify API Issues**
   - Verify redirect URIs match exactly
   - Check client ID and secret

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)

## ✅ Post-Deployment Checklist

- [ ] All services are running without errors
- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] Database queries execute successfully
- [ ] ML sentiment analysis returns results
- [ ] Spotify integration functions properly
- [ ] All environment variables are configured
- [ ] Custom domains are set up (optional)
- [ ] SSL certificates are active
- [ ] Performance monitoring is enabled

---

🎉 **Congratulations!** Your Sarang AI music therapy platform is now live and accessible to users worldwide, completely free!

For support or questions, refer to the documentation of each service or create issues in your GitHub repository.
