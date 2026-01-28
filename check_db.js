const db = require('./db.js');

console.log('=== Database Schema ===');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => {
  console.log(`\n--- ${table.name} ---`);
  console.log(table.sql);
});

console.log('\n=== Sample Data ===');
try {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`Users: ${users.count}`);
  
  const companies = db.prepare('SELECT COUNT(*) as count FROM companies').get();
  console.log(`Companies: ${companies.count}`);
  
  const adSessions = db.prepare('SELECT COUNT(*) as count FROM ad_sessions').get();
  console.log(`Ad Sessions: ${adSessions.count}`);
} catch (error) {
  console.error('Error:', error.message);
}

db.close();
