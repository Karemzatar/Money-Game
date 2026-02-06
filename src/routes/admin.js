const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const adminController = require('../controllers/adminController');

// كل شي هنا Admin فقط
router.use(auth, requireRole('admin'));

router.get('/data', adminController.getDashboardData);
router.post('/lock', adminController.toggleLock);
router.post('/role', adminController.setRole);

module.exports = router;
