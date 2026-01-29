class RewardsController {
    static async claimDailyReward(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Check if already claimed today
            const today = new Date().toDateString();
            const lastReward = db.prepare('SELECT claimed_date FROM daily_rewards WHERE user_id = ? ORDER BY claimed_date DESC LIMIT 1')
                .get(userId);

            if (lastReward && new Date(lastReward.claimed_date).toDateString() === today) {
                return res.status(429).json({ error: 'Already claimed today' });
            }

            // Calculate reward based on streak
            let streak = 1;
            if (lastReward) {
                const lastDate = new Date(lastReward.claimed_date);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    // Get actual streak from database
                    const streakData = db.prepare('SELECT streak FROM daily_rewards WHERE user_id = ? ORDER BY claimed_date DESC LIMIT 1')
                        .get(userId);
                    streak = (streakData?.streak || 1) + 1;
                }
            }

            const reward = 100 * streak; // Base 100, multiplied by streak

            // Record claim
            db.prepare(`
                INSERT INTO daily_rewards (user_id, reward, streak, claimed_date)
                VALUES (?, ?, ?, ?)
            `).run(userId, reward, streak, new Date().toISOString());

            // Update balance
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(reward, userId);

            res.json({ success: true, reward, streak });
        } catch (error) {
            console.error('Claim daily reward error:', error);
            res.status(500).json({ error: 'Failed to claim reward' });
        }
    }

    static async getRewardStatus(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const today = new Date().toDateString();
            const lastReward = db.prepare('SELECT claimed_date, streak FROM daily_rewards WHERE user_id = ? ORDER BY claimed_date DESC LIMIT 1')
                .get(userId);

            const claimed = lastReward && new Date(lastReward.claimed_date).toDateString() === today;

            res.json({
                success: true,
                claimed,
                streak: lastReward?.streak || 0,
            });
        } catch (error) {
            console.error('Get reward status error:', error);
            res.status(500).json({ error: 'Failed to get reward status' });
        }
    }
}

module.exports = RewardsController;
