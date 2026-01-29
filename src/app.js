
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/index.js');
const apiRoutes = require('./routes/api.js');

const app = express();

// Security & Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sessions
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static Files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Legacy Data Route
const LegacyController = require('./controllers/legacyController.js');
app.get('/data/:id', LegacyController.getCompanyData);

// Fallback for SPA (if we go that route, otherwise serve pages directly)
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, '../public/home.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/login.html')); // Login page
    }
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
