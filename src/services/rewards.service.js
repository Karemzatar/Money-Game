const db = require('../db/index.js');

class RewardsService {
    static canClaimDailyReward(userId) {
        const today = new Date().toDateString();
        const lastReward = db.prepare(`
            SELECT claimed_date FROM daily_rewards 
            WHERE user_id = ? 
            ORDER BY claimed_date DESC LIMIT 1
        `).get(userId);

        return !lastReward || new Date(lastReward.claimed_date).toDateString() !== today;
    }

    static getStreak(userId) {
        const lastReward = db.prepare(`
            SELECT claimed_date, streak FROM daily_rewards 
            WHERE user_id = ? 
            ORDER BY claimed_date DESC LIMIT 1
        `).get(userId);

        if (!lastReward) return 0;

        const lastDate = new Date(lastReward.claimed_date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // If claimed yesterday, streak continues; otherwise it resets
        if (lastDate.toDateString() === yesterday.toDateString()) {
            return lastReward.streak || 0;
        }

        return 0;
    }

    static claimDailyReward(userId) {
        const streak = this.getStreak(userId) + 1;
        const reward = 100 * streak;

        db.prepare(`
            INSERT INTO daily_rewards (user_id, reward, streak, claimed_date)
            VALUES (?, ?, ?, ?)
        `).run(userId, reward, streak, new Date().toISOString());

        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(reward, userId);

        return { reward, streak };
    }
}

module.exports = RewardsService;
