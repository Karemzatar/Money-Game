
const db = require('../db/index.js');

class LegacyController {
    /**
     * Search for companies (used by partners page)
     * Maps to GET /api/companies
     */
    static getCompaniesList(req, res) {
        try {
            const q = req.query.q;
            let results;
            if (q) {
                results = db.prepare(`
                    SELECT u.id, u.username as company, u.level, u.balance 
                    FROM users u 
                    WHERE u.username LIKE ? 
                    LIMIT 20
                `).all(`%${q}%`);
            } else {
                results = db.prepare(`
                    SELECT u.id, u.username as company, u.level, u.balance 
                    FROM users u 
                    ORDER BY u.balance DESC 
                    LIMIT 20
                `).all();
            }
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Get partnership data for a user
     * Maps to GET /data/:id
     */
    static getCompanyData(req, res) {
        const userId = req.params.id;
        try {
            // Incoming requests
            const partnershipRequests = db.prepare(`
                SELECT p.id, u.username as fromName, p.user_id_1 as fromId 
                FROM partners p 
                JOIN users u ON u.id = p.user_id_1 
                WHERE p.user_id_2 = ? AND p.status = 'pending'
             `).all(userId);

            // Active partners
            const partnersRaw = db.prepare(`
                SELECT user_id_1, user_id_2 FROM partners 
                WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = 'active'
             `).all(userId, userId);

            const partners = partnersRaw.map(p =>
                p.user_id_1 == userId ? p.user_id_2 : p.user_id_1
            );

            res.json({
                partnershipRequests,
                partners,
                locked: false
            });
        } catch (e) {
            console.error('getCompanyData error:', e);
            res.status(500).json({ partnershipRequests: [], partners: [], locked: false });
        }
    }

    static async requestPartnership(req, res) {
        const { targetCompanyId } = req.body;
        const requesterId = req.session.userId;

        if (!targetCompanyId || !requesterId) {
            return res.status(400).json({ error: "Invalid IDs" });
        }

        if (targetCompanyId == requesterId) {
            return res.status(400).json({ error: "Cannot partner with yourself" });
        }

        try {
            db.prepare('INSERT INTO partners (user_id_1, user_id_2, status) VALUES (?, ?, ?)')
                .run(requesterId, targetCompanyId, 'pending');
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ error: "Request already exists or failed" });
        }
    }

    static async acceptPartnership(req, res) {
        const { requesterId } = req.body;
        const acceptorId = req.session.userId;

        try {
            const result = db.prepare("UPDATE partners SET status = 'active' WHERE user_id_1 = ? AND user_id_2 = ?")
                .run(requesterId, acceptorId);

            if (result.changes === 0) {
                return res.status(404).json({ error: "Request not found" });
            }

            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ error: "Failed to accept" });
        }
    }
}

module.exports = LegacyController;
