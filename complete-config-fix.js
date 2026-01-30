#!/usr/bin/env node

/**
 * Complete Config Module Fix
 * This script fixes all config require issues in the src/ directory structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting complete config module fix...\n');

// 1. Ensure config/index.js exists
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

// Create config directory if needed
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('✅ Created config directory');
}

// Write config/index.js
try {
  fs.writeFileSync(configIndexPath, configContent, 'utf8');
  console.log('✅ Created config/index.js');
} catch (error) {
  console.error('❌ Failed to create config/index.js:', error.message);
  process.exit(1);
}

// 2. Verify app.js config require
const appJsPath = path.join(__dirname, 'src', 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const appJsFix = `// ✅ Load config robustly (use absolute path and fail loudly if missing)
const configPath = path.join(__dirname, 'config', 'index.js');`;

if (!appJsContent.includes("config', 'index.js'")) {
  appJsContent = appJsContent.replace(
    /const configPath = path\.join\(__dirname, 'config'\);/,
    "const configPath = path.join(__dirname, 'config', 'index.js');"
  );
  fs.writeFileSync(appJsPath, appJsContent, 'utf8');
  console.log('✅ Fixed app.js config require path');
} else {
  console.log('✅ app.js already has correct config path');
}

// 3. Verify server.js config require
const serverJsPath = path.join(__dirname, 'src', 'server.js');
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

const serverJsFix = `const configPath = path.join(__dirname, 'config', 'index.js');`;

if (!serverJsContent.includes("config', 'index.js'")) {
  serverJsContent = serverJsContent.replace(
    /const configPath = path\.join\(__dirname, 'config'\);/,
    "const configPath = path.join(__dirname, 'config', 'index.js');"
  );
  fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');
  console.log('✅ Fixed server.js config require path');
} else {
  console.log('✅ server.js already has correct config path');
}

// 4. Update error messages
serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
if (serverJsContent.includes('CONFIG FOLDER NOT FOUND')) {
  serverJsContent = serverJsContent.replace(
    'CONFIG FOLDER NOT FOUND',
    'CONFIG FILE NOT FOUND'
  );
  fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');
  console.log('✅ Updated server.js error message');
}

console.log('\n🎉 Complete config module fix finished!');
console.log('\n📋 Summary of changes:');
console.log('  ✅ Created src/config/index.js');
console.log('  ✅ Fixed src/app.js config require path');
console.log('  ✅ Fixed src/server.js config require path');
console.log('  ✅ Updated error messages for clarity');
console.log('\n🚀 Ready for deployment!');
console.log('\n📝 Next steps:');
console.log('  1. git add .');
console.log('  2. git commit -m "Fix config module resolution errors"');
console.log('  3. git push origin main');
