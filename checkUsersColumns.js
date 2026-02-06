const Database = require('better-sqlite3');
const db = new Database('./game.db');

const row = db.prepare("PRAGMA table_info(users)").all();
console.log(row);
