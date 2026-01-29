
const db = require('../db/index.js');

class LegacyController {
    static getCompaniesList(req, res) {
        const q = req.query.q;
        let stmt;
        if (q) {
            stmt = db.prepare('SELECT c.id, c.name as company, u.balance, c.level FROM companies c JOIN users u ON c.user_id = u.id WHERE c.name LIKE ? LIMIT 20');
            res.json(stmt.all(`%${q}%`));
        } else {
            stmt = db.prepare('SELECT c.id, c.name as company, c.level FROM companies c ORDER BY c.income_per_click DESC LIMIT 50');
            res.json(stmt.all());
        }
    }

    static getCompanyData(req, res) {
        const id = req.params.id;
        try {
            const userId = id;

            const partnerships = db.prepare(`
                SELECT p.id, u.username as fromName, p.user_id_1 as fromId 
                FROM partners p 
                JOIN users u ON u.id = p.user_id_1 
                WHERE p.user_id_2 = ? AND p.status = 'pending'
             `).all(userId);

            const partners = db.prepare(`
                SELECT user_id_1, user_id_2 FROM partners WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = 'active'
             `).all(userId, userId);

            const partnerIds = partners.map(p => p.user_id_1 === parseInt(userId) ? p.user_id_2 : p.user_id_1);

            res.json({
                partnershipRequests: partnerships,
                partners: partnerIds,
                locked: false
            });
        } catch (e) {
            res.json({ partnershipRequests: [], partners: [], locked: false });
        }
    }

    static async requestPartnership(req, res) {
        const { targetCompanyId } = req.body;
        const requesterId = req.session.userId;

        try {
            db.prepare('INSERT INTO partners (user_id_1, user_id_2, status) VALUES (?, ?, ?)')
                .run(requesterId, targetCompanyId, 'pending');
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ error: "Request already exists or error" });
        }
    }

    static async acceptPartnership(req, res) {
        const { requesterId } = req.body;
        const acceptorId = req.session.userId;

        try {
            db.prepare("UPDATE partners SET status = 'active' WHERE user_id_1 = ? AND user_id_2 = ?")
                .run(requesterId, acceptorId);
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ error: "Failed to accept" });
        }
    }
}

module.exports = LegacyController;
