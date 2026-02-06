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

    // Check/Seed Lands
    const landsCount = db.prepare('SELECT COUNT(*) as count FROM lands').get().count;
    if (landsCount === 0) {
      const lands = [
        { name: 'Small Apartment', type: 'Residential', value: 5000 },
        { name: 'Downtown Condo', type: 'Residential', value: 25000 },
        { name: 'Tech Office', type: 'Commercial', value: 100000 },
        { name: 'Server Farm', type: 'Industrial', value: 500000 },
        { name: 'Skyscraper', type: 'Commercial', value: 2500000 },
        { name: 'Space Station', type: 'Special', value: 50000000 }
      ];

      const insert = db.prepare('INSERT INTO lands (user_id, name, type, value) VALUES (0, ?, ?, ?)'); // 0 for system owned
      lands.forEach(l => insert.run(l.name, l.type, l.value));
      console.log('✓ Lands seeded');
    }

    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    throw error;
  }
}

module.exports = { seed };
