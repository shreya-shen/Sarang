# 📋 Complete Guide: Restoring Spotify URI After ngrok Restart

When ngrok restarts, you get a new URL and need to update your Spotify app configuration. Here's a comprehensive guide to handle this situation:

## **🔄 The Problem**
- ngrok free tier gives you a **random URL** each time: `https://abc123.ngrok.io`
- Spotify only accepts **pre-registered redirect URIs**
- When ngrok restarts, you get a **new URL** and Spotify integration breaks

## **🛠️ Solution: Quick Recovery Steps**

### **Step 1: Get Your New ngrok URL**
```bash
# Start ngrok (this gives you a new URL)
ngrok http 5000
```

**Copy the new URL** from ngrok output:
```
Forwarding    https://xyz789.ngrok.io -> http://localhost:5000
```

### **Step 2: Update Spotify App Settings**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your **"Sarang"** app
3. Click **"Edit Settings"**
4. In **"Redirect URIs"**, replace the old ngrok URL with the new one:
   ```
   OLD: https://abc123.ngrok.io/api/spotify/callback
   NEW: https://xyz789.ngrok.io/api/spotify/callback
   ```
5. Click **"Save"**

### **Step 3: Update Your .env File**
```properties
# Update this line in server/.env
SPOTIFY_REDIRECT_URI=https://xyz789.ngrok.io/api/spotify/callback
```

### **Step 4: Update CORS Settings (if needed)**
Update `server/app.js` if you have hardcoded URLs:
```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:8080',
    'https://xyz789.ngrok.io'  // ← Update this
  ],
  credentials: true
}));
```

### **Step 5: Restart Your Server**
```bash
# In server directory
npm start
```

## **⚡ Quick Recovery Script**

Create a batch file to automate this process:

### **Windows: `restart-ngrok.bat`**
```batch
@echo off
echo 🔄 Restarting ngrok and updating configuration...

echo 📋 Please follow these steps:
echo 1. Copy the new ngrok URL from the terminal
echo 2. Update Spotify app settings at https://developer.spotify.com/dashboard
echo 3. Update the SPOTIFY_REDIRECT_URI in .env file
echo 4. Restart your server

echo.
echo 🚀 Starting ngrok on port 5000...
ngrok http 5000
```

### **PowerShell: `restart-ngrok.ps1`**
```powershell
Write-Host "🔄 Restarting ngrok and updating configuration..." -ForegroundColor Yellow

Write-Host "📋 Manual steps required:" -ForegroundColor Cyan
Write-Host "1. Copy the new ngrok URL from below"
Write-Host "2. Update Spotify app at https://developer.spotify.com/dashboard"
Write-Host "3. Update SPOTIFY_REDIRECT_URI in .env file"
Write-Host "4. Restart your server"

Write-Host ""
Write-Host "🚀 Starting ngrok on port 5000..." -ForegroundColor Green
ngrok http 5000
```

## **🔧 Environment Configuration Helper**

Create a helper script to update your .env file:

### **`update-env.js`**
```javascript
const fs = require('fs');
const path = require('path');

function updateEnvFile(newNgrokUrl) {
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the SPOTIFY_REDIRECT_URI line
  const newRedirectUri = `${newNgrokUrl}/api/spotify/callback`;
  envContent = envContent.replace(
    /SPOTIFY_REDIRECT_URI=.*/,
    `SPOTIFY_REDIRECT_URI=${newRedirectUri}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file with: ${newRedirectUri}`);
}

// Usage: node update-env.js https://xyz789.ngrok.io
const newUrl = process.argv[2];
if (newUrl) {
  updateEnvFile(newUrl);
} else {
  console.log('Usage: node update-env.js https://your-new-ngrok-url.ngrok.io');
}
```

## **📱 Mobile-Friendly Checklist**

Create a simple checklist you can access on your phone:

### **ngrok Restart Checklist ✅**

## When ngrok restarts:

- [ ] 1. Get new ngrok URL from terminal
- [ ] 2. Go to Spotify Developer Dashboard
- [ ] 3. Edit app settings
- [ ] 4. Update redirect URI
- [ ] 5. Save Spotify settings
- [ ] 6. Update .env file
- [ ] 7. Restart server
- [ ] 8. Test Spotify connection

## Quick Links:
- Spotify Dashboard: https://developer.spotify.com/dashboard
- Local Server: http://localhost:5000
- Local Client: http://localhost:8080

## **🎯 Prevention Strategies**

### **Option 1: Use ngrok Auth Token (Recommended)**
```bash
# Sign up for free ngrok account
ngrok config add-authtoken YOUR_AUTH_TOKEN

# This gives you a more stable session
ngrok http 5000
```

### **Option 2: Use Multiple Redirect URIs**
Add multiple ngrok URLs to your Spotify app settings:
```
https://abc123.ngrok.io/api/spotify/callback
https://def456.ngrok.io/api/spotify/callback
https://ghi789.ngrok.io/api/spotify/callback
http://localhost:5000/api/spotify/callback
```

### **Option 3: Development vs Production Setup**
```javascript
// In your code, use environment-based URLs
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api/spotify/callback';
  }
  return process.env.SPOTIFY_REDIRECT_URI;
};
```

## **🚨 Troubleshooting Common Issues**

### **Issue: "Invalid redirect URI"**
**Solution:** Double-check that the URI in Spotify Dashboard exactly matches your .env file

### **Issue: "CORS error"**
**Solution:** Update the CORS origins in `app.js` to include your new ngrok URL

### **Issue: "Server not responding"**
**Solution:** Make sure your server is running and accessible at the ngrok URL

### **Issue: "Spotify callback fails"**
**Solution:** Ensure the callback route is `/api/spotify/callback` and the server is listening

## **🔄 Complete Recovery Example**

Here's what a complete recovery looks like:

```bash
# 1. Start ngrok
ngrok http 5000
# New URL: https://xyz789.ngrok.io

# 2. Update Spotify app settings
# Go to https://developer.spotify.com/dashboard
# Change redirect URI to: https://xyz789.ngrok.io/api/spotify/callback

# 3. Update .env file
# Change: SPOTIFY_REDIRECT_URI=https://xyz789.ngrok.io/api/spotify/callback

# 4. Restart server
npm start

# 5. Test the connection
# Visit: http://localhost:8080 -> Settings -> Connect Spotify
```

## **📋 Time-Saving Tips**

1. **Keep Spotify Dashboard bookmarked** for quick access
2. **Use environment variables** instead of hardcoded URLs
3. **Document your current ngrok URL** somewhere easily accessible
4. **Consider upgrading to ngrok Pro** for static domains ($8/month)
5. **Test the full flow** after each update to catch issues early

## **🔧 Project-Specific Information**

### **Current Configuration:**
- **Server runs on:** `http://localhost:5000`
- **Client runs on:** `http://localhost:8080`
- **Spotify callback route:** `/api/spotify/callback`
- **Main .env file:** `server/.env`

### **Key Files to Update:**
- `server/.env` - Update `SPOTIFY_REDIRECT_URI`
- `server/app.js` - Update CORS origins if hardcoded
- Spotify Developer Dashboard - Update redirect URI

### **Testing After Update:**
1. Visit `http://localhost:8080`
2. Go to Settings page
3. Click "Connect Spotify"
4. Should redirect to Spotify OAuth
5. After approval, should redirect back to Settings

---

This guide should help you quickly recover from ngrok restarts and minimize downtime! 🚀
