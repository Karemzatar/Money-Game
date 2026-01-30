const path = require('path');
const fs = require('fs');
const app = require('./app.js');

// 🔹 تأكد وجود config قبل التشغيل
const configPath = path.join(__dirname, 'config');
if (!fs.existsSync(configPath)) {
  console.error('❌ CONFIG FOLDER NOT FOUND:', configPath);
  process.exit(1); // يوقف التطبيق إذا config غير موجود
}

const config = require(configPath);

// 🔹 بدء السيرفر
app.listen(config.PORT, () => {
  console.log(`
🚀 ANTI-GRAVITY ENGINE ONLINE 🚀
===============================
MODE: ${config.ENV}
PORT: ${config.PORT}
DB  : SQLite (WAL Mode)
===============================
  `);
});
