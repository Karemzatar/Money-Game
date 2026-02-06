class CompanyController {
    static async getCompanyDetails(req, res) {
        try {
            const { companyId } = req.params;
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
                .get(companyId, userId);

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            res.json({ success: true, company });
        } catch (error) {
            console.error('Get company error:', error);
            res.status(500).json({ error: 'Failed to get company' });
        }
    }

    static async deleteCompany(req, res) {
        try {
            const { companyId } = req.params;
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
                .get(companyId, userId);

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            // Can't delete last company
            const count = db.prepare('SELECT COUNT(*) as count FROM companies WHERE user_id = ?')
                .get(userId).count;

            if (count <= 1) {
                return res.status(400).json({ error: 'Cannot delete your last company' });
            }

            db.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
            res.json({ success: true, message: 'Company deleted' });
        } catch (error) {
            console.error('Delete company error:', error);
            res.status(500).json({ error: 'Failed to delete company' });
        }
    }

    static async listCompanies(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?')
                .all(userId);

            res.json({ success: true, companies });
        } catch (error) {
            console.error('List companies error:', error);
            res.status(500).json({ error: 'Failed to list companies' });
        }
    }

    static async requestPartnership(req, res) {
        try {
            const { targetCompanyId } = req.body; // Actually we pair users or companies? Requirements say "Enter company ID -> notification sent to partner"
            // Assuming partnership is between users based on requirements "Partner with other companies"
            // Let's implement User-User partnership for simplicity or "Company-Company". 
            // The schema has `partners` table with `user_id_1`, `user_id_2`. So it's User-User partnership.

            const userId = req.session.userId;
            const db = require('../db/index.js');

            // Check if target company exists to find the owner
            const targetCompany = db.prepare('SELECT user_id FROM companies WHERE id = ?').get(targetCompanyId);
            if (!targetCompany) return res.status(404).json({ error: "Target company not found" });

            const targetUserId = targetCompany.user_id;
            if (targetUserId === userId) return res.status(400).json({ error: "Cannot partner with yourself" });

            // Check existing
            const existing = db.prepare('SELECT * FROM partners WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)')
                .get(userId, targetUserId, targetUserId, userId);

            if (existing) return res.status(400).json({ error: "Partnership request already exists" });

            db.prepare('INSERT INTO partners (user_id_1, user_id_2, status) VALUES (?, ?, ?)')
                .run(userId, targetUserId, 'pending');

            res.json({ success: true, message: "Partnership request sent" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async respondPartnership(req, res) {
        try {
            const { partnerId, accept } = req.body; // partnerId is the row ID in partners table or the user ID? Let's use Request ID preferably, or User ID.
            const userId = req.session.userId;
            const db = require('../db/index.js');

            // Find pending request where I am user_id_2
            const request = db.prepare('SELECT * FROM partners WHERE id = ? AND user_id_2 = ? AND status = ?')
                .get(partnerId, userId, 'pending');

            if (!request) return res.status(404).json({ error: "Request not found" });

            if (accept) {
                db.prepare('UPDATE partners SET status = ? WHERE id = ?').run('active', partnerId);

                // Boost stocks 1.5x (We don't have stock price tracking per se, but we can boost all companies income?)
                // Requirement: "stock price of both companies increases by 1.5x". 
                // We'll multiply income_per_click of all companies for both users by 1.5

                const user1 = request.user_id_1;
                const user2 = request.user_id_2;

                db.prepare('UPDATE companies SET income_per_click = income_per_click * 1.5 WHERE user_id IN (?, ?)').run(user1, user2);
                res.json({ success: true, message: "Partnership accepted! Stocks boosted." });
            } else {
                db.prepare('DELETE FROM partners WHERE id = ?').run(partnerId);
                res.json({ success: true, message: "Partnership rejected" });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async listPartners(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            // Get requests where I am involved
            const partners = db.prepare(`
                SELECT p.*, u.username as other_user 
                FROM partners p
                JOIN users u ON (u.id = p.user_id_1 OR u.id = p.user_id_2)
                WHERE (p.user_id_1 = ? OR p.user_id_2 = ?) AND u.id != ?
            `).all(userId, userId, userId);

            res.json({ success: true, partners });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = CompanyController;
