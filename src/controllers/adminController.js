
const db = require('../db');
const UserService = require('../services/userService');

class AdminController {
    static async getDashboard(req, res) {
        // Simple security check (in production, use middleware)
        const user = await UserService.findById(req.session.userId);
        if (!user || user.username !== 'admin') {
            return res.status(403).json({ error: "Access Denied" });
        }

        try {
            const usersCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
            const transactionVolume = db.prepare('SELECT SUM(amount) as s FROM transactions').get().s || 0;
            const topUsers = db.prepare('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10').all();

            res.json({
                stats: {
                    users: usersCount,
                    volume: transactionVolume
                },
                topUsers
            });
        } catch (err) {
            res.status(500).json({ error: "Admin Error" });
        }
    }
}

module.exports = AdminController;
