const db = require('../db/index.js');

class TutorialService {
    static getProgress(userId) {
        return db.prepare('SELECT * FROM tutorial_progress WHERE user_id = ?').get(userId);
    }

    static updateProgress(userId, step) {
        const existing = db.prepare('SELECT * FROM tutorial_progress WHERE user_id = ?').get(userId);

        if (existing) {
            db.prepare('UPDATE tutorial_progress SET completed_steps = ? WHERE user_id = ?')
                .run(step, userId);
        } else {
            db.prepare('INSERT INTO tutorial_progress (user_id, completed_steps) VALUES (?, ?)')
                .run(userId, step);
        }

        return { success: true };
    }

    static completeTutorial(userId) {
        db.prepare('UPDATE tutorial_progress SET completed = 1 WHERE user_id = ?').run(userId);
        return { success: true };
    }

    static isTutorialComplete(userId) {
        const progress = db.prepare('SELECT completed FROM tutorial_progress WHERE user_id = ?').get(userId);
        return progress?.completed === 1;
    }
}

module.exports = TutorialService;
