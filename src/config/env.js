require('dotenv').config(); // مهم محليًا (Railway يتجاهله)

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENV: process.env.NODE_ENV || 'development',

  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_secret',

  DATABASE_URL: process.env.DATABASE_URL || '',

  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID,
};
