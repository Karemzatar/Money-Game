
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to DB
const dbPath = path.join(dataDir, 'game.db');
const db = new Database(dbPath); // verbose: console.log for debug

// Optimize WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Schema
function init() {
    const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user', -- 'admin' or 'user'
        balance REAL DEFAULT 0,
        total_earned REAL DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp REAL DEFAULT 0,
        multiplier_value REAL DEFAULT 1,
        multiplier_until INTEGER DEFAULT 0,
        last_active INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        income_per_click REAL NOT NULL,
        passive_income REAL DEFAULT 0,
        upgrade_cost REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'small', 'medium', 'large'
        value REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        amount INTEGER DEFAULT 0,
        avg_price REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id_1 INTEGER NOT NULL,
        user_id_2 INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'active'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2)
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, 
        amount REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_rewards (
        user_id INTEGER NOT NULL,
        streak INTEGER DEFAULT 0,
        last_claimed_date TEXT,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

    db.exec(schema);

    // Migration: Add role column if missing
    try {
        db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
    } catch (e) {
        // Column already exists or other error we can ignore
    }

    // Seed Admin if not exists
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!admin) {
        db.prepare('INSERT INTO users (username, password, role, last_active) VALUES (?, ?, ?, ?)').run(
            'admin',
            '$2b$10$E8W65j9DtooJ9MdlOfkxie8UY4/PSYo2JNA2ucgGJBAJhYHlv4hrC',
            'admin',
            Date.now()
        );
        console.log('✅ Admin user created (admin/admin)');
    }

    // Data Fix Migrations
    try {
        // Ensure all companies have some passive income and upgrade cost
        db.prepare("UPDATE companies SET passive_income = 5 WHERE passive_income IS NULL OR passive_income = 0").run();
        db.prepare("UPDATE companies SET upgrade_cost = 50 WHERE upgrade_cost IS NULL OR upgrade_cost = 0").run();
        db.prepare("UPDATE companies SET income_per_click = 1.5 WHERE income_per_click IS NULL OR income_per_click = 0").run();

        // Ensure all users have last_active
        db.prepare("UPDATE users SET last_active = ? WHERE last_active IS NULL OR last_active = 0").run(Date.now());

        console.log('✅ Data migrations applied');
    } catch (e) {
        console.warn('⚠️ Data migrations warning:', e.message);
    }

    console.log('✅ Database initialized successfully');
}

init();

module.exports = db;
