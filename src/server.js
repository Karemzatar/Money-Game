const path = require('path');
const app = require('./app.js');
const config = require(path.join(__dirname, 'config'));

app.listen(config.PORT, () => {
  console.log(`
    🚀 ANTI-GRAVITY ENGINE ONLINE 🚀
    ================================
    MODE: ${config.ENV}
    PORT: ${config.PORT}
    DB  : SQLite (WAL Mode)
    ================================
    `);
});
