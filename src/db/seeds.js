const db = require('./index.js');

/**
 * Database Seeds
 * Populate initial data for development/testing
 */

function seed() {
  try {
    console.log('Seeding database...');

    // Check if already seeded
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (usersCount > 0) {
      console.log('✓ Database already seeded, skipping');
      return;
    }

    // Create test user
    const testUser = db.prepare(`
      INSERT INTO users (username, password, balance, total_earned, level, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'testuser',
      '$2a$10$dummyhash', // Dummy bcrypt hash
      1000,
      5000,
      5,
      Date.now()
    );

    // Create test company
    db.prepare(`
      INSERT INTO companies (user_id, name, income_per_click, upgrade_cost, level)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      testUser.lastInsertRowid,
      'Test Company',
      10,
      100,
      1
    );

    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    throw error;
  }
}

module.exports = { seed };
