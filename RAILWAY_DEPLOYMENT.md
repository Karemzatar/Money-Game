# Railway Deployment Guide - Money Game

## 🚂 Railway Configuration

### Environment Variables (Set in Railway Dashboard)

Railway will automatically provide:
- ✅ `PORT` - Automatically set by Railway (don't set this manually)

**You need to set these in Railway:**

1. **SESSION_SECRET** (Required)
   ```
   SESSION_SECRET=your-super-secret-random-string-here
   ```
   Generate a secure random string (at least 32 characters)

2. **NODE_ENV** (Recommended)
   ```
   NODE_ENV=production
   ```

3. **DATABASE_URL** (Optional - default is `./game.db`)
   ```
   DATABASE_URL=./game.db
   ```

### Discord Bot (Optional - Only if using Discord integration)
If you want Discord bot features, add:
```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
DISCORD_ADMIN_ROLE_ID=your_admin_role_id
```

## 📦 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Railway deployment ready"
git push
```

### 2. Railway Setup
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `Money-Game` repository
5. Railway will automatically detect the Node.js app

### 3. Configure Environment Variables
In Railway Dashboard:
1. Go to your project
2. Click on "Variables" tab
3. Add the required environment variables:
   - `SESSION_SECRET` = (generate a random string)
   - `NODE_ENV` = `production`

### 4. Deploy
- Railway will automatically deploy on every push to main branch
- First deployment may take 2-3 minutes

## ✅ Verification

After deployment, check:
1. **Logs** - Should see:
   ```
   🚀 Money Game running on port XXXX
   📍 Environment: production
   ✅ Database initialized successfully
   ```

2. **Access your app** at the Railway-provided URL:
   ```
   https://your-app-name.up.railway.app
   ```

## 🔧 Local Development

For local testing:
```bash
# Install dependencies
npm install

# Run locally (uses PORT 3000 by default)
npm start
```

The app will run on `http://localhost:3000`

## 📝 Important Notes

### Database Persistence
- Railway provides persistent storage for your SQLite database
- The `game.db` file will be maintained across deployments
- **Backup recommendation**: Periodically download your database from Railway

### Session Secret
- **CRITICAL**: Use a strong, random SESSION_SECRET in production
- Never commit the actual secret to GitHub
- Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Discord Bot
- The Discord bot (`index.js`) is separate from the web app
- It's in `.gitignore` and won't be deployed to Railway
- If you need it, deploy it separately or remove from `.gitignore`

## 🚨 Troubleshooting

### App won't start
- Check Railway logs for errors
- Verify all required environment variables are set
- Ensure `SESSION_SECRET` is set

### Database errors
- Check if `DATABASE_URL` is set correctly
- Verify Railway has persistent storage enabled

### 404 Errors
- Check that static files are being served from `/public`
- Verify routes in `src/routes/api.js`

## 🔄 Updates

To deploy updates:
```bash
git add .
git commit -m "your update message"
git push
```

Railway will automatically redeploy!

## 📊 Monitoring

Railway provides:
- Real-time logs
- Resource usage metrics
- Deployment history
- Custom domain support (paid plans)

## 🎯 Production Checklist

Before going live:
- [ ] Set strong `SESSION_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Test all features on Railway URL
- [ ] Verify database persistence
- [ ] Test login/signup flow
- [ ] Check all API endpoints
- [ ] Test game functionality
- [ ] Verify static assets load correctly
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (Google Analytics already integrated)

## 🌐 Custom Domain (Optional)

To use your own domain (e.g., money-game.fun):
1. In Railway Dashboard, go to Settings
2. Add your custom domain
3. Update DNS records as instructed by Railway
4. Update canonical URLs in HTML files

---

**Your app is now ready for Railway deployment! 🚀**
