const pool = require('./backend/src/config/db');

async function test() {
    const [rows] = await pool.query('SELECT a.id, a.title, a.enterprise_id FROM activities a;');
    console.log(rows);
    process.exit(0);
}
test();
