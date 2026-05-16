const pool = require('./backend/src/config/db');

async function migrate() {
    try {
        console.log('Adding activity_id...');
        await pool.query('ALTER TABLE mous ADD COLUMN activity_id INT;');
        
        console.log('Adding file_url...');
        await pool.query('ALTER TABLE mous ADD COLUMN file_url VARCHAR(500);');
        
        console.log('Adding Foreign Key...');
        await pool.query('ALTER TABLE mous ADD CONSTRAINT fk_mous_activities FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;');
        
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        process.exit();
    }
}

migrate();
