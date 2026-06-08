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

        // 1.1 Create tasks table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('Cần làm', 'Đang thực hiện', 'Đang kiểm tra', 'Đã hoàn thành') DEFAULT 'Cần làm',
                priority ENUM('Thấp', 'Trung bình', 'Cao') DEFAULT 'Trung bình',
                due_date DATE DEFAULT NULL,
                assigned_to INT NULL,
                created_by INT NOT NULL,
                faculty_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_deleted TINYINT(1) DEFAULT 0,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✔ tasks table verified/created successfully.');

        // 1.2 Create notes table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) DEFAULT NULL,
                content TEXT NOT NULL,
                color VARCHAR(50) DEFAULT '#fef08a',
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_deleted TINYINT(1) DEFAULT 0,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✔ notes table verified/created successfully.');

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

        // 4. Add faculty_id column to mous if it does not exist
        const [mouColumns] = await pool.query("SHOW COLUMNS FROM `mous` LIKE 'faculty_id'");
        if (mouColumns.length === 0) {
            await pool.query("ALTER TABLE `mous` ADD COLUMN faculty_id INT NULL");
            console.log("✔ Added faculty_id column to mous table.");

            // Add foreign key constraint
            try {
                await pool.query("ALTER TABLE `mous` ADD CONSTRAINT fk_mous_faculties FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE");
                console.log("✔ Added foreign key fk_mous_faculties to mous table.");
            } catch (fkErr) {
                console.error("✖ Error adding foreign key fk_mous_faculties:", fkErr.message);
            }

            // Sync existing data from enterprises.faculty_id
            try {
                const [syncResult] = await pool.query(`
                    UPDATE mous m 
                    JOIN enterprises e ON m.enterprise_id = e.id 
                    SET m.faculty_id = e.faculty_id 
                    WHERE m.faculty_id IS NULL
                `);
                console.log(`✔ Synced faculty_id for existing MOUs. Affected rows: ${syncResult.affectedRows}`);
                
                // Fallback sync for remaining nulls
                await pool.query("UPDATE mous SET faculty_id = 1 WHERE faculty_id IS NULL");
            } catch (syncErr) {
                console.error("✖ Error syncing existing faculty_ids:", syncErr.message);
            }
        }
    } catch (err) {
        console.error('✖ Error performing automatic database migrations:', err.message);
    }
})();

module.exports = pool;
