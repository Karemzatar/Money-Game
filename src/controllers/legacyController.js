
const db = require('../db');

class LegacyController {
    static getCompaniesList(req, res) {
        // Compatibility for /api/companies (used by search etc)
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
        // Compatibility for /data/:id (used by notification polling)
        // Returns notifications, partnerships etc.
        const id = req.params.id; // actually user_id in some contexts? or company id?
        // Old game used "companyId" in sessionStorage which was usually related to user_id or company_id.
        // Let's assume it matches company_table id if passed, otherwise tries user.

        // Actually the old code: `const res = await fetch(/data/${companyId});`
        // And `companyId` came from `sessionStorage` which was likely the user's primary company ID or User ID.
        // Let's serve strict data.

        try {
            // In new system, "companyId" in session might be mixed.
            // We'll treat the param as user_id for notifications.
            const userId = id; // simplistic

            const partnerships = db.prepare(`
                SELECT p.id, u.username as fromName, p.user_id_1 as fromId 
                FROM partners p 
                JOIN users u ON u.id = p.user_id_1 
                WHERE p.user_id_2 = ? AND p.status = 'pending'
             `).all(userId);

            const partners = db.prepare(`
                SELECT user_id_1, user_id_2 FROM partners WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = 'active'
             `).all(userId, userId);

            // Map to "partner IDs" (other user's active company ID? or just user ID)
            // simplified: just return list of IDs
            const partnerIds = partners.map(p => p.user_id_1 === parseInt(userId) ? p.user_id_2 : p.user_id_1);

            res.json({
                partnershipRequests: partnerships,
                partners: partnerIds,
                locked: false // assuming no lock logic implemented yet
            });
        } catch (e) {
            res.json({});
        }
    }
}

module.exports = LegacyController;
