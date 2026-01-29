const GameService = require('../services/gameService.js');

class GameController {
    static async getProfile(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');
            
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?').all(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    balance: user.balance,
                    totalEarned: user.total_earned,
                    level: user.level,
                    lastActive: user.last_active,
                },
                companies,
            });
        } catch (error) {
            console.error('GetProfile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    static async click(req, res) {
        try {
            const userId = req.session.userId;
            const result = GameService.processClick(userId);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Click error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async upgrade(req, res) {
        try {
            const userId = req.session.userId;
            const { companyId } = req.body;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID required' });
            }

            const result = GameService.processUpgrade(userId, companyId);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Upgrade error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async buyCompany(req, res) {
        try {
            const userId = req.session.userId;
            const { companyName } = req.body;

            if (!companyName) {
                return res.status(400).json({ error: 'Company name required' });
            }

            const result = GameService.createCompany(userId, companyName, false);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Buy company error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async searchCompanies(req, res) {
        try {
            const { query } = req.query;
            const db = require('../db/index.js');

            let companies;
            if (query) {
                companies = db.prepare(`
                    SELECT * FROM companies 
                    WHERE name LIKE ? 
                    LIMIT 20
                `).all(`%${query}%`);
            } else {
                companies = db.prepare('SELECT * FROM companies LIMIT 20').all();
            }

            res.json({ success: true, companies });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }

    static async transferFunds(req, res) {
        try {
            const userId = req.session.userId;
            const { recipientId, amount } = req.body;

            if (!recipientId || !amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid transfer parameters' });
            }

            const db = require('../db/index.js');
            const sender = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            
            if (!sender || sender.balance < amount) {
                return res.status(400).json({ error: 'Insufficient funds' });
            }

            // Execute transfer
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, recipientId);

            res.json({ success: true, message: 'Transfer completed' });
        } catch (error) {
            console.error('Transfer error:', error);
            res.status(500).json({ error: 'Transfer failed' });
        }
    }
}

module.exports = GameController;
