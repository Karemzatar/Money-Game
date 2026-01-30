#!/usr/bin/env node

/**
 * Fix Config Module Error
 * This script creates the missing config/index.js file to fix the module resolution error
 */

const fs = require('fs');
const path = require('path');

// Create config/index.js file
const configDir = path.join(__dirname, 'src', 'config');
const configIndexPath = path.join(configDir, 'index.js');

const configContent = `const env = require('./env.js');
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
`;

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('Created config directory:', configDir);
}

// Write config/index.js
try {
  fs.writeFileSync(configIndexPath, configContent, 'utf8');
  console.log('✅ Created config/index.js successfully');
  console.log('📍 Path:', configIndexPath);
} catch (error) {
  console.error('❌ Failed to create config/index.js:', error.message);
  
  // Alternative: create in root if src is not writable
  const rootConfigPath = path.join(__dirname, 'config.js');
  try {
    fs.writeFileSync(rootConfigPath, configContent, 'utf8');
    console.log('✅ Created config.js in root directory instead');
    console.log('📍 Path:', rootConfigPath);
  } catch (rootError) {
    console.error('❌ Failed to create config.js in root:', rootError.message);
    process.exit(1);
  }
}

console.log('🔧 Config module fix completed!');
console.log('🚀 You can now restart the server.');
