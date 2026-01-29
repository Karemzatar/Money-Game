const db = require('../db/index.js');

class AdsService {
    static canWatchAd(userId) {
        const lastAd = db.prepare(`
            SELECT watched_at FROM ad_sessions 
            WHERE user_id = ? 
            ORDER BY watched_at DESC LIMIT 1
        `).get(userId);

        const cooldownMs = 10 * 60 * 1000;
        return !lastAd || (Date.now() - lastAd.watched_at) >= cooldownMs;
    }

    static recordAdWatch(userId, reward) {
        db.prepare(`
            INSERT INTO ad_sessions (user_id, reward, watched_at)
            VALUES (?, ?, ?)
        `).run(userId, reward, Date.now());

        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(reward, userId);
    }

    static calculateReward(userLevel) {
        const baseReward = 100;
        return Math.floor(baseReward * (1 + userLevel / 10));
    }
}

module.exports = AdsService;
