const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const gameController = require('../controllers/gameController');
const companyController = require('../controllers/company.controller'); // Added
const marketController = require('../controllers/marketController');   // Added
const adsController = require('../controllers/ads.controller');
const rewardsController = require('../controllers/rewards.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// AUTH
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register); // Added
router.post('/auth/logout', authController.logout);

// ADMIN
router.get('/admin/data', adminController.getData);
router.post('/admin/lock', adminController.toggleLock);

// GAME - Protected routes
router.use('/game', authMiddleware);

router.get('/game/profile', gameController.getProfile);
router.post('/game/click', gameController.click);
router.post('/game/upgrade', gameController.upgrade);
router.post('/game/buy-company', gameController.buyCompany);
router.get('/game/search-companies', gameController.searchCompanies); // Added back
router.post('/game/transfer-funds', gameController.transferFunds);
router.post('/game/claim-offline-earnings', gameController.claimOfflineEarnings);
router.post('/game/paypal/verify', gameController.verifyPayment); // PayPal

// COMPANY & PARTNERSHIPS
router.get('/game/companies', companyController.listCompanies);
router.get('/game/companies/:companyId', companyController.getCompanyDetails);
router.delete('/game/companies/:companyId', companyController.deleteCompany);
router.post('/game/partners/request', companyController.requestPartnership);
router.post('/game/partners/respond', companyController.respondPartnership);
router.get('/game/partners', companyController.listPartners);

// MARKET / REAL ESTATE / STOCKS
router.get('/game/lands', marketController.getLands);
router.post('/game/lands/buy', marketController.buyLand);
router.get('/game/shares', marketController.getShares);
// router.post('/game/shares/trade', marketController.tradeShares); // If implemented

// ADS
router.post('/game/ad-start', adsController.watchAd);
router.get('/game/ad-status', adsController.getAdStatus);

// REWARDS
router.post('/game/claim-daily-reward', rewardsController.claimDailyReward);
router.get('/game/reward-status', rewardsController.getRewardStatus);

module.exports = router;
