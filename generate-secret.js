// Generate a secure SESSION_SECRET for Railway deployment
const crypto = require('crypto');

const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('\n==============================================');
console.log('🔐 SECURE SESSION SECRET GENERATED');
console.log('==============================================\n');
console.log('Copy this value and set it in Railway Dashboard:');
console.log('\nVariable Name: SESSION_SECRET');
console.log('Variable Value:');
console.log('\n' + sessionSecret);
console.log('\n==============================================');
console.log('⚠️  IMPORTANT: Keep this secret safe!');
console.log('⚠️  Never commit this to GitHub!');
console.log('==============================================\n');
