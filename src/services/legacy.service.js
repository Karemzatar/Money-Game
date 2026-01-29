const db = require('../db/index.js');

class LegacyService {
    static getAllCompanies(limit = 100) {
        return db.prepare('SELECT * FROM companies LIMIT ?').all(limit);
    }

    static getCompanyData(companyId) {
        return db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
    }

    static getUserCompanies(userId) {
        return db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);
    }

    static createPartnershipRequest(fromUserId, toUserId) {
        // Placeholder for partnership logic
        return {
            success: true,
            message: 'Partnership request created',
        };
    }

    static acceptPartnership(fromUserId, toUserId) {
        // Placeholder for partnership logic
        return {
            success: true,
            message: 'Partnership accepted',
        };
    }
}

module.exports = LegacyService;
