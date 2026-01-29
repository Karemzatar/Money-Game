
const db = require('../db');

class UserService {
    static async findById(id) {
        return db.prepare('SELECT id, username, balance, total_earned, level, multiplier_value, multiplier_until, last_active FROM users WHERE id = ?').get(id);
    }

    static async findByUsername(username) {
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }

    static async create(username, passwordHash) {
        const config = require('../config');
        const stmt = db.prepare('INSERT INTO users (username, password, balance, last_active) VALUES (?, ?, ?, ?)');
        const result = stmt.run(username, passwordHash, config.GAME.STARTING_BALANCE, Date.now());

        // Init daily rewards tracking
        db.prepare('INSERT INTO daily_rewards (user_id, streak, last_claimed_date) VALUES (?, 0, NULL)').run(result.lastInsertRowid);

        return result.lastInsertRowid;
    }

    static updateActivity(userId) {
        db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), userId);
    }
}

module.exports = UserService;
