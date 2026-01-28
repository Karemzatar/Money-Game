const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');
const {
  log,
  handleError,
  asyncHandler,
  globalErrorHandler,
  validate,
  checkRateLimit,
} = require('./utils/errorHandler');
const gameLogic = require('./utils/gameLogic');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'money-game-secret-123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Static files
app.use(express.static('public'));
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

// Auth Middleware
const authenticate = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    return handleError(res, 401, 'Unauthorized');
  }
};

// ======= AUTH ROUTES =======

app.post(
  '/api/auth/signup',
  validate({
    username: { required: true, type: 'string', minLength: 3, maxLength: 20 },
    password: { required: true, type: 'string', minLength: 6, maxLength: 50 },
  }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, last_active) VALUES (?, ?, ?)');
    const info = stmt.run(username, hashedPassword, Date.now());

    // Initialize player stats
    db.prepare('INSERT INTO player_stats (user_id) VALUES (?)').run(info.lastInsertRowid);

    // Create initial company
    db.prepare(
      'INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)'
    ).run(
      info.lastInsertRowid,
      `${username}'s Startup`,
      gameLogic.GAME_CONFIG.BASE_INCOME_PER_CLICK,
      1,
      100
    );

    log('New user registered', { username, userId: info.lastInsertRowid });
    res.json({ success: true, message: 'Account created successfully' });
  })
);

app.post(
  '/api/auth/login',
  validate({
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return handleError(res, 401, 'Invalid credentials');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), user.id);

    log('User logged in', { username, userId: user.id });
    res.json({ success: true, message: 'Logged in successfully' });
  })
);

app.post('/api/auth/logout', (req, res) => {
  const userId = req.session?.userId;
  if (userId) {
    db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), userId);
  }
  req.session.destroy(err => {
    if (err) {
      return handleError(res, 500, 'Logout failed', err, userId);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  const user = db.prepare(
    'SELECT id, username, balance, total_earned, level, multiplier_value, multiplier_until, last_active FROM users WHERE id = ?'
  ).get(userId);

  res.json(user || {});
}));

// ======= GAME ROUTES =======

app.get('/api/game/profile', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  const user = db.prepare(
    'SELECT balance, total_earned, level, multiplier_value, multiplier_until, last_active FROM users WHERE id = ?'
  ).get(userId);

  const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);
  const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId) || {};

  const currentMultiplier = user.multiplier_until > Date.now() ? user.multiplier_value : 1;

  let offlineEarnings = { amount: 0, hours: 0, capped: false };
  if (user.last_active) {
    const incomePerHour = gameLogic.calculateIncomePerClick(companies, user.level) * 10;
    offlineEarnings = gameLogic.calculateOfflineEarnings(user.last_active, incomePerHour);
  }

  res.json({
    ...user,
    companies,
    stats,
    currentMultiplier,
    offlineEarnings,
  });
}));

app.post(
  '/api/game/click',
  authenticate,
  asyncHandler((req, res) => {
    const userId = req.session.userId;

    const rateCheck = checkRateLimit(`click_${userId}`, 50, 1000);
    if (!rateCheck.allowed) {
      return handleError(res, 429, rateCheck.message);
    }

    const user = db.prepare(
      'SELECT balance, total_earned, level, multiplier_value, multiplier_until FROM users WHERE id = ?'
    ).get(userId);

    const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

    const incomePerClick = gameLogic.calculateIncomePerClick(companies, user.level);
    const finalAmount = gameLogic.applyMultiplier(
      incomePerClick,
      user.multiplier_value,
      user.multiplier_until
    );

    const newBalance = user.balance + finalAmount;
    const newTotalEarned = user.total_earned + finalAmount;
    const newLevel = gameLogic.calculateLevel(newTotalEarned);

    db.prepare('UPDATE users SET balance = ?, total_earned = ?, level = ?, last_active = ? WHERE id = ?').run(
      newBalance,
      newTotalEarned,
      newLevel,
      Date.now(),
      userId
    );

    db.prepare('UPDATE player_stats SET total_clicks = total_clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);

    db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(
      userId,
      finalAmount,
      'CLICK',
      'Income from click'
    );

    res.json({
      success: true,
      added: finalAmount,
      balance: newBalance,
      level: newLevel,
      totalEarned: newTotalEarned,
      leveledUp: newLevel > user.level,
    });
  })
);

app.post(
  '/api/game/upgrade-company',
  authenticate,
  validate({
    companyId: { required: true, type: 'number' },
  }),
  asyncHandler((req, res) => {
    const { companyId } = req.body;
    const userId = req.session.userId;

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?').get(
      companyId,
      userId
    );

    if (!company) {
      return handleError(res, 404, 'Company not found', null, userId);
    }

    if (user.balance < company.upgrade_cost) {
      return handleError(res, 400, 'Insufficient funds');
    }

    const newBalance = user.balance - company.upgrade_cost;
    const newLevel = company.level + 1;
    const newIncome = gameLogic.calculateNewIncome(company.income_per_click);
    const newCost = gameLogic.calculateUpgradeCost(newLevel, 100);

    db.prepare('UPDATE users SET balance = ?, last_active = ? WHERE id = ?').run(
      newBalance,
      Date.now(),
      userId
    );

    db.prepare('UPDATE companies SET level = ?, income_per_click = ?, upgrade_cost = ? WHERE id = ?').run(
      newLevel,
      newIncome,
      newCost,
      companyId
    );

    db.prepare('UPDATE player_stats SET total_upgrades = total_upgrades + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);

    db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(
      userId,
      -company.upgrade_cost,
      'UPGRADE',
      `Upgraded company ${company.name} to level ${newLevel}`
    );

    log('Company upgraded', { userId, companyId, newLevel });

    res.json({
      success: true,
      newBalance,
      newLevel,
      newIncome,
      newCost,
    });
  })
);

app.post(
  '/api/game/buy-company',
  authenticate,
  validate({
    name: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  }),
  asyncHandler((req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;
    const cost = gameLogic.GAME_CONFIG.COMPANY_PURCHASE_COST;

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

    if (user.balance < cost) {
      return handleError(res, 400, 'Insufficient funds');
    }

    const newBalance = user.balance - cost;
    db.prepare('UPDATE users SET balance = ?, last_active = ? WHERE id = ?').run(
      newBalance,
      Date.now(),
      userId
    );

    const result = db.prepare(
      'INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)'
    ).run(
      userId,
      name,
      gameLogic.GAME_CONFIG.BASE_INCOME_PER_CLICK * 2,
      1,
      gameLogic.calculateUpgradeCost(1, 100)
    );

    db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(
      userId,
      -cost,
      'BUY_COMPANY',
      `Purchased new company: ${name}`
    );

    log('New company purchased', { userId, companyId: result.lastInsertRowid, name });

    res.json({
      success: true,
      companyId: result.lastInsertRowid,
      newBalance,
    });
  })
);

app.post('/api/game/claim-offline-earnings', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  const user = db.prepare('SELECT balance, total_earned, level, last_active FROM users WHERE id = ?').get(userId);
  const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

  const incomePerHour = gameLogic.calculateIncomePerClick(companies, user.level) * 10;
  const offlineData = gameLogic.calculateOfflineEarnings(user.last_active, incomePerHour);

  const newBalance = user.balance + offlineData.amount;
  const newTotalEarned = user.total_earned + offlineData.amount;
  const newLevel = gameLogic.calculateLevel(newTotalEarned);

  db.prepare('UPDATE users SET balance = ?, total_earned = ?, level = ?, last_active = ? WHERE id = ?').run(
    newBalance,
    newTotalEarned,
    newLevel,
    Date.now(),
    userId
  );

  db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(
    userId,
    offlineData.amount,
    'OFFLINE_EARNINGS',
    `Offline earnings for ${offlineData.hours} hours`
  );

  log('Offline earnings claimed', { userId, amount: offlineData.amount, hours: offlineData.hours });

  res.json({
    success: true,
    offlineEarnings: offlineData,
    newBalance,
    leveledUp: newLevel > user.level,
  });
}));

// ======= TUTORIAL =======

app.get('/api/game/tutorial-status', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  let tutorial = db.prepare('SELECT * FROM tutorial_progress WHERE user_id = ?').get(userId);

  if (!tutorial) {
    db.prepare('INSERT INTO tutorial_progress (user_id) VALUES (?)').run(userId);
    tutorial = {
      completed: false,
      current_step: 0,
      skipped: false,
    };
  }

  res.json(tutorial);
}));

app.post(
  '/api/game/tutorial-progress',
  authenticate,
  validate({ step: { required: true, type: 'number' } }),
  asyncHandler((req, res) => {
    const userId = req.session.userId;
    const { step } = req.body;

    db.prepare('UPDATE tutorial_progress SET current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
      step,
      userId
    );

    res.json({ success: true });
  })
);

app.post('/api/game/tutorial-complete', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;

  db.prepare('UPDATE tutorial_progress SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);

  log('Tutorial completed', { userId });

  res.json({ success: true });
}));

app.post('/api/game/tutorial-skip', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;

  db.prepare('UPDATE tutorial_progress SET skipped = 1 WHERE user_id = ?').run(userId);

  res.json({ success: true });
}));

// ======= DAILY REWARDS =======

app.post('/api/game/claim-daily-reward', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

  const lastClaim = db.prepare(
    "SELECT claimed_date FROM daily_rewards WHERE user_id = ? ORDER BY claimed_date DESC LIMIT 1"
  ).get(userId);

  const today = new Date().toISOString().split('T')[0];
  if (lastClaim && lastClaim.claimed_date === today) {
    return handleError(res, 400, 'Daily reward already claimed today');
  }

  const streak = gameLogic.calculateStreak(lastClaim?.claimed_date);
  const rewardAmount = gameLogic.calculateDailyReward(streak);

  const newBalance = user.balance + rewardAmount;

  db.prepare('UPDATE users SET balance = ?, last_active = ? WHERE id = ?').run(
    newBalance,
    Date.now(),
    userId
  );

  db.prepare(
    'INSERT INTO daily_rewards (user_id, claimed_date, reward_amount, streak) VALUES (?, ?, ?, ?)'
  ).run(userId, today, rewardAmount, streak);

  db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(
    userId,
    rewardAmount,
    'DAILY_REWARD',
    `Daily reward (Streak: ${streak})`
  );

  log('Daily reward claimed', { userId, reward: rewardAmount, streak });

  res.json({
    success: true,
    reward: rewardAmount,
    newBalance,
    streak,
  });
}));

// ======= AD SYSTEM =======

app.post('/api/game/ad-start', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;

  db.prepare('INSERT OR REPLACE INTO ad_sessions (user_id, start_time, status) VALUES (?, ?, ?)').run(
    userId,
    Date.now(),
    'WATCHING'
  );

  res.json({ success: true });
}));

app.post('/api/game/ad-complete', authenticate, asyncHandler((req, res) => {
  const userId = req.session.userId;
  const adSession = db.prepare('SELECT * FROM ad_sessions WHERE user_id = ?').get(userId);

  if (!adSession || adSession.status !== 'WATCHING') {
    return handleError(res, 400, 'Invalid ad session');
  }

  const duration = Date.now() - adSession.start_time;
  if (duration < gameLogic.GAME_CONFIG.AD_DURATION_MS - 2000) {
    return handleError(res, 400, 'Ad not completed (too fast)');
  }

  const multiplierValue = gameLogic.GAME_CONFIG.AD_REWARD_MULTIPLIER;
  const multiplierUntil = Date.now() + 2 * 60 * 1000;

  db.prepare('UPDATE users SET multiplier_value = ?, multiplier_until = ?, last_active = ? WHERE id = ?').run(
    multiplierValue,
    multiplierUntil,
    Date.now(),
    userId
  );

  db.prepare('DELETE FROM ad_sessions WHERE user_id = ?').run(userId);

  db.prepare('UPDATE player_stats SET total_ads_watched = total_ads_watched + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);

  log('Ad completed', { userId, durationSeconds: (duration / 1000).toFixed(1) });

  res.json({ success: true, multiplierUntil });
}));

// ======= COMPATIBILITY ENDPOINTS =======

app.get('/api/companies', asyncHandler((req, res) => {
  const companies = db.prepare(
    'SELECT c.id, c.name, c.level, c.income_per_click FROM companies c ORDER BY c.income_per_click DESC LIMIT 50'
  ).all();

  res.json(companies);
}));

app.post(
  '/api/create',
  validate({
    company: { required: true, type: 'string', minLength: 3, maxLength: 50 },
    manager: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  }),
  asyncHandler(async (req, res) => {
    try {
      const { company, manager, imageUrl } = req.body;

      log('Creating new company', { company, manager });

      const hashedPassword = await bcrypt.hash('default123', 10);
      const userInfo = db.prepare('INSERT INTO users (username, password, last_active) VALUES (?, ?, ?)').run(
        manager,
        hashedPassword,
        Date.now()
      );

      log('User created', { userId: userInfo.lastInsertRowid, manager });

      db.prepare('INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)').run(
        userInfo.lastInsertRowid,
        company,
        gameLogic.GAME_CONFIG.BASE_INCOME_PER_CLICK,
        1,
        100
      );

      log('Company created', { companyId: userInfo.lastInsertRowid, company });

      db.prepare('INSERT INTO player_stats (user_id) VALUES (?)').run(userInfo.lastInsertRowid);

      res.json({
        success: true,
        companyId: userInfo.lastInsertRowid,
        message: 'Company created successfully',
      });
    } catch (error) {
      log('Error in /api/create', { error: error.message, stack: error.stack }, true);
      throw error;
    }
  })
);

// ======= FRONTEND ROUTES =======

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// ======= ERROR HANDLING =======

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  log(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
});

module.exports = app;
