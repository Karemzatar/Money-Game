const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'money-game-secret-123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Static files
app.use(express.static('public'));
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

// Auth Middleware
const authenticate = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ======= AUTH ROUTES =======

app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, hashedPassword);

    // Create initial company for new user
    const companyStmt = db.prepare('INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)');
    companyStmt.run(info.lastInsertRowid, `${username}'s Startup`, 1.5, 1, 100);

    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const user = db.prepare('SELECT id, username, balance, total_earned, level, multiplier_value, multiplier_until FROM users WHERE id = ?').get(req.session.userId);
  res.json(user);
});

// ======= GAME ROUTES =======

app.get('/api/game/profile', authenticate, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare('SELECT balance, total_earned, level, multiplier_value, multiplier_until FROM users WHERE id = ?').get(userId);
  const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

  // Check if multiplier expired
  let currentMultiplier = 1;
  if (user.multiplier_until > Date.now()) {
    currentMultiplier = user.multiplier_value;
  }

  res.json({ ...user, companies, currentMultiplier });
});

app.post('/api/game/click', authenticate, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare('SELECT balance, total_earned, level, multiplier_value, multiplier_until FROM users WHERE id = ?').get(userId);
  const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

  // Calculate base income from companies
  let incomePerClick = 0;
  companies.forEach(c => {
    incomePerClick += c.income_per_click;
  });

  // Add base level bonus
  incomePerClick += user.level * 0.5;

  // Apply multiplier
  let multiplier = 1;
  if (user.multiplier_until > Date.now()) {
    multiplier = user.multiplier_value;
  }
  const finalAmount = incomePerClick * multiplier;

  // Update user
  const newBalance = user.balance + finalAmount;
  const newTotalEarned = user.total_earned + finalAmount;

  // Level formula: Level = floor(sqrt(total_earned / 100))
  const newLevel = Math.max(user.level, Math.floor(Math.sqrt(newTotalEarned / 100)) + 1);

  db.prepare('UPDATE users SET balance = ?, total_earned = ?, level = ? WHERE id = ?')
    .run(newBalance, newTotalEarned, newLevel, userId);

  res.json({
    added: finalAmount,
    balance: newBalance,
    level: newLevel,
    totalEarned: newTotalEarned,
    leveledUp: newLevel > user.level
  });
});

app.post('/api/game/upgrade-company', authenticate, (req, res) => {
  const { companyId } = req.body;
  const userId = req.session.userId;

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?').get(companyId, userId);

  if (!company) return res.status(404).json({ error: 'Company not found' });
  if (user.balance < company.upgrade_cost) return res.status(400).json({ error: 'Insufficient funds' });

  const newBalance = user.balance - company.upgrade_cost;
  const newLevel = company.level + 1;
  const newIncome = company.income_per_click * 1.5;
  const newCost = company.upgrade_cost * 2;

  db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);
  db.prepare('UPDATE companies SET level = ?, income_per_click = ?, upgrade_cost = ? WHERE id = ?')
    .run(newLevel, newIncome, newCost, companyId);

  res.json({ success: true, newBalance, newLevel, newIncome, newCost });
});

app.post('/api/game/buy-company', authenticate, (req, res) => {
  const { name } = req.body;
  const userId = req.session.userId;
  const cost = 500; // Fixed cost for new company

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  if (user.balance < cost) return res.status(400).json({ error: 'Insufficient funds' });

  const newBalance = user.balance - cost;
  db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);

  const stmt = db.prepare('INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)');
  stmt.run(userId, name, 5, 1, 300);

  res.json({ success: true, newBalance });
});

// ======= AD SYSTEM =======

app.post('/api/game/ad-start', authenticate, (req, res) => {
  const userId = req.session.userId;
  db.prepare('INSERT OR REPLACE INTO ad_sessions (user_id, start_time, status) VALUES (?, ?, ?)')
    .run(userId, Date.now(), 'WATCHING');
  res.json({ success: true });
});

app.post('/api/game/ad-complete', authenticate, (req, res) => {
  const userId = req.session.userId;
  const adSession = db.prepare('SELECT * FROM ad_sessions WHERE user_id = ?').get(userId);

  if (!adSession || adSession.status !== 'WATCHING') {
    return res.status(400).json({ error: 'Invalid ad session' });
  }

  const duration = Date.now() - adSession.start_time;
  if (duration < 28000) { // Tolerant of 2s
    return res.status(400).json({ error: 'Ad not completed (too fast)' });
  }

  // Grant x5 reward for 2 minutes
  const multiplierValue = 5;
  const multiplierUntil = Date.now() + (2 * 60 * 1000);

  db.prepare('UPDATE users SET multiplier_value = ?, multiplier_until = ? WHERE id = ?')
    .run(multiplierValue, multiplierUntil, userId);

  db.prepare('DELETE FROM ad_sessions WHERE user_id = ?').run(userId);

  res.json({ success: true, multiplierUntil });
});

// Serve frontend and redirect if not logged in
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Admin endpoint (simple)
app.get('/api/admin/users', authenticate, (req, res) => {
  // Basic check for admin (could be improved)
  if (req.session.username !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const users = db.prepare('SELECT id, username, level, balance FROM users').all();
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
