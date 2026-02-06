const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config');
const apiRouter = require('./routes/api');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ==========================
// MIDDLEWARES
// ==========================
const authMiddleware = require('./middlewares/auth.middleware');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// SESSION CONFIGURATION
app.use(
  session({
    secret: config.SESSION_SECRET || 'money-game-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    },
  })
);

// STATIC FILES
app.use(express.static(path.join(__dirname, '../public')));

// ==========================
// ROUTES
// ==========================
app.use('/api', apiRouter);

// Login / Signup pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));

// Admin page (protected)
app.get(
  '/admin',
  authMiddleware,
  (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html'))
);

// Legacy route
const LegacyController = require('./controllers/legacyController');
app.get('/data/:id', LegacyController.getCompanyData);

// Root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public', 'index.html')));

// Error middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
