
const bcrypt = require('bcryptjs');
const UserService = require('../services/userService');
const GameService = require('../services/gameService');

class AuthController {
    static async register(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ error: "Missing fields" });
            if (password.length < 6) return res.status(400).json({ error: "Password too short" });

            const existing = await UserService.findByUsername(username);
            if (existing) return res.status(400).json({ error: "Username taken" });

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = await UserService.create(username, hashedPassword);

            // Create initial company as bonus
            await GameService.createCompany(userId, `${username}'s Startup`, true); // Free logic needs bypass handling or simple insert
            // Actually, let's just insert a free starter company directly to avoid paying
            const db = require('../db');
            db.prepare(`
                INSERT INTO companies (user_id, name, income_per_click, upgrade_cost) 
                VALUES (?, ?, ?, ?)
            `).run(userId, `${username}'s First Venture`, 1.5, 50);

            req.session.userId = userId;
            res.json({ success: true, userId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Registration failed" });
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await UserService.findByUsername(username);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            req.session.userId = user.id;
            UserService.updateActivity(user.id);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Login failed" });
        }
    }

    static logout(req, res) {
        req.session.destroy();
        res.json({ success: true });
    }

    static async me(req, res) {
        if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
        const user = await UserService.findById(req.session.userId);
        res.json(user);
    }
}

module.exports = AuthController;
