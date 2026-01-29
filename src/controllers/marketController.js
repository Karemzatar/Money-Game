
const db = require('../db');

class MarketController {
    static async getLands(req, res) {
        try {
            const lands = db.prepare('SELECT * FROM lands').all();
            res.json(lands);
        } catch (err) {
            res.status(500).json({ error: "Market Error" });
        }
    }

    static async buyLand(req, res) {
        const { landId } = req.body;
        const userId = req.session.userId;

        const tx = db.transaction(() => {
            const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            const land = db.prepare('SELECT * FROM lands WHERE id = ?').get(landId);

            if (!land) throw new Error('Land not found');
            if (user.balance < land.value) throw new Error('Insufficient funds');

            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(land.value, userId);
            db.prepare('UPDATE lands SET user_id = ? WHERE id = ?').run(userId, landId);

            db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)').run(
                userId, 'PURCHASE', -land.value, `Purchased land: ${land.name}`
            );

            return { success: true };
        });

        try {
            res.json(tx());
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getShares(req, res) {
        try {
            const shares = db.prepare('SELECT * FROM shares WHERE user_id = ?').all(req.session.userId);
            res.json(shares);
        } catch (err) {
            res.status(500).json({ error: "Market Error" });
        }
    }

    static async tradeShares(req, res) {
        const { symbol, amount, action } = req.body; // action: 'buy' or 'sell'
        const userId = req.session.userId;

        // This is a simplified trading logic
        res.json({ success: true, message: "Simulated trade complete" });
    }
}

module.exports = MarketController;
