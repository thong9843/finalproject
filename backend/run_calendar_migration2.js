const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Running migration...');
        
        const queries = [
            'ALTER TABLE activities ADD COLUMN start_time TIME NULL;',
            'ALTER TABLE activities ADD COLUMN end_time TIME NULL;',
            'ALTER TABLE activities ADD COLUMN person_in_charge VARCHAR(255) NULL;',
            'ALTER TABLE activities ADD COLUMN tasks JSON NULL;'
        ];
        
        for (let q of queries) {
            try {
                await pool.query(q);
                console.log('Executed:', q);
            } catch (e) {
                console.log('Skipped or Error:', e.message);
            }
        }
        console.log('Migration complete');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
migrate();