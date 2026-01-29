
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

// Game
router.get('/game/profile', auth, GameController.getProfile);
router.post('/game/click', auth, GameController.click);
router.post('/game/upgrade', auth, GameController.upgrade);
router.post('/game/company', auth, GameController.buyCompany);

module.exports = router;
