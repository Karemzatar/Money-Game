const env = require('./env.js');
const gameConfig = require('./game.config.js');

module.exports = {
  ...env,
  ...gameConfig,
  
  // Additional merged configurations
  SERVER: {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    SESSION_SECRET: env.SESSION_SECRET,
    DATABASE_URL: env.DATABASE_URL
  },
  
  DISCORD: {
    TOKEN: env.DISCORD_TOKEN,
    CLIENT_ID: env.DISCORD_CLIENT_ID,
    GUILD_ID: env.DISCORD_GUILD_ID,
    ADMIN_ROLE_ID: env.DISCORD_ADMIN_ROLE_ID
  },
  
  GAME: gameConfig.GAME,
  RATE_LIMIT: gameConfig.RATE_LIMIT,
  VISA_TIERS: gameConfig.VISA_TIERS
};
