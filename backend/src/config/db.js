const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vlu_enterprise_link',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auto migration on startup
(async () => {
    try {
        // 1. Create action_history if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS action_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE') NOT NULL,
                entity_type ENUM('ENTERPRISE', 'MOU', 'ACTIVITY', 'STUDENT') NOT NULL,
                entity_id INT NOT NULL,
                entity_name VARCHAR(255) NOT NULL,
                faculty_id INT NULL,
                changed_by INT NULL,
                old_value JSON DEFAULT NULL,
                new_value JSON DEFAULT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✔ action_history table verified/created successfully.');

        // 2. Add is_deleted columns if they do not exist
        const tables = ['enterprises', 'activities', 'mous', 'students'];
        for (const table of tables) {
            const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE 'is_deleted'`);
            if (columns.length === 0) {
                await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN is_deleted TINYINT(1) DEFAULT 0`);
                console.log(`✔ Added is_deleted column to table ${table}.`);
            }
        }

        // 3. Add tags column to users if it does not exist
        const [userColumns] = await pool.query("SHOW COLUMNS FROM `users` LIKE 'tags'");
        if (userColumns.length === 0) {
            await pool.query("ALTER TABLE `users` ADD COLUMN tags VARCHAR(500) DEFAULT NULL");
            console.log("✔ Added tags column to users table.");
        }
    } catch (err) {
        console.error('✖ Error performing automatic database migrations:', err.message);
    }
})();

module.exports = pool;
