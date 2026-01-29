class TutorialController {
    static async getTutorialProgress(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const progress = db.prepare('SELECT * FROM tutorial_progress WHERE user_id = ?')
                .get(userId) || { user_id: userId, completed_steps: [] };

            res.json({ success: true, progress });
        } catch (error) {
            console.error('Get tutorial progress error:', error);
            res.status(500).json({ error: 'Failed to get progress' });
        }
    }

    static async updateTutorialProgress(req, res) {
        try {
            const userId = req.session.userId;
            const { step } = req.body;

            if (!step) {
                return res.status(400).json({ error: 'Step required' });
            }

            const db = require('../db/index.js');

            // Update or insert progress
            const existing = db.prepare('SELECT * FROM tutorial_progress WHERE user_id = ?').get(userId);
            
            if (existing) {
                db.prepare('UPDATE tutorial_progress SET completed_steps = ? WHERE user_id = ?')
                    .run(step, userId);
            } else {
                db.prepare('INSERT INTO tutorial_progress (user_id, completed_steps) VALUES (?, ?)')
                    .run(userId, step);
            }

            res.json({ success: true, message: 'Progress updated' });
        } catch (error) {
            console.error('Update tutorial progress error:', error);
            res.status(500).json({ error: 'Failed to update progress' });
        }
    }

    static async completeTutorial(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            db.prepare('UPDATE tutorial_progress SET completed = 1 WHERE user_id = ?').run(userId);

            res.json({ success: true, message: 'Tutorial completed' });
        } catch (error) {
            console.error('Complete tutorial error:', error);
            res.status(500).json({ error: 'Failed to complete tutorial' });
        }
    }
}

module.exports = TutorialController;
