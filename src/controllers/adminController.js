
const db = require('../db/index.js');
const UserService = require('../services/userService.js');

class AdminController {
    static async getDashboardData(req, res) {
        // Security check
        const user = db.prepare('SELECT username, role FROM users WHERE id = ?').get(req.session.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied" });
        }

        try {
            // Map companies and users for the legacy dashboard table
            const companies = db.prepare(`
                SELECT 
                    c.id, 
                    c.name as company, 
                    u.username as manager, 
                    u.balance, 
                    c.level, 
                    (u.total_earned / 10.0) as sharePrice, 
                    u.last_active,
                    '****' as pin,
                    '0000' as cardNumber,
                    0 as healthScore,
                    0 as locked
                FROM companies c
                JOIN users u ON c.user_id = u.id
            `).all();

            const logs = db.prepare('SELECT id, user_id as userId, type as action, created_at as timestamp FROM transactions ORDER BY id DESC LIMIT 50').all();

            res.json({
                companies,
                logs
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Admin Data Error" });
        }
    }

    static async getDashboardStats(req, res) {
        const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
        if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');

        const stats = {
            users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
            volume: db.prepare('SELECT SUM(amount) as s FROM transactions').get().s || 0,
            topUsers: db.prepare('SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10').all()
        };
        res.json(stats);
    }

    static async toggleLock(req, res) {
        res.json({ success: true });
    }
}

module.exports = AdminController;
