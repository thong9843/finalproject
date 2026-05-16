const pool = require('./backend/src/config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE mous ADD COLUMN activity_id INT, ADD COLUMN file_url VARCHAR(500), ADD FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;');
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
