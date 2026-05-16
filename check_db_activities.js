const pool = require('./backend/src/config/db');
async function check() {
    try {
        const [rows] = await pool.query('DESCRIBE activities;');
        console.log('Columns in activities:', rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
check();
