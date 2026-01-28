const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'game.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables with improved schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    level INTEGER DEFAULT 1,
    multiplier_value REAL DEFAULT 1,
    multiplier_until INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active INTEGER DEFAULT 0,
    passive_income_rate REAL DEFAULT 0,
    offline_cap_hours INTEGER DEFAULT 8,
    tutorial_completed INTEGER DEFAULT 0,
    daily_reward_claimed INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    manager TEXT,
    income_per_click REAL DEFAULT 1,
    passive_income REAL DEFAULT 0,
    level INTEGER DEFAULT 1,
    upgrade_cost REAL DEFAULT 100,
    image_url TEXT DEFAULT 'https://via.placeholder.com/200',
    employees INTEGER DEFAULT 0,
    efficiency REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ad_sessions (
    user_id INTEGER PRIMARY KEY,
    start_time INTEGER,
    status TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Tutorial progress tracking
  CREATE TABLE IF NOT EXISTS tutorial_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    completed INTEGER DEFAULT 0,
    current_step INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS offline_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    earned_at INTEGER NOT NULL,
    claimed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked INTEGER DEFAULT 0,
    unlocked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS daily_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    claimed_date DATE NOT NULL,
    reward_amount REAL NOT NULL,
    streak INTEGER DEFAULT 1,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, claimed_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    upgrade_key TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, upgrade_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    total_upgrades INTEGER DEFAULT 0,
    total_ads_watched INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
  CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
  CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
  CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
`);

module.exports = db;
