const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// =====================
// Load Config (Railway-safe)
// =====================
let config;
try {
    config = require('./config/index.js');
} catch (err) {
    console.error('❌ Failed to load config from ./config/index.js');
    console.error(err);
    process.exit(1);
}

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
    secret: config.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Railway يعمل خلف proxy
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// =====================
// Static
// =====================
app.use(express.static(path.join(__dirname, '../public')));

// =====================
// Routes
// =====================
app.use('/api', require('./routes/api'));

// =====================
// Main
// =====================
app.get('/', (req, res) => {
    const file = req.session.userId ? 'home.html' : 'login.html';
    res.sendFile(path.join(__dirname, '../public', file));
});

// =====================
// Errors
// =====================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
