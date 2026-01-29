
const app = require('./app');
const config = require('./config');

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
