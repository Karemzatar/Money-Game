const db = require('../db');

// جلب بيانات الأدمن
exports.getData = (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT id, username AS manager, balance, level
      FROM users
    `).all();

    res.json({
      companies,
      logs: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load admin data' });
  }
};

// قفل / فتح حساب
exports.toggleLock = (req, res) => {
  const { targetId, locked } = req.body;

  try {
    db.prepare(`
      UPDATE users SET locked = ?
      WHERE id = ?
    `).run(locked ? 1 : 0, targetId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
