const bcrypt = require('bcryptjs');
const db = require('../db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const AuthService = require('../services/auth.service');
    const user = await AuthService.authenticateUser(username, password);

    if (user) {
      req.session.userId = user.id;
      req.session.role = user.role;
      res.json({ success: true, redirect: '/home.html' });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const AuthService = require('../services/auth.service');

    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    try {
      await AuthService.registerUser(username, password);
      // Auto login after register
      const user = await AuthService.authenticateUser(username, password);
      req.session.userId = user.id;
      req.session.role = user.role;
      res.json({ success: true, redirect: '/home.html' });
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Username already taken" });
      }
      throw e;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
};
