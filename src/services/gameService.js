
const db = require('../db/index.js');
const config = require('../config/index.js');

class GameService {
    /**
     * Core click logic with transaction safety
     */
    static processClick(userId) {
        // Use a synchronous transaction for integrity
        const tx = db.transaction(() => {
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            if (!user) throw new Error('User not found');

            // Calculate income
            let companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);
            let income = config.GAME.BASE_INCOME_CLICK + (user.level * config.GAME.LEVEL_MULTIPLIER);

            companies.forEach(c => income += c.income_per_click);

            // Multiplier check
            if (user.multiplier_until > Date.now()) {
                income *= user.multiplier_value;
            }

            const newBalance = user.balance + income;
            const newTotal = user.total_earned + income;

            // Level calc (basic sqrt curve)
            const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1;

            // Update user
            db.prepare(`
                UPDATE users 
                SET balance = ?, total_earned = ?, level = ?, last_active = ?
                WHERE id = ?
            `).run(newBalance, newTotal, newLevel, Date.now(), userId);

            // Log if significant? Maybe skip for every click to save DB space
            // Or log only sometimes. For now, we skip per-click tx logging for performance

            return {
                balance: newBalance,
                level: newLevel,
                earned: income,
                leveledUp: newLevel > user.level
            };
        });

        return tx();
    }

    static processUpgrade(userId, companyId) {
        const tx = db.transaction(() => {
            const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?').get(companyId, userId);

            if (!company) throw new Error('Company not found');
            if (user.balance < company.upgrade_cost) throw new Error('Insufficient funds');

            // Logic
            const newBalance = user.balance - company.upgrade_cost;
            const newLevel = company.level + 1;
            const newIncome = company.income_per_click * 1.5;
            const newCost = company.upgrade_cost * config.GAME.UPGRADE_COST_FACTOR;

            // Update User
            db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);

            // Update Company
            db.prepare(`
                UPDATE companies 
                SET level = ?, income_per_click = ?, upgrade_cost = ?
                WHERE id = ?
            `).run(newLevel, newIncome, newCost, companyId);

            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                userId, 'UPGRADE', -company.upgrade_cost, `Upgraded ${company.name} to level ${newLevel}`
            );

            return {
                companyId,
                newLevel,
                newIncome,
                newCost,
                newBalance
            };
        });

        return tx();
    }

    static createCompany(userId, name) {
        const tx = db.transaction(() => {
            const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            const cost = config.GAME.COMPANY_BASE_COST;

            if (user.balance < cost) throw new Error('Insufficient funds');

            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(cost, userId);

            const result = db.prepare(`
                INSERT INTO companies (user_id, name, income_per_click, upgrade_cost)
                VALUES (?, ?, ?, ?)
             `).run(userId, name, config.GAME.BASE_INCOME_CLICK * 2, 100);

            return result.lastInsertRowid;
        });
        return tx();
    }
}

module.exports = GameService;
