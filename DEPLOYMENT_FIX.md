# Deployment Fix for /api/create 500 Error

## Issue Analysis
The `/api/create` endpoint is returning a 500 Internal Server Error on the live server (https://money-game.up.railway.app/api/create).

## Root Cause
The live server likely doesn't have the latest code deployment, including:
1. Updated database schema with new tables
2. New utility files (`utils/gameLogic.js`, `utils/errorHandler.js`)
3. Enhanced error handling and logging

## Immediate Fix Steps

### 1. Update Live Server Code
Ensure all files are deployed to Railway:
- `server.js` (with enhanced error handling)
- `utils/gameLogic.js` (game logic utilities)
- `utils/errorHandler.js` (error handling utilities)
- `db.js` (updated database schema)

### 2. Database Migration
Run database migration to ensure all new tables exist:
```sql
-- Check if required tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name IN (
  'users', 'companies', 'player_stats', 'game_upgrades', 
  'tutorial_progress', 'offline_earnings', 'achievements',
  'daily_rewards', 'transactions', 'error_logs'
);
```

### 3. Verify File Structure
Ensure the live server has this structure:
```
/
├── server.js
├── db.js
├── package.json
├── utils/
│   ├── gameLogic.js
│   └── errorHandler.js
├── public/
│   ├── index.html
│   ├── login.html
│   └── js/
└── logs/
```

### 4. Environment Variables
Verify Railway environment variables:
- `NODE_ENV=production`
- Database connection string (if using external DB)

## Testing the Fix

### Local Test
```bash
# Test locally first
curl -X POST http://localhost:3000/api/create \
  -H "Content-Type: application/json" \
  -d '{"company":"Test Company","manager":"Test Manager"}'
```

### Expected Response
```json
{
  "success": true,
  "companyId": 123,
  "message": "Company created successfully"
}
```

## Debugging Steps if Error Persists

1. **Check Railway Logs**: View deployment logs in Railway dashboard
2. **Database Connection**: Verify SQLite database is accessible
3. **File Permissions**: Ensure server can read all required files
4. **Module Loading**: Check if all Node.js modules are installed

## Alternative Quick Fix

If deployment issues persist, create a simplified version of the endpoint:

```javascript
app.post('/api/create', async (req, res) => {
  try {
    const { company, manager } = req.body;
    
    // Basic validation
    if (!company || !manager) {
      return res.status(400).json({ error: 'Company and manager required' });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash('default123', 10);
    const userResult = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(manager, hashedPassword);
    
    // Create company
    const companyResult = db.prepare('INSERT INTO companies (user_id, name, income_per_click) VALUES (?, ?, ?)').run(
      userResult.lastInsertRowid, company, 1.5
    );
    
    res.json({ success: true, companyId: companyResult.lastInsertRowid });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});
```

## Deployment Commands

```bash
# Deploy to Railway
git add .
git commit -m "Fix /api/create 500 error with enhanced error handling"
git push origin main

# Or use Railway CLI
railway up
```

## Monitoring After Fix

1. Test the create functionality on live site
2. Check Railway logs for any errors
3. Verify new companies appear in database
4. Test login with created accounts

This should resolve the 500 error and restore the company creation functionality.
