require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || './data/game.db',
  SESSION_SECRET: process.env.SESSION_SECRET || 'anti-gravity-core-secret-999',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID || '',
};
