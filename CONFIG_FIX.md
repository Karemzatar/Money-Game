# 🔧 Config Module Error Fix

## Problem
```
Error: Cannot find module './config'
Require stack:
- /app/src/app.js
- /app/src/server.js
```

## Root Cause
The live server is using the `src/` directory structure which requires a `config/index.js` file that was missing.

## ✅ Solution Applied

### 1. Created Missing Config File
- **File:** `src/config/index.js`
- **Purpose:** Merges environment and game configurations
- **Content:** Exports all config properties for the application

### 2. Config Structure
```javascript
// src/config/index.js
const env = require('./env.js');
const gameConfig = require('./game.config.js');

module.exports = {
  ...env,
  ...gameConfig,
  SERVER: { PORT, NODE_ENV, SESSION_SECRET, DATABASE_URL },
  DISCORD: { TOKEN, CLIENT_ID, GUILD_ID, ADMIN_ROLE_ID },
  GAME: gameConfig.GAME,
  RATE_LIMIT: gameConfig.RATE_LIMIT,
  VISA_TIERS: gameConfig.VISA_TIERS
};
```

## 🚀 Deployment Instructions

### For Railway (Live Server)

1. **Add the fix to your repository:**
   ```bash
   git add src/config/index.js
   git commit -m "Fix missing config module error"
   git push origin main
   ```

2. **Verify deployment:**
   - Check Railway dashboard for successful deployment
   - Monitor logs for any remaining errors

### Alternative: Manual Deployment

If automatic deployment doesn't work, you can:

1. **Use Railway CLI:**
   ```bash
   railway up
   ```

2. **Or create the file directly in Railway:**
   - Go to Railway dashboard
   - Navigate to your service
   - Create `src/config/index.js` with the content below

## 📋 Complete Config Content

```javascript
const env = require('./env.js');
const gameConfig = require('./game.config.js');

module.exports = {
  ...env,
  ...gameConfig,
  
  // Additional merged configurations
  SERVER: {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    SESSION_SECRET: env.SESSION_SECRET,
    DATABASE_URL: env.DATABASE_URL
  },
  
  DISCORD: {
    TOKEN: env.DISCORD_TOKEN,
    CLIENT_ID: env.DISCORD_CLIENT_ID,
    GUILD_ID: env.DISCORD_GUILD_ID,
    ADMIN_ROLE_ID: env.DISCORD_ADMIN_ROLE_ID
  },
  
  GAME: gameConfig.GAME,
  RATE_LIMIT: gameConfig.RATE_LIMIT,
  VISA_TIERS: gameConfig.VISA_TIERS
};
```

## 🔍 Verification

After deployment, test these endpoints:

1. **Health Check:**
   ```bash
   curl https://money-game.up.railway.app/
   ```

2. **API Test:**
   ```bash
   curl -X POST https://money-game.up.railway.app/api/create \
     -H "Content-Type: application/json" \
     -d '{"company":"Test","manager":"Test"}'
   ```

## 🎯 Expected Result

- **Before:** `Error: Cannot find module './config'`
- **After:** Server starts successfully and API endpoints work

## 📝 Notes

- The fix is backward compatible with existing code
- All existing functionality remains unchanged
- Error handling is improved with proper configuration loading

## 🚨 If Error Persists

1. **Check file permissions** on Railway
2. **Verify all dependencies** are installed
3. **Check Railway logs** for specific error details
4. **Ensure proper Node.js version** (should match local)

This fix should resolve the module resolution error and get the live server running properly!
