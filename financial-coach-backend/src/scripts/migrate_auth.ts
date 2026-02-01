import db from '../database/db';
import bcrypt from 'bcrypt';

async function migrate() {
    console.log('Starting migration...');

    // 1. Create Users Table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('Users table created.');

    // 2. Create Default User (admin)
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(adminPassword, saltRounds);

    try {
        const insertUser = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        const result = insertUser.run(adminUsername, hash);
        console.log(`Default user '${adminUsername}' created with ID: ${result.lastInsertRowid}`);
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            console.log(`User '${adminUsername}' already exists. Skipping creation.`);
        } else {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Get Admin ID
    const userStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const adminUser = userStmt.get(adminUsername) as { id: number };
    const adminId = adminUser.id;

    // 3. Add user_id to tables if not exists
    const tables = ['transactions', 'goals', 'subscriptions'];

    for (const table of tables) {
        try {
            // Check if column exists
            const tableInfo = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
            const hasUserId = tableInfo.some((col: any) => col.name === 'user_id');

            if (!hasUserId) {
                console.log(`Adding user_id to ${table}...`);
                db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER REFERENCES users(id)`);

                // 4. Update existing records
                console.log(`Migrating data for ${table}...`);
                const updateStmt = db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`);
                const info = updateStmt.run(adminId);
                console.log(`Updated ${info.changes} records in ${table} to user_id ${adminId}`);
            } else {
                console.log(`Column user_id already exists in ${table}.`);

                // Ensure nulls are filled anyway
                const updateStmt = db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`);
                const info = updateStmt.run(adminId);
                if (info.changes > 0) {
                    console.log(`Backfilled ${info.changes} records in ${table} with null user_id`);
                }
            }

        } catch (error) {
            console.error(`Error migrating ${table}:`, error);
        }
    }

    console.log('Migration complete.');
}

migrate();
