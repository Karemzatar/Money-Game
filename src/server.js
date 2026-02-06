'use strict';

const app = require('./app');
const config = require('./config');
const db = require('./db'); // لتهيئة قاعدة البيانات

// ==========================
// PORT SETUP
// ==========================
const PORT = config.PORT || process.env.PORT || 3000;

// ==========================
// DATABASE INIT
// ==========================
// مثال: تشغيل migration تلقائي عند بدء السيرفر
try {
 const { migrate } = require('./db/migrate');
migrate();
  console.log('✅ Database initialized successfully');
} catch (err) {
  console.error('❌ Database initialization failed', err);
}

// ==========================
// START SERVER
// ==========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Money Game running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV || 'development'}`);
});
