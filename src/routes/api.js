
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController.js');
const GameController = require('../controllers/gameController.js');

const auth = require('../middlewares/auth.js');

// Auth
router.post('/auth/signup', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', AuthController.me);

// Admin
const AdminController = require('../controllers/adminController.js');
router.get('/admin/data', auth, AdminController.getDashboardData);
router.get('/admin/dashboard', auth, AdminController.getDashboardStats);
router.post('/admin/lock', auth, AdminController.toggleLock);

// Legacy Compatibility
const LegacyController = require('../controllers/legacyController.js');
// router.get('/companies', LegacyController.getCompaniesList); // Use modern one instead
router.post('/partners/request', auth, LegacyController.requestPartnership);
router.post('/partners/accept', auth, LegacyController.acceptPartnership);
// Note: /data/:id is root level in app.js, not here. We need to handle it or expose it here.
// Let's expose it here as /legacy/data/:id and redirect in app logic if needed. 
// Actually, let's keep it clean. 

// Game
router.get('/game/profile', auth, GameController.getProfile);
router.post('/game/click', auth, GameController.click);
router.post('/game/upgrade', auth, GameController.upgrade);
router.post('/game/company', auth, GameController.buyCompany);
router.post('/game/claim-offline-earnings', auth, GameController.claimOfflineEarnings);
router.get('/companies', GameController.searchCompanies);

// Market
const MarketController = require('../controllers/marketController.js');
router.get('/market/lands', auth, MarketController.getLands);
router.post('/market/buy-land', auth, MarketController.buyLand);
router.get('/market/shares', auth, MarketController.getShares);

// Wallet (Legacy compatibility)
router.post('/transfer', auth, GameController.transferFunds);
router.post('/login', AuthController.login); // Map root /login to AuthController.login for wallet compatibility

// Tutorial
const TutorialController = require('../controllers/tutorial.controller.js');
router.get('/game/tutorial-status', auth, TutorialController.getTutorialProgress);
router.post('/game/tutorial-progress', auth, TutorialController.updateTutorialProgress);
router.post('/game/tutorial-complete', auth, TutorialController.completeTutorial);
router.post('/game/tutorial-skip', auth, TutorialController.completeTutorial);

// Rewards/Ads
const RewardsController = require('../controllers/rewards.controller.js');
router.post('/rewards/claim', auth, RewardsController.claimDailyReward);
router.get('/rewards/status', auth, RewardsController.getRewardStatus);

// Ads
const AdsController = require('../controllers/ads.controller.js');
router.get('/ads/status', auth, AdsController.getAdStatus);
router.post('/ads/watch', auth, AdsController.watchAd);

module.exports = router;
