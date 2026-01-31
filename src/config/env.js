const env = require('./env');
const gameConfig = require('./game.config');

if (!env || typeof env !== 'object') {
  throw new Error('❌ env.js must export an object');
}

if (!gameConfig || typeof gameConfig !== 'object') {
  throw new Error('❌ game.config.js must export an object');
}

module.exports = {
  // flat access
  ...env,

  // grouped access
  SERVER: {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    SESSION_SECRET: env.SESSION_SECRET,
    DATABASE_URL: env.DATABASE_URL,
  },

  DISCORD: {
    TOKEN: env.DISCORD_TOKEN,
    CLIENT_ID: env.DISCORD_CLIENT_ID,
    GUILD_ID: env.DISCORD_GUILD_ID,
    ADMIN_ROLE_ID: env.DISCORD_ADMIN_ROLE_ID,
  },

  GAME: gameConfig.GAME,
  RATE_LIMIT: gameConfig.RATE_LIMIT,
  VISA_TIERS: gameConfig.VISA_TIERS,
};
