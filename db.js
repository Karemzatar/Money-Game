const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'game.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    level INTEGER DEFAULT 1,
    multiplier_value REAL DEFAULT 1,
    multiplier_until INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    income_per_click REAL DEFAULT 1,
    level INTEGER DEFAULT 1,
    upgrade_cost REAL DEFAULT 100,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ad_sessions (
    user_id INTEGER PRIMARY KEY,
    start_time INTEGER,
    status TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
