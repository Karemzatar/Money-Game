const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function migrate() {
    if (!fs.existsSync('companies.json')) return;

    const companiesData = JSON.parse(fs.readFileSync('companies.json', 'utf8'));
    const dummyPassword = await bcrypt.hash('password123', 10);

    for (const oldComp of companiesData) {
        try {
            // Check if user exists
            let user = db.prepare('SELECT id FROM users WHERE username = ?').get(oldComp.manager);
            if (!user) {
                const info = db.prepare('INSERT INTO users (username, password, balance, level) VALUES (?, ?, ?, ?)').run(
                    oldComp.manager,
                    dummyPassword,
                    0, // We reset balance for the user, but we'll add companies
                    1
                );
                user = { id: info.lastInsertRowid };
            }

            // Add company
            db.prepare('INSERT INTO companies (user_id, name, income_per_click, level, upgrade_cost) VALUES (?, ?, ?, ?, ?)').run(
                user.id,
                oldComp.company,
                (oldComp.level || 1) * 2,
                oldComp.level || 1,
                (oldComp.level || 1) * 100
            );
            console.log(`Migrated company ${oldComp.company} for user ${oldComp.manager}`);
        } catch (err) {
            console.error(`Error migrating ${oldComp.company}:`, err.message);
        }
    }
}

migrate();
