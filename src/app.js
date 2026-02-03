const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// =====================
// Load Config (SAFE)
// =====================
let config;
try {
    // بما إن app.js داخل src
    // و config داخل src/config
    config = require('./config');
} catch (err) {
    console.error('❌ Failed to load config from src/config/index.js');
    console.error(err);
    process.exit(1);
}

// =====================
// Init App
// =====================
const app = express();

// =====================
// Middlewares
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =====================
// Sessions
// =====================
app.use(session({
    name: 'money-game.sid',
    secret: config.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24h
    }
}));

// =====================
// Static Files
// =====================
app.use(express.static(path.join(__dirname, '../public')));

// =====================
// Routes
// =====================
const apiRoutes = require('./routes/api');
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
    const file = req.session.userId ? 'home.html' : 'login.html';
    res.sendFile(path.join(__dirname, '../public', file));
});

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({
        error: 'Internal Server Error'
    });
});

module.exports = app;
