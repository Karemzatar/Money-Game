
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
            const newPassive = (company.passive_income || 5) * 1.4;
            const newCost = company.upgrade_cost * config.GAME.UPGRADE_COST_FACTOR;

            // Update User
            db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);

            // Update Company
            db.prepare(`
                UPDATE companies 
                SET level = ?, income_per_click = ?, passive_income = ?, upgrade_cost = ?
                WHERE id = ?
            `).run(newLevel, newIncome, newPassive, newCost, companyId);

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
                INSERT INTO companies (user_id, name, income_per_click, passive_income, upgrade_cost)
                VALUES (?, ?, ?, ?, ?)
             `).run(userId, name, config.GAME.BASE_INCOME_CLICK * 2, 5, 100);

            return result.lastInsertRowid;
        });
        return tx();
    }

    static getOfflineEarnings(userId) {
        const user = db.prepare('SELECT last_active FROM users WHERE id = ?').get(userId);
        if (!user || !user.last_active) return { amount: 0, hours: 0 };

        const now = Date.now();
        const diffMs = now - user.last_active;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 0.08) return { amount: 0, hours: 0 }; // Less than 5 mins

        const cappedHours = Math.min(diffHours, config.GAME.OFFLINE_CAP_HOURS);

        // Sum passive income
        const companies = db.prepare('SELECT passive_income FROM companies WHERE user_id = ?').all(userId);
        const totalPassive = companies.reduce((sum, c) => sum + (c.passive_income || 0), 0);

        // Earnings = (Passive Income per sec) * seconds * efficiency
        const earnings = totalPassive * (cappedHours * 3600) * config.GAME.OFFLINE_RATE_PERCENT;

        return {
            amount: parseFloat(earnings.toFixed(2)),
            hours: parseFloat(cappedHours.toFixed(1))
        };
    }

    static claimOfflineEarnings(userId) {
        const tx = db.transaction(() => {
            const earnings = this.getOfflineEarnings(userId);
            if (earnings.amount <= 0) return { success: false, amount: 0 };

            db.prepare('UPDATE users SET balance = balance + ?, last_active = ? WHERE id = ?')
                .run(earnings.amount, Date.now(), userId);

            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)')
                .run(userId, 'OFFLINE_CLAIM', earnings.amount, `Collected ${earnings.amount} from ${earnings.hours}h away`);

            return { success: true, amount: earnings.amount };
        });
        return tx();
    }
    static getVisaType(balance) {
        if (balance >= 70000000) return 'visa-5'; // 70M
        if (balance >= 50000000) return 'visa-4'; // 50M
        if (balance >= 10000000) return 'visa-3'; // 10M
        if (balance >= 1000000) return 'visa-2';  // 1M
        if (balance >= 100000) return 'visa-1';   // 100k
        return 'standard';
    }
}

module.exports = GameService;
