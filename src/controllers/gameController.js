
const GameService = require('../services/gameService.js');
const db = require('../db/index.js');

class GameController {
    static async getProfile(req, res) {
        try {
            const userId = req.session.userId;
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

            const offlineEarnings = GameService.getOfflineEarnings(userId);

            res.json({
                user: {
                    username: user.username,
                    balance: user.balance,
                    level: user.level,
                    msg: "Welcome back commander"
                },
                companies,
                offlineEarnings
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static click(req, res) {
        try {
            const result = GameService.processClick(req.session.userId);
            res.json({ success: true, ...result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static upgrade(req, res) {
        try {
            const { companyId } = req.body;
            const result = GameService.processUpgrade(req.session.userId, companyId);
            res.json({ success: true, ...result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static buyCompany(req, res) {
        try {
            const { companyName } = req.body;
            if (!companyName) return res.status(400).json({ error: 'Company name required' });

            const db = require('../db/index.js');
            const userId = req.session.userId;

            // Simple creation with default values
            const result = db.prepare(`
                INSERT INTO companies (user_id, name, income_per_click, upgrade_cost, level)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, companyName, 1.5, 50, 1);

            res.json({ success: true, companyId: result.lastInsertRowid });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static searchCompanies(req, res) {
        try {
            const { query } = req.query;
            const db = require('../db/index.js');

            let companies;
            if (query) {
                companies = db.prepare('SELECT * FROM companies WHERE name LIKE ? LIMIT 50').all(`%${query}%`);
            } else {
                companies = db.prepare('SELECT * FROM companies LIMIT 50').all();
            }

            res.json({ success: true, companies });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async transferFunds(req, res) {
        const { recipientId, amount } = req.body;
        const senderId = req.session.userId;
        const transferAmount = parseFloat(amount);

        if (!transferAmount || transferAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

        const tx = db.transaction(() => {
            const sender = db.prepare('SELECT balance FROM users WHERE id = ?').get(senderId);
            if (sender.balance < transferAmount) throw new Error('Insufficient funds');

            // Find recipient by name or ID
            const recipient = db.prepare('SELECT id FROM users WHERE username = ? OR id = ?').get(recipientId, recipientId);
            if (!recipient) throw new Error('Recipient not found');
            if (recipient.id === senderId) throw new Error('Cannot send to yourself');

            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(transferAmount, senderId);
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(transferAmount, recipient.id);

            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                senderId, 'TRANSFER_OUT', -transferAmount, `Transfer to ${recipientId}`
            );
            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                recipient.id, 'TRANSFER_IN', transferAmount, `Transfer from ${senderId}`
            );

            return { success: true, newBalance: sender.balance - transferAmount };
        });

        try {
            res.json(tx());
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async searchCompanies(req, res) {
        const q = req.query.q;
        let results;
        if (q) {
            results = db.prepare('SELECT id, username as company, balance, level FROM users WHERE username LIKE ? LIMIT 10').all(`%${q}%`);
        } else {
            results = db.prepare('SELECT id, username as company, balance, level FROM users ORDER BY balance DESC LIMIT 10').all();
        }
        res.json(results);
    }

    static async claimOfflineEarnings(req, res) {
        try {
            const userId = req.session.userId;
            const result = GameService.claimOfflineEarnings(userId);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = GameController;
