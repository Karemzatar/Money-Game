const db = require('./index.js');

/**
 * Database Migrations
 * Run all pending migrations
 */

function migrate() {
  try {
    console.log('Running database migrations...');

    // Ensure all tables are created (init() in index.js handles this)
    // This is a placeholder for any additional migration logic

    console.log('✓ Migrations completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

module.exports = { migrate };
