
const GameService = require('../services/gameService');
const db = require('../db');

class GameController {
    static async getProfile(req, res) {
        try {
            const userId = req.session.userId;
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);

            res.json({
                user: {
                    username: user.username,
                    balance: user.balance,
                    level: user.level,
                    msg: "Welcome back commander"
                },
                companies
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
        if (!q) return res.json([]);
        const results = db.prepare('SELECT id, username as company, balance, level FROM users WHERE username LIKE ? LIMIT 10').all(`%${q}%`);
        res.json(results);
    }
}

module.exports = GameController;
