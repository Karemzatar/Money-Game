const bcrypt = require('bcryptjs');
const db = require('../db/index.js');

class AuthService {
    static async registerUser(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = db.prepare(`
            INSERT INTO users (username, password, balance, total_earned, level)
            VALUES (?, ?, ?, ?, ?)
        `).run(username, hashedPassword, 500, 0, 1);

        return result.lastInsertRowid;
    }

    static async validatePassword(hashedPassword, plainPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async authenticateUser(username, password) {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        
        if (!user) return null;

        const valid = await this.validatePassword(user.password, password);
        if (!valid) return null;

        return user;
    }

    static async updateLastActive(userId) {
        db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(Date.now(), userId);
    }
}

module.exports = AuthService;
