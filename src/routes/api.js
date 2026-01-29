
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const GameController = require('../controllers/gameController');

const auth = require('../middlewares/auth');

// Auth
router.post('/auth/signup', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', AuthController.me);

// Admin
const AdminController = require('../controllers/adminController');
router.get('/admin/dashboard', auth, AdminController.getDashboard);

// Legacy Compatibility
const LegacyController = require('../controllers/legacyController');
router.get('/companies', LegacyController.getCompaniesList); // mapped to /api/companies via app.use('/api')
// Note: /data/:id is root level in app.js, not here. We need to handle it or expose it here.
// Let's expose it here as /legacy/data/:id and redirect in app logic if needed. 
// Actually, let's keep it clean. 

// Game
router.get('/game/profile', auth, GameController.getProfile);
router.post('/game/click', auth, GameController.click);
router.post('/game/upgrade', auth, GameController.upgrade);
router.post('/game/company', auth, GameController.buyCompany);

module.exports = router;
