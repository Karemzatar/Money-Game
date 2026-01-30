const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// ✅ Load config robustly (use absolute path and fail loudly if missing)
const configPath = path.join(__dirname, 'config');
let config;
try {
    config = require(configPath);
} catch (err) {
    console.error('Failed to load configuration from', configPath);
    console.error(err && err.stack ? err.stack : err);
    // Exit early so the server doesn't start in an invalid state
    process.exit(1);
}

const apiRoutes = require('./routes/api');

const app = express();

// =====================
// Security & Parsing
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =====================
// Sessions
// =====================
app.use(session({
    secret: config.SESSION_SECRET || 'dev_secret', // احتياطي
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.ENV === 'production', // true فقط في https
        maxAge: 24 * 60 * 60 * 1000 // 24 ساعة
    }
}));

// =====================
// Static Files
// =====================
app.use(express.static(path.join(__dirname, '../public')));

// =====================
// API Routes
// =====================
app.use('/api', apiRoutes);

// =====================
// Legacy Route
// =====================
const LegacyController = require('./controllers/legacyController');
app.get('/data/:id', LegacyController.getCompanyData);

// =====================
// Main Route
// =====================
app.get('/', (req, res) => {
    const file = req.session.userId
        ? 'home.html'
        : 'login.html';

    res.sendFile(path.join(__dirname, '../public', file));
});

// =====================
// Error Handler
// =====================
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
