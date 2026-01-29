const db = require('../db/index.js');
const config = require('../config/index.js');

class CompanyService {
    static getCompanyById(companyId, userId) {
        return db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
            .get(companyId, userId);
    }

    static getAllCompanies(userId) {
        return db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);
    }

    static createCompany(userId, name, isFree = false) {
        const cost = isFree ? 0 : config.GAME.COMPANY_BASE_COST;
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

        if (!isFree && user.balance < cost) {
            throw new Error('Insufficient funds');
        }

        if (!isFree) {
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(cost, userId);
        }

        const result = db.prepare(`
            INSERT INTO companies (user_id, name, income_per_click, upgrade_cost, level)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, name, 1.5, 50, 1);

        return {
            id: result.lastInsertRowid,
            name,
            income_per_click: 1.5,
        };
    }

    static upgradeCompany(userId, companyId) {
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
        const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
            .get(companyId, userId);

        if (!company) throw new Error('Company not found');
        if (user.balance < company.upgrade_cost) throw new Error('Insufficient funds');

        const newLevel = company.level + 1;
        const newIncome = company.income_per_click * 1.5;
        const newCost = company.upgrade_cost * config.GAME.UPGRADE_COST_FACTOR;

        db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?')
            .run(company.upgrade_cost, userId);

        db.prepare(`
            UPDATE companies 
            SET level = ?, income_per_click = ?, upgrade_cost = ?
            WHERE id = ?
        `).run(newLevel, newIncome, newCost, companyId);

        return { level: newLevel, income: newIncome, cost: newCost };
    }

    static deleteCompany(userId, companyId) {
        const count = db.prepare('SELECT COUNT(*) as count FROM companies WHERE user_id = ?')
            .get(userId).count;

        if (count <= 1) {
            throw new Error('Cannot delete your last company');
        }

        db.prepare('DELETE FROM companies WHERE id = ? AND user_id = ?').run(companyId, userId);
    }
}

module.exports = CompanyService;
