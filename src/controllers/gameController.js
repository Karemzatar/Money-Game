
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

    static buyCompany(req, res) {
        try {
            const { name } = req.body;
            const id = GameService.createCompany(req.session.userId, name);
            res.json({ success: true, id });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = GameController;
