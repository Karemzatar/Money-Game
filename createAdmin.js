// createAdmin.js
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const db = new Database('./game.db');

// كلمة المرور للأدمن
const username = 'admin';
const password = 'admin';
const passwordHash = bcrypt.hashSync(password, 10);

// تحقق إذا المستخدم موجود بالفعل
const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (existing) {
    console.log('⚠️ Admin user already exists');
    process.exit(0);
}

// أدخل المستخدم كأدمن (هنا سنستخدم level = 999 لتمييزه كأدمن)
const stmt = db.prepare(`
  INSERT INTO users (username, password, balance, total_earned, level)
  VALUES (?, ?, ?, ?, ?)
`);
stmt.run(username, passwordHash, 0, 0, 999);

console.log(`✅ Admin user created: username=${username} password=${password}`);
