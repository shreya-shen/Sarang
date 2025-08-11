# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] All code committed and pushed to GitHub
- [ ] Environment variables documented
- [ ] Database is accessible (Supabase)
- [ ] Spotify App configured
- [ ] Clerk project set up

## Railway Backend Deployment
- [ ] Railway account created
- [ ] Project connected to GitHub repo
- [ ] Environment variables set:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] SUPABASE_ANON_KEY
  - [ ] CLERK_PUBLISHABLE_KEY
  - [ ] CLERK_SECRET_KEY
  - [ ] SPOTIFY_CLIENT_ID
  - [ ] SPOTIFY_CLIENT_SECRET
  - [ ] SPOTIFY_REDIRECT_URI (update after deployment)
  - [ ] NODE_ENV=production
  - [ ] PORT=5000
- [ ] Build succeeds
- [ ] Health check accessible: `https://your-app.railway.app/api/health`

## Vercel Frontend Deployment
- [ ] Vercel account created
- [ ] Project connected to GitHub repo
- [ ] Build settings configured:
  - [ ] Framework: Vite
  - [ ] Root Directory: client
  - [ ] Build Command: npm run build
  - [ ] Output Directory: dist
- [ ] Environment variables set:
  - [ ] VITE_CLERK_PUBLISHABLE_KEY
  - [ ] VITE_API_URL (Railway backend URL)
- [ ] Build succeeds
- [ ] Site accessible

## Post-Deployment Configuration
- [ ] Update Railway CLIENT_URL with Vercel domain
- [ ] Update Spotify redirect URI with Railway domain
- [ ] Update Clerk domains with both frontend and backend URLs
- [ ] Test full authentication flow
- [ ] Test Spotify integration
- [ ] Test mood analysis and recommendations
- [ ] Monitor for any CORS issues

## Testing Checklist
- [ ] User registration works
- [ ] User login works
- [ ] Spotify connection works
- [ ] Mood analysis returns results
- [ ] Playlist creation works
- [ ] Music playback works (if Spotify Premium)

## Monitoring Setup
- [ ] Check Railway usage dashboard
- [ ] Check Vercel usage dashboard
- [ ] Set up uptime monitoring (optional)
- [ ] Configure error alerts (optional)

---

**Estimated Total Deployment Time: 30-45 minutes**

🎯 **Priority Order:**
1. Deploy backend to Railway (most complex)
2. Update environment variables
3. Deploy frontend to Vercel
4. Configure external services
5. Test everything
