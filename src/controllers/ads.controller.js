class AdsController {
    static async watchAd(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Check if user can watch ad
            const lastAd = db.prepare('SELECT watched_at FROM ad_sessions WHERE user_id = ? ORDER BY watched_at DESC LIMIT 1')
                .get(userId);

            const cooldownMs = 10 * 60 * 1000; // 10 minutes
            if (lastAd && Date.now() - lastAd.watched_at < cooldownMs) {
                return res.status(429).json({ error: 'Ad cooldown active' });
            }

            // Calculate reward
            const reward = Math.floor(100 * (1 + user.level / 10));

            // Record ad session
            db.prepare(`
                INSERT INTO ad_sessions (user_id, reward, watched_at)
                VALUES (?, ?, ?)
            `).run(userId, reward, Date.now());

            // Update balance
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(reward, userId);

            res.json({ success: true, reward });
        } catch (error) {
            console.error('Watch ad error:', error);
            res.status(500).json({ error: 'Failed to process ad' });
        }
    }

    static async getAdStatus(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const lastAd = db.prepare('SELECT watched_at FROM ad_sessions WHERE user_id = ? ORDER BY watched_at DESC LIMIT 1')
                .get(userId);

            const cooldownMs = 10 * 60 * 1000;
            const canWatch = !lastAd || (Date.now() - lastAd.watched_at) >= cooldownMs;
            const nextAvailable = lastAd ? lastAd.watched_at + cooldownMs : Date.now();

            res.json({
                success: true,
                canWatch,
                nextAvailable,
            });
        } catch (error) {
            console.error('Get ad status error:', error);
            res.status(500).json({ error: 'Failed to get ad status' });
        }
    }
}

module.exports = AdsController;
